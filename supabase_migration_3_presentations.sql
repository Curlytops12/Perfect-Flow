-- Perfect Flow — migration 3: presentations (PDF slides for OBS / stage display)
-- Run this in Supabase SQL Editor after the earlier migrations.

create table if not exists presentations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  file_path text not null,
  created_at timestamptz default now()
);

alter table presentations enable row level security;

-- Public/no-login select: OBS's Browser Source and any shared link have no
-- session, so the viewer page must be reachable without auth.
create policy "Anyone can view presentations"
  on presentations for select using (true);

create policy "Owner can insert own presentations"
  on presentations for insert with check (auth.uid() = owner_id);

create policy "Owner can delete own presentations"
  on presentations for delete using (auth.uid() = owner_id);

-- ---------- storage bucket for the uploaded PDF files ----------
insert into storage.buckets (id, name, public)
values ('presentations', 'presentations', true)
on conflict (id) do nothing;

create policy "Public read for presentations bucket"
  on storage.objects for select
  using (bucket_id = 'presentations');

create policy "Authenticated users can upload to presentations bucket"
  on storage.objects for insert
  with check (bucket_id = 'presentations' and auth.role() = 'authenticated');

create policy "Owners can delete their presentation files"
  on storage.objects for delete
  using (bucket_id = 'presentations' and owner = auth.uid());
