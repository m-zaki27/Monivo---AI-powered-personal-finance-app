-- Money is integer cents (bigint). RLS limits every user to their own rows.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Profiles. `onboarded` stays in auth user_metadata: the router needs it before any query runs.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null default '' check (char_length(first_name) <= 30),
  last_name text not null default '' check (char_length(last_name) <= 30),
  currency char(3) not null default 'USD',
  notify_push boolean not null default true,
  notify_weekly_recap boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Security definer: the new user has no rights yet when auth inserts them.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Categories: one shared, read-only list (ids match the app's icons/colours).
-- ---------------------------------------------------------------------------

create table public.categories (
  id text primary key,
  name text not null,
  icon text not null,
  color text not null,
  kind text not null check (kind in ('income', 'expense')),
  sort_order int not null default 0
);

insert into public.categories (id, name, icon, color, kind, sort_order) values
  ('cat_food', 'Food & Drink', 'coffee', 'amber', 'expense', 1),
  ('cat_groceries', 'Groceries', 'basket', 'teal', 'expense', 2),
  ('cat_transport', 'Transport', 'car', 'cobalt', 'expense', 3),
  ('cat_shopping', 'Shopping', 'bag', 'rose', 'expense', 4),
  ('cat_entertainment', 'Entertainment', 'film', 'pink', 'expense', 5),
  ('cat_subscriptions', 'Subscriptions', 'repeat', 'orange', 'expense', 6),
  ('cat_bills', 'Bills & Utilities', 'zap', 'gold', 'expense', 7),
  ('cat_health', 'Health', 'heart', 'sky', 'expense', 8),
  ('cat_rent', 'Rent', 'home', 'steel', 'expense', 9),
  ('cat_travel', 'Travel', 'plane', 'teal', 'expense', 10),
  ('cat_other', 'Other', 'shapes', 'tan', 'expense', 11),
  ('cat_salary', 'Salary', 'briefcase', 'sky', 'income', 12);

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------

create table public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 30),
  type text not null check (type in ('cash', 'bank', 'credit')),
  institution text check (char_length(institution) <= 40),
  last4 text check (last4 ~ '^[0-9]{4}$'),
  color text not null default 'cobalt',
  -- Balance before the first transaction; credit cards owe money, so negative.
  opening_balance bigint not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

create index accounts_user_idx on public.accounts (user_id);
-- At most one default account per user, enforced by the database.
create unique index accounts_one_default_idx on public.accounts (user_id) where is_default;

-- A user's first account is automatically their default.
create or replace function public.accounts_first_is_default()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.accounts where user_id = new.user_id) then
    new.is_default := true;
  end if;
  return new;
end;
$$;

create trigger accounts_first_default before insert on public.accounts
  for each row execute function public.accounts_first_is_default();

-- Deleting the default account hands the badge to the oldest remaining one.
create or replace function public.accounts_promote_default()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_default then
    update public.accounts
      set is_default = true
      where id = (
        select id from public.accounts
        where user_id = old.user_id
        order by created_at
        limit 1
      );
  end if;
  return old;
end;
$$;

create trigger accounts_promote_default after delete on public.accounts
  for each row execute function public.accounts_promote_default();

