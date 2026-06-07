"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import type { RoomPlayer } from "@/types";

interface LeaderboardProps {
  players: RoomPlayer[];
  currentPlayerId: string;
}

export function Leaderboard({ players, currentPlayerId }: LeaderboardProps) {
  const ranked = [...players].sort((a, b) => {
    if (b.lines_completed !== a.lines_completed) {
      return b.lines_completed - a.lines_completed;
    }
    return a.moves - b.moves;
  });

  return (
    <GlassCard className="p-4">
      <h3 className="font-semibold text-sm mb-3">Leaderboard</h3>
      <div className="space-y-2">
        {ranked.map((player, i) => (
          <div
            key={player.id}
            className={`flex items-center gap-3 p-2 rounded-xl ${
              player.player_id === currentPlayerId ? "bg-primary/10" : "bg-white/30"
            }`}
          >
            <span className="text-xs font-bold text-text-muted w-4">{i + 1}</span>
            <Avatar
              name={player.profile?.username ?? "P"}
              avatarUrl={player.profile?.avatar_url}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {player.profile?.username ?? "Player"}
                {player.player_id === currentPlayerId && (
                  <span className="text-xs text-primary ml-1">(you)</span>
                )}
              </p>
            </div>
            <span className="text-xs font-semibold text-primary">
              {player.lines_completed}L
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}
