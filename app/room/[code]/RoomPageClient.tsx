"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { useRoom } from "@/hooks/useRoom";
import { useRealtime } from "@/hooks/useRealtime";
import { useGame } from "@/hooks/useGame";
import { LobbyView } from "@/components/lobby/LobbyView";
import { MatrixEntry } from "@/components/game/MatrixEntry";
import { GameView } from "@/components/game/GameView";
import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import type { Profile, Room, RoomPlayer } from "@/types";

interface RoomPageClientProps {
  code: string;
  profile: Profile;
}

export default function RoomPageClient({ code, profile }: RoomPageClientProps) {
  const router = useRouter();
  const {
    room,
    players,
    loading,
    error,
    joinRoom,
    setReady,
    startGame,
    setRoom,
    setPlayers,
    fetchRoom,
  } = useRoom(code);

  const { submitBoard } = useGame(room?.id ?? null, profile.id, null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    async function autoJoin() {
      if (!room || joined) return;
      const result = await joinRoom(profile.id);
      if (result.error && result.error !== "Room is full") {
        console.error(result.error);
      }
      setJoined(true);
    }
    autoJoin();
  }, [room, profile.id, joinRoom, joined]);

  useRealtime(
    room?.id && (room.status === "waiting" || room.status === "matrix") ? room.id : null,
    {
      onRoomChange: (updatedRoom) => setRoom(updatedRoom),
      onPlayerChange: async () => {
        await fetchRoom();
      },
    },
    "room-lobby"
  );

  const currentPlayer = players.find((p) => p.player_id === profile.id);
  const roomPlayerId = currentPlayer?.id ?? null;

  const handleSubmitBoard = useCallback(
    async (board: number[][]) => {
      if (!roomPlayerId || !room) return;
      const supabase = createClient();
      await supabase
        .from("room_players")
        .update({
          board,
          has_submitted_board: true,
          marked: Array.from({ length: 5 }, () => Array(5).fill(false)),
        })
        .eq("id", roomPlayerId);

      const { data: allPlayers } = await supabase
        .from("room_players")
        .select("has_submitted_board")
        .eq("room_id", room.id);

      const allSubmitted = (allPlayers || []).every((p) => p.has_submitted_board);
      if (allSubmitted) {
        await supabase.from("rooms").update({ status: "playing" }).eq("id", room.id);
      }

      await fetchRoom();
    },
    [roomPlayerId, room, fetchRoom]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <div className="animate-pulse text-primary font-semibold">Loading room…</div>
        </GlassCard>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <GlassCard className="p-8 text-center max-w-sm">
          <p className="text-danger font-semibold mb-4">{error || "Room not found"}</p>
          <button
            onClick={() => router.push("/")}
            className="text-primary font-medium hover:underline"
          >
            Back to Dashboard
          </button>
        </GlassCard>
      </div>
    );
  }

  const submittedCount = players.filter((p) => p.has_submitted_board).length;

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <Navbar profile={profile} />

        {room.status === "waiting" && (
          <LobbyView
            room={room}
            players={players}
            currentUserId={profile.id}
            onReady={(ready) => setReady(profile.id, ready)}
            onStart={startGame}
          />
        )}

        {room.status === "matrix" && (
          <MatrixEntry
            onSubmit={handleSubmitBoard}
            submitted={currentPlayer?.has_submitted_board ?? false}
            waitingCount={{ submitted: submittedCount, total: players.length }}
          />
        )}

        {room.status === "playing" && currentPlayer?.board && (
          <GameView
            room={room}
            players={players}
            currentUser={profile}
            onPlayersUpdate={setPlayers}
            onRoomUpdate={setRoom}
          />
        )}

        {room.status === "finished" && (
          <GameView
            room={room}
            players={players}
            currentUser={profile}
            onPlayersUpdate={setPlayers}
            onRoomUpdate={setRoom}
          />
        )}
      </div>
    </div>
  );
}
