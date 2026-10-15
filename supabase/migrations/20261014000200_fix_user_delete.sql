-- On user deletion the promote trigger updated accounts the cascade was deleting,
-- aborting the delete. Skip promotion when the owner is gone.

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
