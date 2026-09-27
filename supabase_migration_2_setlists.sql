-- Perfect Flow — migration 2: cloud-backed setlists (per account)
-- Run this in Supabase SQL Editor after the original supabase_schema.sql

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
