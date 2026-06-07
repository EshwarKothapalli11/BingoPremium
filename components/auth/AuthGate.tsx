"use client";

import { useEffect, useState } from "react";
import { ensureSession, getProfile } from "@/lib/session";
import { GlassCard } from "@/components/ui/GlassCard";
import { BingoButton } from "@/components/ui/BingoButton";
import type { Profile } from "@/types";

const SETUP_SQL = `-- Paste this in Supabase → SQL Editor → Run
alter table public.profiles drop constraint if exists profiles_id_fkey;

drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "Authenticated users can create rooms" on public.rooms;
drop policy if exists "Host can update room" on public.rooms;
drop policy if exists "Users can join rooms" on public.room_players;
drop policy if exists "Users can update own player row" on public.room_players;
drop policy if exists "Authenticated users can insert game events" on public.game_events;
drop policy if exists "Authenticated users can send messages" on public.messages;
drop policy if exists "Authenticated users can insert history" on public.history;

create policy "profiles_insert" on public.profiles for insert with check (true);
create policy "profiles_update" on public.profiles for update using (true);
create policy "rooms_insert" on public.rooms for insert with check (true);
create policy "rooms_update" on public.rooms for update using (true);
create policy "room_players_insert" on public.room_players for insert with check (true);
create policy "room_players_update" on public.room_players for update using (true);
create policy "game_events_insert" on public.game_events for insert with check (true);
create policy "messages_insert" on public.messages for insert with check (true);
create policy "history_insert" on public.history for insert with check (true);`;

interface AuthGateProps {
  children: (profile: Profile) => React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    ensureSession()
      .then((session) => getProfile(session.id))
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Could not start session");
      });

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  if (error) {
    const needsSetup =
      error.includes("row-level security") ||
      error.includes("permission denied") ||
      error.includes("does not exist");

    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <GlassCard className="p-8 max-w-lg w-full">
          <p className="text-danger font-semibold text-lg mb-2">Database setup required</p>
          <p className="text-sm text-text-muted mb-4">{error}</p>

          {needsSetup && (
            <>
              <p className="text-sm mb-3">
                Run this SQL in your{" "}
                <a
                  href="https://supabase.com/dashboard/project/ehwxplvzbktbvocctzit/sql/new"
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary font-medium underline"
                >
                  Supabase SQL Editor
                </a>
                :
              </p>
              <pre className="text-xs bg-slate-900 text-slate-100 p-4 rounded-xl overflow-x-auto mb-4 max-h-48">
                {SETUP_SQL}
              </pre>
            </>
          )}

          <BingoButton className="w-full" onClick={() => { setError(null); setRetryKey((k) => k + 1); }}>
            Retry
          </BingoButton>
        </GlassCard>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-extrabold">
          B
        </div>
        <p className="text-sm text-text-muted animate-pulse">Loading game…</p>
      </div>
    );
  }

  return <>{children(profile)}</>;
}
