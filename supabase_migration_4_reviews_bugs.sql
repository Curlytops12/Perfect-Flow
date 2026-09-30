-- Perfect Flow — migration 4: song ratings/reviews + bug reports

create table if not exists song_reviews (
  id uuid primary key default gen_random_uuid(),
  song_id uuid references songs(id) on delete cascade not null,
  reviewer_id uuid references profiles(id) on delete cascade not null,
  rating int not null check (rating >= 1 and rating <= 5),
  comment text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (song_id, reviewer_id)
);

alter table song_reviews enable row level security;

create policy "Anyone can view reviews on published songs"
  on song_reviews for select using (
    exists (select 1 from songs where songs.id = song_reviews.song_id and songs.is_published = true)
    or reviewer_id = auth.uid()
  );

create policy "Users can insert their own review on published songs"
  on song_reviews for insert with check (
    auth.uid() = reviewer_id
    and exists (select 1 from songs where songs.id = song_id and songs.is_published = true)
  );

create policy "Users can update their own review"
  on song_reviews for update using (auth.uid() = reviewer_id);

create policy "Users can delete their own review"
  on song_reviews for delete using (auth.uid() = reviewer_id);

drop trigger if exists song_reviews_set_updated_at on song_reviews;
create trigger song_reviews_set_updated_at
  before update on song_reviews
  for each row execute function set_updated_at();

-- ---------- bug reports ----------
create table if not exists bug_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid references profiles(id) on delete set null,
  description text not null,
  created_at timestamptz default now()
);

alter table bug_reports enable row level security;

create policy "Users can submit bug reports"
  on bug_reports for insert with check (auth.uid() = reporter_id);

create policy "Users can view their own submitted reports"
  on bug_reports for select using (auth.uid() = reporter_id);
