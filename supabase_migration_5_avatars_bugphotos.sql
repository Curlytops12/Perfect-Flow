-- Adds profile photo + bug report photo support.
-- NOTE: before running this, create two Storage buckets via the Supabase
-- dashboard (Storage -> New bucket) — bucket creation isn't available
-- through the Management API used by scripts/run-sql.js:
--   1. "avatars"    — Public bucket
--   2. "bug-photos" — Private bucket (not public)

alter table profiles add column if not exists avatar_url text;
alter table bug_reports add column if not exists photo_path text;

-- avatars: anyone can view, each user can only write inside their own
-- folder (path convention: <user_id>/avatar)
create policy "Avatar images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- bug-photos: private, each user can only write/read inside their own
-- folder (path convention: <user_id>/<filename>)
create policy "Users can upload their own bug report photos"
  on storage.objects for insert
  with check (bucket_id = 'bug-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can read their own bug report photos"
  on storage.objects for select
  using (bucket_id = 'bug-photos' and (storage.foldername(name))[1] = auth.uid()::text);