-- Two statements, so the "one default" index never sees two defaults at once.
create or replace function public.set_default_account(p_account_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if not exists (select 1 from public.accounts where id = p_account_id and user_id = auth.uid()) then
    raise exception 'Account not found' using errcode = 'P0002';
  end if;
  update public.accounts set is_default = false where user_id = auth.uid() and is_default;
  update public.accounts set is_default = true where id = p_account_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Transactions
-- ---------------------------------------------------------------------------

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  category_id text not null references public.categories (id),
  type text not null check (type in ('income', 'expense')),
  -- Always positive; `type` carries the sign.
  amount bigint not null check (amount > 0 and amount <= 100000000),
  merchant text not null check (char_length(merchant) between 1 and 60),
  note text check (char_length(note) <= 140),
  date timestamptz not null,
  source text not null default 'manual' check (source in ('manual', 'scan', 'voice')),
  created_at timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions (user_id, date desc);
create index transactions_account_idx on public.transactions (account_id);

-- ---------------------------------------------------------------------------
-- Budgets: optional, one per user.
-- ---------------------------------------------------------------------------

create table public.budgets (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  monthly_limit bigint not null check (monthly_limit > 0),
  alert_threshold numeric(3, 2) not null default 0.80 check (alert_threshold between 0.5 and 1),
  email_alerts boolean not null default true,
  updated_at timestamptz not null default now()
);

create trigger budgets_touch before update on public.budgets
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Derived data, computed in the database
-- ---------------------------------------------------------------------------

-- security_invoker: the view runs with the caller's rights, so RLS still applies.
create view public.account_balances with (security_invoker = true) as
select
  a.*,
  a.opening_balance + coalesce(sum(case when t.type = 'income' then t.amount else -t.amount end), 0)::bigint as balance,
  count(t.id)::int as transaction_count
from public.accounts a
left join public.transactions t on t.account_id = a.id
group by a.id;

-- The app passes its *local* month boundaries, so "this month" matches the user's time zone.
create or replace function public.month_summary(p_from timestamptz, p_to timestamptz)
returns json
language sql
stable
set search_path = ''
as $$
  with tx as (
    select type, amount, category_id
    from public.transactions
    where user_id = auth.uid() and date >= p_from and date <= p_to
  )
  select json_build_object(
    'income', coalesce((select sum(amount) from tx where type = 'income'), 0),
    'expense', coalesce((select sum(amount) from tx where type = 'expense'), 0),
    'by_category', coalesce((
      select json_agg(c order by c.total desc)
      from (
        select category_id, sum(amount)::bigint as total, count(*)::int as count
        from tx where type = 'expense'
        group by category_id
      ) c
    ), '[]'::json)
  );
$$;

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

create policy "Own profile: read" on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "Own profile: update" on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "Categories: read" on public.categories for select to authenticated using (true);

create policy "Own accounts: read" on public.accounts for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "Own accounts: insert" on public.accounts for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "Own accounts: update" on public.accounts for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
-- The last account can't be deleted (user deletion still cascades; FK cascades bypass RLS).
create policy "Own accounts: delete (not the last)" on public.accounts for delete to authenticated
  using (
    (select auth.uid()) = user_id
    and (select count(*) from public.accounts a where a.user_id = (select auth.uid())) > 1
  );

create policy "Own transactions: read" on public.transactions for select to authenticated
  using ((select auth.uid()) = user_id);
-- Writes must also point at one of the user's own accounts.
create policy "Own transactions: insert" on public.transactions for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = (select auth.uid()))
  );
create policy "Own transactions: update" on public.transactions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.accounts a where a.id = account_id and a.user_id = (select auth.uid()))
  );
create policy "Own transactions: delete" on public.transactions for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Own budget: all" on public.budgets for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Restrictive (ANDed with the above): with MFA enabled, an aal1 session can't touch any data.
do $$
declare t text;
begin
  foreach t in array array['profiles', 'accounts', 'transactions', 'budgets'] loop
    execute format(
      'create policy "Require MFA when enabled" on public.%I as restrictive for all to authenticated
         using (
           array[(select auth.jwt() ->> ''aal'')] <@ (
             select case when count(id) > 0 then array[''aal2''] else array[''aal1'', ''aal2''] end
             from auth.mfa_factors
             where (select auth.uid()) = user_id and status = ''verified''
           )
         )', t);
  end loop;
end;
$$;

-- Only signed-in users get table access (RLS then narrows it to their rows).
revoke all on public.profiles, public.categories, public.accounts, public.transactions, public.budgets from anon;
grant select, update on public.profiles to authenticated;
grant select on public.categories to authenticated;
grant select, insert, update, delete on public.accounts, public.transactions, public.budgets to authenticated;
grant select on public.account_balances to authenticated;
revoke all on public.account_balances from anon;
revoke execute on function public.month_summary(timestamptz, timestamptz) from anon, public;
revoke execute on function public.set_default_account(uuid) from anon, public;
grant execute on function public.month_summary(timestamptz, timestamptz) to authenticated;
grant execute on function public.set_default_account(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill existing users
-- ---------------------------------------------------------------------------

insert into public.profiles (id, first_name, last_name, currency, notify_push, notify_weekly_recap)
select
  u.id,
  coalesce(u.raw_user_meta_data ->> 'first_name', ''),
  coalesce(u.raw_user_meta_data ->> 'last_name', ''),
  coalesce(nullif(u.raw_user_meta_data ->> 'currency', ''), 'USD'),
  coalesce((u.raw_user_meta_data ->> 'notify_push')::boolean, true),
  coalesce((u.raw_user_meta_data ->> 'notify_weekly_recap')::boolean, true)
from auth.users u
on conflict (id) do nothing;

-- Already-onboarded users get a starting account so they can add transactions.
insert into public.accounts (user_id, name, type, color, is_default)
select u.id, 'Main account', 'bank', 'cobalt', true
from auth.users u
where (u.raw_user_meta_data ->> 'onboarded')::boolean is true
  and not exists (select 1 from public.accounts a where a.user_id = u.id);
