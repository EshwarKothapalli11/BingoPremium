"use client";

import { memo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";
import type { RoomPlayer } from "@/types";

interface LeaderboardProps {
  players: RoomPlayer[];
  currentPlayerId: string;
}

export const Leaderboard = memo(function Leaderboard({ players, currentPlayerId }: LeaderboardProps) {
  const ranked = [...players].sort((a, b) => {
    if (b.lines_completed !== a.lines_completed) {
      return b.lines_completed - a.lines_completed;
    }
    return a.moves - b.moves;
  });

  return (
    <GlassCard className="p-4 shadow-sm">
      <h3 className="font-semibold text-sm mb-3 text-slate-800">Leaderboard</h3>
      <div className="space-y-2">
        {ranked.map((player, i) => (
          <div
            key={player.id}
            className={`flex items-center gap-3 p-2 rounded-xl border shadow-sm transition-colors ${
              player.player_id === currentPlayerId ? "bg-blue-50 border-blue-100" : "bg-white border-slate-100"
            }`}
          >
            <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
            <Avatar
              name={player.profile?.username ?? "P"}
              avatarUrl={player.profile?.avatar_url}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate text-slate-800">
                {player.profile?.username ?? "Player"}
                {player.player_id === currentPlayerId && (
                  <span className="text-xs text-primary ml-1">(you)</span>
                )}
              </p>
            </div>
            <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-md">
              {player.lines_completed}L
            </span>
          </div>
        ))}
      </div>
    </GlassCard>
  );
});
