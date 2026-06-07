-- Multiplayer Bingo Game Schema (Guest mode — no login required)
-- Run this in Supabase SQL Editor

create extension if not exists "uuid-ossp";

-- Profiles (client-generated guest IDs stored in localStorage)
create table if not exists public.profiles (
  id uuid primary key,
  username text not null,
  avatar_url text,
  games_played int default 0 not null,
  games_won int default 0 not null,
  total_moves int default 0 not null,
  created_at timestamptz default now() not null
);

-- Rooms
create table if not exists public.rooms (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  name text not null,
  host_id uuid references public.profiles(id) on delete set null,
  status text default 'waiting' not null check (status in ('waiting', 'matrix', 'playing', 'finished')),
  max_players int default 4 not null check (max_players between 2 and 6),
  winner_id uuid references public.profiles(id) on delete set null,
  started_at timestamptz,
  created_at timestamptz default now() not null
);

-- Room Players
create table if not exists public.room_players (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  player_id uuid references public.profiles(id) on delete cascade not null,
  is_ready boolean default false not null,
  board jsonb,
  marked jsonb,
  completed_lines jsonb default '[]'::jsonb not null,
  bingo_letters int default 0 not null,
  lines_completed int default 0 not null,
  moves int default 0 not null,
  has_submitted_board boolean default false not null,
  joined_at timestamptz default now() not null,
  unique(room_id, player_id)
);

-- Game Events
create table if not exists public.game_events (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  player_id uuid references public.profiles(id) on delete cascade not null,
  event_type text not null check (event_type in ('cell_cancelled', 'bingo_letter', 'game_won')),
  payload jsonb default '{}'::jsonb not null,
  created_at timestamptz default now() not null
);

-- Messages (game chat)
create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.rooms(id) on delete cascade not null,
  player_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz default now() not null
);

-- History (global winners)
create table if not exists public.history (
  id uuid primary key default uuid_generate_v4(),
  room_id uuid references public.rooms(id) on delete set null,
  winner_id uuid references public.profiles(id) on delete set null not null,
  moves int default 0 not null,
  duration text not null,
  players_count int default 2 not null,
  created_at timestamptz default now() not null
);

-- Indexes
create index if not exists idx_rooms_code on public.rooms(code);
create index if not exists idx_rooms_status on public.rooms(status);
create index if not exists idx_room_players_room on public.room_players(room_id);
create index if not exists idx_game_events_room on public.game_events(room_id);
create index if not exists idx_messages_room on public.messages(room_id);
create index if not exists idx_history_created on public.history(created_at desc);

-- Row Level Security (open policies for guest mode via anon key)
alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.game_events enable row level security;
alter table public.messages enable row level security;
alter table public.history enable row level security;

-- Drop old auth-based policies if re-running
drop policy if exists "Profiles are viewable by everyone" on public.profiles;
drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Rooms are viewable by everyone" on public.rooms;
drop policy if exists "Authenticated users can create rooms" on public.rooms;
drop policy if exists "Host can update room" on public.rooms;
drop policy if exists "Room players viewable by everyone" on public.room_players;
drop policy if exists "Users can join rooms" on public.room_players;
drop policy if exists "Users can update own player row" on public.room_players;
drop policy if exists "Users can leave rooms" on public.room_players;
drop policy if exists "Game events viewable by everyone" on public.game_events;
drop policy if exists "Authenticated users can insert game events" on public.game_events;
drop policy if exists "Messages viewable by everyone" on public.messages;
drop policy if exists "Authenticated users can send messages" on public.messages;
drop policy if exists "History viewable by everyone" on public.history;
drop policy if exists "Authenticated users can insert history" on public.history;

create policy "profiles_select" on public.profiles for select using (true);
create policy "profiles_insert" on public.profiles for insert with check (true);
create policy "profiles_update" on public.profiles for update using (true);

create policy "rooms_select" on public.rooms for select using (true);
create policy "rooms_insert" on public.rooms for insert with check (true);
create policy "rooms_update" on public.rooms for update using (true);

create policy "room_players_select" on public.room_players for select using (true);
create policy "room_players_insert" on public.room_players for insert with check (true);
create policy "room_players_update" on public.room_players for update using (true);
create policy "room_players_delete" on public.room_players for delete using (true);

create policy "game_events_select" on public.game_events for select using (true);
create policy "game_events_insert" on public.game_events for insert with check (true);

create policy "messages_select" on public.messages for select using (true);
create policy "messages_insert" on public.messages for insert with check (true);

create policy "history_select" on public.history for select using (true);
create policy "history_insert" on public.history for insert with check (true);

-- Set REPLICA IDENTITY FULL so realtime filtered subscriptions work on UPDATE events
alter table public.rooms replica identity full;
alter table public.room_players replica identity full;
alter table public.game_events replica identity full;
alter table public.messages replica identity full;

-- Enable Realtime (ignore errors if already added)
do $$ begin
  alter publication supabase_realtime add table public.rooms;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.room_players;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.game_events;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

