-- Users can't read auth.mfa_factors, so the MFA policies failed. A SECURITY DEFINER
-- function answers for the calling user only, without exposing the table.

create or replace function public.has_verified_mfa()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.mfa_factors
    where user_id = (select auth.uid()) and status = 'verified'
  );
$$;

revoke execute on function public.has_verified_mfa() from anon, public;
grant execute on function public.has_verified_mfa() to authenticated;

do $$
declare t text;
begin
  foreach t in array array['profiles', 'accounts', 'transactions', 'budgets'] loop
    execute format('drop policy if exists "Require MFA when enabled" on public.%I', t);
    -- Allowed when the session passed two-step (aal2), or the user hasn't turned it on.
    execute format(
      'create policy "Require MFA when enabled" on public.%I as restrictive for all to authenticated
         using ((select auth.jwt() ->> ''aal'') = ''aal2'' or not (select public.has_verified_mfa()))',
      t);
  end loop;
end;
$$;
