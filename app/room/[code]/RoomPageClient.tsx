"use client";

import { useRouter } from "next/navigation";
import { RoomProvider, useRoomContext } from "@/context/RoomContext";
import { RoomSkeleton } from "@/components/ui/RoomSkeleton";
import { Navbar } from "@/components/ui/Navbar";
import { GlassCard } from "@/components/ui/GlassCard";
import { LobbyView } from "@/components/lobby/LobbyView";
import { MatrixEntry } from "@/components/game/MatrixEntry";
import { GameView } from "@/components/game/GameView";
import type { Profile } from "@/types";

interface RoomPageClientProps {
  code: string;
  profile: Profile;
}

function RoomContent({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { room, players, loading, error, setReady, startGame, submitBoard } = useRoomContext();

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar profile={profile} />
        <RoomSkeleton />
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

  const currentPlayer = players.find((p) => p.player_id === profile.id);
  const submittedCount = players.filter((p) => p.has_submitted_board).length;

  return (
    <div className="min-h-screen px-4 py-6">
      <div className="max-w-7xl mx-auto">
        <Navbar profile={profile} />

        {!currentPlayer?.has_submitted_board && !currentPlayer?.board && room.status === "waiting" && (
          <LobbyView
            room={room}
            players={players}
            currentUserId={profile.id}
            onReady={(ready) => setReady(profile.id, ready)}
            onStart={startGame}
          />
        )}

        {!currentPlayer?.has_submitted_board && !currentPlayer?.board && room.status === "matrix" && (
          <MatrixEntry
            onSubmit={(board) => submitBoard(profile.id, board)}
            submitted={currentPlayer?.has_submitted_board ?? false}
            waitingCount={{ submitted: submittedCount, total: players.length }}
          />
        )}

        {(currentPlayer?.has_submitted_board || currentPlayer?.board) && (
          <GameView currentUser={profile} />
        )}
      </div>
    </div>
  );
}

export default function RoomPageClient({ code, profile }: RoomPageClientProps) {
  return (
    <RoomProvider code={code} profile={profile}>
      <RoomContent profile={profile} />
    </RoomProvider>
  );
}
