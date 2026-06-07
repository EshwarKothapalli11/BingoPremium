"use client";

import { useState } from "react";
import Link from "next/link";
import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { BingoButton } from "@/components/ui/BingoButton";
import { JoinRoomModal } from "@/components/lobby/JoinRoomModal";
import { useActiveRooms, usePlayerHistory } from "@/hooks/useRoom";
import type { Profile } from "@/types";

export default function DashboardClient({ profile }: { profile: Profile }) {
  const [showJoin, setShowJoin] = useState(false);
  const activeRooms = useActiveRooms();
  const history = usePlayerHistory(profile.id);

  const winRate =
    profile.games_played > 0
      ? Math.round((profile.games_won / profile.games_played) * 100)
      : 0;

  const avgMoves =
    profile.games_played > 0
      ? Math.round(profile.total_moves / profile.games_played)
      : 0;

  const stats = [
    { label: "Games Played", value: profile.games_played },
    { label: "Games Won", value: profile.games_won },
    { label: "Win Rate", value: `${winRate}%` },
    { label: "Avg Moves", value: avgMoves },
  ];

  return (
    <div className="min-h-screen px-4 py-6 max-w-6xl mx-auto">
      <Navbar profile={profile} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <GlassCard key={stat.label} className="p-5 text-center">
            <p className="text-3xl font-bold text-primary">{stat.value}</p>
            <p className="text-sm text-text-muted mt-1">{stat.label}</p>
          </GlassCard>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 mb-8">
        <Link href="/dashboard/create">
          <BingoButton size="lg">Create New Room</BingoButton>
        </Link>
        <BingoButton size="lg" variant="secondary" onClick={() => setShowJoin(true)}>
          Join with Code
        </BingoButton>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <GlassCard className="p-6">
          <h2 className="font-bold text-lg mb-4">Active Rooms</h2>
          {activeRooms.length === 0 ? (
            <p className="text-text-muted text-sm">No active rooms right now. Create one!</p>
          ) : (
            <div className="space-y-3">
              {activeRooms.map((room) => (
                <Link
                  key={room.id}
                  href={`/room/${room.code}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/40 hover:bg-white/60 transition-colors"
                >
                  <div>
                    <p className="font-medium">{room.name}</p>
                    <p className="text-xs text-text-muted">
                      Code: {room.code} · {room.player_count}/{room.max_players} players
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary capitalize">
                    {room.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard className="p-6">
          <h2 className="font-bold text-lg mb-4">Your History</h2>
          {history.length === 0 ? (
            <p className="text-text-muted text-sm">No games played yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-text-muted text-left">
                    <th className="pb-2 font-medium">Room</th>
                    <th className="pb-2 font-medium">Result</th>
                    <th className="pb-2 font-medium">Moves</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i} className="border-t border-white/30">
                      <td className="py-2">{h.room_name}</td>
                      <td className={`py-2 font-semibold ${h.result === "Won" ? "text-success" : "text-text-muted"}`}>
                        {h.result}
                      </td>
                      <td className="py-2">{h.moves}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      {showJoin && <JoinRoomModal onClose={() => setShowJoin(false)} />}
    </div>
  );
}
