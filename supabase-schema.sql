-- ============================================================
-- SPOZZZ — Supabase SQL Schema
-- Run this in your Supabase SQL Editor to set up the database
-- ============================================================

-- 1. PROFILES (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  username text unique not null,
  email text,
  bio text,
  website text,
  avatar_url text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "Profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. SPOTS
create table public.spots (
  id uuid default gen_random_uuid() primary key,
  author_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  country text,
  city text,
  category text not null,
  description text,
  photo_url text,
  visibility text default 'public' check (visibility in ('public', 'friends', 'private')),
  status text default 'visited' check (status in ('visited', 'want_to_go')),
  website text,
  recommended boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.spots enable row level security;
create policy "Public spots viewable by all" on public.spots for select using (
  visibility = 'public' or auth.uid() = author_id
);
create policy "Users can insert own spots" on public.spots for insert with check (auth.uid() = author_id);
create policy "Users can update own spots" on public.spots for update using (auth.uid() = author_id);
create policy "Users can delete own spots" on public.spots for delete using (auth.uid() = author_id);

-- 3. LIKES
create table public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  spot_id uuid references public.spots(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, spot_id)
);
alter table public.likes enable row level security;
create policy "Likes viewable by all" on public.likes for select using (true);
create policy "Users can manage own likes" on public.likes for all using (auth.uid() = user_id);

-- 4. SAVES
create table public.saves (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  spot_id uuid references public.spots(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, spot_id)
);
alter table public.saves enable row level security;
create policy "Saves viewable by owner" on public.saves for select using (auth.uid() = user_id);
create policy "Users can manage own saves" on public.saves for all using (auth.uid() = user_id);

-- 5. FOLLOWS
create table public.follows (
  id uuid default gen_random_uuid() primary key,
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(follower_id, following_id)
);
alter table public.follows enable row level security;
create policy "Follows viewable by all" on public.follows for select using (true);
create policy "Users can manage own follows" on public.follows for all using (auth.uid() = follower_id);

-- 6. FRIEND REQUESTS
create table public.friend_requests (
  id uuid default gen_random_uuid() primary key,
  from_id uuid references public.profiles(id) on delete cascade not null,
  to_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz default now(),
  unique(from_id, to_id)
);
alter table public.friend_requests enable row level security;
create policy "Users can see their own requests" on public.friend_requests for select
  using (auth.uid() = from_id or auth.uid() = to_id);
create policy "Users can send requests" on public.friend_requests for insert
  with check (auth.uid() = from_id);
create policy "Recipients can update requests" on public.friend_requests for update
  using (auth.uid() = to_id);
create policy "Users can delete own requests" on public.friend_requests for delete
  using (auth.uid() = from_id or auth.uid() = to_id);

-- 7. STORAGE BUCKET for spot photos
insert into storage.buckets (id, name, public) values ('spot-photos', 'spot-photos', true);
create policy "Anyone can view spot photos" on storage.objects for select
  using (bucket_id = 'spot-photos');
create policy "Authenticated users can upload photos" on storage.objects for insert
  with check (bucket_id = 'spot-photos' and auth.role() = 'authenticated');
create policy "Users can delete own photos" on storage.objects for delete
  using (bucket_id = 'spot-photos' and auth.uid()::text = (storage.foldername(name))[1]);

-- 8. LIKE/SAVE COUNT VIEWS (for performance)
create or replace view public.spot_counts as
select
  s.id as spot_id,
  count(distinct l.id) as like_count,
  count(distinct sv.id) as save_count
from public.spots s
left join public.likes l on l.spot_id = s.id
left join public.saves sv on sv.spot_id = s.id
group by s.id;

-- ============================================================
-- ADDITIONAL: Add lat/lng to spots for distance calculation
-- Run this AFTER the main schema if you haven't already
-- ============================================================
alter table public.spots add column if not exists lat double precision;
alter table public.spots add column if not exists lng double precision;

-- Optional: Add the spot to AddSpotPage by using browser geolocation
-- when saving a new spot (coordinates are captured automatically)
