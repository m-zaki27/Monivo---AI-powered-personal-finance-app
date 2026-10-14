-- Per-user daily AI allowance. Gemini's free tier is one shared quota for the
-- whole project, so one busy user mustn't be able to use it all up.

create table public.ai_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  kind text not null check (kind in ('scan', 'voice', 'assistant')),
  count int not null default 0,
  primary key (user_id, day, kind)
);

alter table public.ai_usage enable row level security;

create policy "Own AI usage: read" on public.ai_usage for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.ai_usage from anon;
grant select on public.ai_usage to authenticated;

-- Atomically counts one use and says whether it fits under the daily limit.
-- SECURITY DEFINER because users may read but not write this table directly;
-- it only ever touches the caller's own row.
create or replace function public.consume_ai_quota(p_kind text, p_limit int)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare used int;
begin
  insert into public.ai_usage (user_id, day, kind, count)
  values ((select auth.uid()), current_date, p_kind, 1)
  on conflict (user_id, day, kind) do update set count = public.ai_usage.count + 1
  returning count into used;
  return used <= p_limit;
end;
$$;

revoke execute on function public.consume_ai_quota(text, int) from anon, public;
grant execute on function public.consume_ai_quota(text, int) to authenticated;
