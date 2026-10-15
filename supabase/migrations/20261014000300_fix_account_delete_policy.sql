-- Counting accounts inside an accounts policy is infinite recursion (42P17);
-- a SECURITY DEFINER count of the caller's rows skips RLS and avoids the loop.

create or replace function public.my_account_count()
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select count(*) from public.accounts where user_id = (select auth.uid());
$$;

revoke execute on function public.my_account_count() from anon, public;
grant execute on function public.my_account_count() to authenticated;

drop policy if exists "Own accounts: delete (not the last)" on public.accounts;

create policy "Own accounts: delete (not the last)" on public.accounts for delete to authenticated
  using ((select auth.uid()) = user_id and (select public.my_account_count()) > 1);
