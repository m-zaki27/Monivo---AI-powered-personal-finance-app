-- Public bucket so avatars are plain URLs; the UUID path can't be guessed.
-- Writes are limited to the user's own folder and a small JPEG.

alter table public.profiles add column avatar_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 1048576, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Same two-step rule as the tables: with MFA on, a password-only session can't change files.
create policy "Avatars: upload to own folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and ((select auth.jwt() ->> 'aal') = 'aal2' or not (select public.has_verified_mfa()))
  );

-- Listing and deleting need SELECT too (Storage checks it before removing).
create policy "Avatars: read own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Avatars: delete from own folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and ((select auth.jwt() ->> 'aal') = 'aal2' or not (select public.has_verified_mfa()))
  );
