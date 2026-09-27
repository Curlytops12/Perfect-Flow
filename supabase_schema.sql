-- Perfect Flow — Supabase schema
-- Run this once in your Supabase project: Dashboard → SQL Editor → New Query → paste → Run

create extension if not exists pgcrypto;

-- ---------- profiles ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- ---------- songs ----------
create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade not null,
  title text not null,
  artist text default '',
  key text default 'C',
  bpm integer default 120,
  time_signature text default '4/4',
  category text default 'Worship',
  sections jsonb not null default '[]',
  is_published boolean not null default false,
  origin_song_id uuid references songs(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table songs enable row level security;

create policy "Owner can view own songs"
  on songs for select using (auth.uid() = owner_id);

create policy "Anyone can view published songs"
  on songs for select using (is_published = true);

create policy "Owner can insert own songs"
  on songs for insert with check (auth.uid() = owner_id);

create policy "Owner can update own songs"
  on songs for update using (auth.uid() = owner_id);

create policy "Owner can delete own songs"
  on songs for delete using (auth.uid() = owner_id);

-- keep updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists songs_set_updated_at on songs;
create trigger songs_set_updated_at
  before update on songs
  for each row execute function set_updated_at();

-- ---------- shares (direct profile-to-profile sends) ----------
create table if not exists shares (
  id uuid primary key default gen_random_uuid(),
  song_id uuid references songs(id) on delete cascade not null,
  from_profile uuid references profiles(id) on delete cascade not null,
  to_username text not null,
  created_at timestamptz default now()
);

alter table shares enable row level security;

create policy "Sender can insert shares"
  on shares for insert with check (auth.uid() = from_profile);

create policy "Recipient can view shares sent to them"
  on shares for select using (
    to_username = (select username from profiles where id = auth.uid())
  );

create policy "Recipient can delete shares sent to them"
  on shares for delete using (
    to_username = (select username from profiles where id = auth.uid())
  );

create policy "Sender can delete their own sent shares"
  on shares for delete using (auth.uid() = from_profile);

-- allow recipients to read the underlying song data for a share sent to them
create policy "Share recipients can view the shared song"
  on songs for select using (
    exists (
      select 1 from shares
      where shares.song_id = songs.id
      and shares.to_username = (select username from profiles where id = auth.uid())
    )
  );

-- ---------- setlists (cloud-backed, per account) ----------
create table if not exists setlists (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  song_ids uuid[] not null default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table setlists enable row level security;

create policy "Owner can manage own setlists"
  on setlists for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

drop trigger if exists setlists_set_updated_at on setlists;
create trigger setlists_set_updated_at
  before update on setlists
  for each row execute function set_updated_at();

-- ---------- presentations (PDF slides for OBS / stage display) ----------
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
