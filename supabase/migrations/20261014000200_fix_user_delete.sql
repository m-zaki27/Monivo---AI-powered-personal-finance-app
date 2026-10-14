-- Deleting a user cascades to their accounts. The "promote a new default"
-- trigger then tried to UPDATE sibling accounts that the same cascade was
-- deleting, and Postgres aborted the whole delete ("Database error deleting
-- user"). When the owner is gone there's nothing to promote, so skip it.

create or replace function public.accounts_promote_default()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.is_default and exists (select 1 from auth.users where id = old.user_id) then
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
