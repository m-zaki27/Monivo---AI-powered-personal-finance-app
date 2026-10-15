-- Security hardening from the database advisor.

-- Trigger functions run from triggers only; nobody needs to call them through the API.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.touch_updated_at() from anon, authenticated, public;
revoke execute on function public.accounts_first_is_default() from anon, authenticated, public;
revoke execute on function public.accounts_promote_default() from anon, authenticated, public;
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;

-- Helpers used inside RLS policies move out of the API schema (policies keep working:
-- they reference the function itself, not its name).
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
alter function public.has_verified_mfa() set schema private;
alter function public.my_account_count() set schema private;

-- pg_net can't be moved with SET SCHEMA; recreate it outside public. Its functions
-- stay in the "net" schema, so invoke_notify() is unaffected.
drop extension if exists pg_net;
create extension pg_net with schema extensions;
