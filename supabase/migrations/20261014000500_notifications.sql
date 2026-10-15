-- Budget-alert and weekly-recap emails, sent by the `notify` Edge Function via pg_cron + pg_net.

-- IANA time zone set by the app; "this month" and "Monday morning" are local to the user.
alter table public.profiles add column timezone text not null default 'UTC';

-- The primary key makes sending idempotent: overlapping runs can't both claim the same email.
create table public.notification_log (
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('budget_alert', 'weekly_recap')),
  -- e.g. '2026-10' for a monthly alert, '2026-W42' for a weekly recap
  period text not null,
  sent_at timestamptz not null default now(),
  primary key (user_id, kind, period)
);

alter table public.notification_log enable row level security;
-- No policies: only the service role (the Edge Function) touches this table.
revoke all on public.notification_log from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Who is due an email right now? (service role only)
-- ---------------------------------------------------------------------------

create or replace function public.budget_alert_candidates()
returns table (
  user_id uuid, email text, first_name text, currency text, timezone text,
  monthly_limit bigint, alert_threshold numeric, spent bigint, period text
)
language sql
stable
security definer
set search_path = ''
as $$
  with users as (
    select b.user_id, b.monthly_limit, b.alert_threshold, p.first_name, p.currency, u.email,
      -- An unknown zone name would make the whole query fail for everyone; fall back to UTC.
      coalesce((select z.name from pg_catalog.pg_timezone_names z where z.name = p.timezone), 'UTC') as timezone
    from public.budgets b
    join public.profiles p on p.id = b.user_id
    join auth.users u on u.id = b.user_id
    where b.email_alerts and u.email is not null
  ),
  local as (
    select *, date_trunc('month', now() at time zone timezone) as month_start_local from users
  )
  select
    l.user_id, l.email, l.first_name, l.currency, l.timezone, l.monthly_limit, l.alert_threshold,
    coalesce(sum(t.amount), 0)::bigint as spent,
    to_char(l.month_start_local, 'YYYY-MM') as period
  from local l
  left join public.transactions t
    on t.user_id = l.user_id and t.type = 'expense'
    and t.date >= (l.month_start_local at time zone l.timezone)
  group by l.user_id, l.email, l.first_name, l.currency, l.timezone, l.monthly_limit, l.alert_threshold, l.month_start_local
  having coalesce(sum(t.amount), 0) >= l.monthly_limit * l.alert_threshold
    and not exists (
      select 1 from public.notification_log n
      where n.user_id = l.user_id and n.kind = 'budget_alert' and n.period = to_char(l.month_start_local, 'YYYY-MM')
    );
$$;

-- Due from Monday 8:00 local time; the recap covers the previous Mon–Sun.
create or replace function public.weekly_recap_candidates()
returns table (
  user_id uuid, email text, first_name text, currency text, timezone text,
  week_start timestamptz, week_end timestamptz, period text
)
language sql
stable
security definer
set search_path = ''
as $$
  with users as (
    select p.id as user_id, u.email, p.first_name, p.currency,
      coalesce((select z.name from pg_catalog.pg_timezone_names z where z.name = p.timezone), 'UTC') as timezone
    from public.profiles p
    join auth.users u on u.id = p.id
    where p.notify_weekly_recap and u.email is not null
  ),
  local as (
    select *, now() at time zone timezone as local_now from users
  )
  select
    l.user_id, l.email, l.first_name, l.currency, l.timezone,
    (date_trunc('week', l.local_now) - interval '7 days') at time zone l.timezone as week_start,
    date_trunc('week', l.local_now) at time zone l.timezone as week_end,
    to_char(l.local_now, 'IYYY-"W"IW') as period
  from local l
  where extract(isodow from l.local_now) = 1
    and extract(hour from l.local_now) >= 8
    and not exists (
      select 1 from public.notification_log n
      where n.user_id = l.user_id and n.kind = 'weekly_recap' and n.period = to_char(l.local_now, 'IYYY-"W"IW')
    );
$$;

revoke execute on function public.budget_alert_candidates() from anon, authenticated, public;
revoke execute on function public.weekly_recap_candidates() from anon, authenticated, public;
grant execute on function public.budget_alert_candidates() to service_role;
grant execute on function public.weekly_recap_candidates() to service_role;

-- ---------------------------------------------------------------------------
-- Schedule. The cron secret is generated in-database and kept in Vault, never in code or git.
-- ---------------------------------------------------------------------------

create extension if not exists pg_cron;
create extension if not exists pg_net;

do $$
begin
  if not exists (select 1 from vault.secrets where name = 'monivo_cron_secret') then
    perform vault.create_secret(
      replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
      'monivo_cron_secret',
      'Authenticates scheduled calls to the notify Edge Function'
    );
  end if;
end;
$$;

create or replace function public.check_cron_secret(p_secret text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from vault.decrypted_secrets where name = 'monivo_cron_secret' and decrypted_secret = p_secret
  );
$$;

revoke execute on function public.check_cron_secret(text) from anon, authenticated, public;
grant execute on function public.check_cron_secret(text) to service_role;

create or replace function public.invoke_notify(p_mode text)
returns void
language sql
security definer
set search_path = ''
as $$
  select net.http_post(
    url := 'https://mipycjyywonzhgkgcyfc.supabase.co/functions/v1/notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'monivo_cron_secret')
    ),
    body := jsonb_build_object('mode', p_mode),
    timeout_milliseconds := 60000
  );
$$;

revoke execute on function public.invoke_notify(text) from anon, authenticated, public;

select cron.schedule('monivo-budget-alerts', '*/15 * * * *', $$ select public.invoke_notify('budget') $$);
select cron.schedule('monivo-weekly-recap', '5 * * * *', $$ select public.invoke_notify('recap') $$);
