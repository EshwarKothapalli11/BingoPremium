-- Run this if you already ran the old auth-based schema
-- Converts profiles to guest mode and opens RLS policies

-- Remove auth.users foreign key from profiles
alter table public.profiles drop constraint if exists profiles_id_fkey;

-- Drop old auth trigger
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Drop old policies
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

-- Open policies for guest mode
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
