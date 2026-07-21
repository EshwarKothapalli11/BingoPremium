"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { BoardGrid } from "@/components/game/BoardGrid";
import { BingoProgress } from "@/components/game/BingoProgress";
import { OpponentCard } from "@/components/game/OpponentCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { useGame, useGameChat } from "@/hooks/useGame";
import { useRoomContext } from "@/context/RoomContext";
import { formatDuration } from "@/lib/utils";
import type { Profile } from "@/types";

// Lazy load non-critical components
const GameChat = dynamic(() => import("@/components/game/GameChat").then(mod => mod.GameChat), { ssr: false });
const Leaderboard = dynamic(() => import("@/components/game/Leaderboard").then(mod => mod.Leaderboard), { ssr: false });
const WinModal = dynamic(() => import("@/components/game/WinModal").then(mod => mod.WinModal), { ssr: false });
const LiveMovesFeed = dynamic(() => import("@/components/game/LiveMovesFeed").then(mod => mod.LiveMovesFeed), { ssr: false });

interface GameViewProps {
  currentUser: Profile;
}

export function GameView({ currentUser }: GameViewProps) {
  const { room, players, messages, liveMoves } = useRoomContext();

  const currentPlayer = players.find((p) => p.player_id === currentUser.id);
  const opponents = players.filter((p) => p.player_id !== currentUser.id);

  const allPlayerIds = useMemo(() => players.map((p) => p.player_id), [players]);

  const {
    marked,
    setMarked,
    animatingCell,
    cancelCell,
    isSubmitting,
  } = useGame(room?.id ?? null, currentUser.id, currentPlayer?.id ?? null, allPlayerIds);

  const { sendMessage } = useGameChat(room?.id ?? null, currentUser.id);
  const [pulseLetter, setPulseLetter] = useState<number | null>(null);
  const [, setTick] = useState(0);

  // We can track last move directly from liveMoves if needed, or just let live moves handle feed.
  // We'll keep a simple tracking for flash effect based on opponent moves
  const [opponentLastMoves, setOpponentLastMoves] = useState<Record<string, { row: number; col: number; number?: number }>>({});
  const [flashPlayerId, setFlashPlayerId] = useState<string | null>(null);

  useEffect(() => {
    if (liveMoves.length > 0) {
      const lastMove = liveMoves[liveMoves.length - 1];
      if (lastMove.playerId !== currentUser.id) {
        setOpponentLastMoves(prev => ({
          ...prev,
          [lastMove.playerId]: { row: lastMove.row, col: lastMove.col, number: lastMove.number }
        }));
        setFlashPlayerId(lastMove.playerId);
        setTimeout(() => setFlashPlayerId(null), 150);
      }
    }
  }, [liveMoves, currentUser.id]);

  const isMyTurn = room?.current_turn_id === currentUser.id;

  // --- LIFECYCLE LOGGING ---
  useEffect(() => {
    if (!room) return;
    console.log(`[LIFECYCLE] Realtime listener update received.`);
    console.log(`[LIFECYCLE] 1. user.uid:`, currentUser.id);
    console.log(`[LIFECYCLE] 2 & 7. room.current_turn_id:`, room.current_turn_id);
    console.log(`[LIFECYCLE] 3 & 9. isMyTurn evaluates to:`, isMyTurn);
    console.log(`[LIFECYCLE] room.status:`, room.status);
    console.log(`[LIFECYCLE] isSubmittingMove evaluates to:`, isSubmitting);
  }, [room?.current_turn_id, room?.status, isMyTurn, currentUser.id, isSubmitting, room]);

  // Sync marked state from Firestore realtime listener (single source of truth)
  useEffect(() => {
    if (currentPlayer?.marked) {
      setMarked(currentPlayer.marked as boolean[][]);
    }
  }, [currentPlayer?.marked, setMarked]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const winner = useMemo(() => {
    if (!room?.winner_id) return null;
    return players.find((p) => p.player_id === room.winner_id);
  }, [room?.winner_id, players]);

  if (!room) return null;

  const board = currentPlayer?.board ?? Array.from({ length: 5 }, () => Array(5).fill(0));
  const completedLines = (currentPlayer?.completed_lines as string[]) ?? [];

  if (room.status === "finished" && room.winner_id) {
    const isWinner = room.winner_id === currentUser.id;
    const winPlayer = isWinner ? currentPlayer : winner;

    return (
      <WinModal
        isWinner={isWinner}
        winnerName={winner?.profile?.username ?? "Unknown"}
        profile={currentUser}
        stats={{
          moves: winPlayer?.moves ?? 0,
          lines: winPlayer?.lines_completed ?? 0,
          duration: formatDuration(room.started_at),
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6 max-w-7xl mx-auto">
      {/* Left — Opponents */}
      <div className="space-y-3 order-2 lg:order-1">
        <h3 className="font-semibold text-sm text-slate-500 px-1 uppercase tracking-wider">Opponents</h3>
        {opponents.map((opp) => (
          <OpponentCard
            key={opp.id}
            player={opp}
            flash={flashPlayerId === opp.player_id}
            lastMove={opponentLastMoves[opp.player_id] ?? null}
            isActiveTurn={room.current_turn_id === opp.player_id}
          />
        ))}
        {opponents.length === 0 && (
          <GlassCard className="p-4 text-sm text-slate-500 text-center font-medium border border-slate-200">
            No opponents yet
          </GlassCard>
        )}
      </div>

      {/* Center — Your Board */}
      <div className="order-1 lg:order-2 flex flex-col items-center">
        <div className="mb-4">
          <BingoProgress
            lettersEarned={currentPlayer?.bingo_letters ?? 0}
            pulseLetter={pulseLetter}
          />
        </div>
        
        {/* Turn Indicator */}
        <div className="mb-4 h-9">
          {!room.current_turn_id ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-slate-700 border border-slate-200 font-bold text-sm shadow-sm">
              <span className="w-3 h-3 rounded-full bg-slate-400 animate-pulse"></span>
              Initializing turn...
            </div>
          ) : isMyTurn ? (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-sm shadow-sm animate-pulse">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              Your Turn
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-sm shadow-sm">
              <span className="w-3 h-3 rounded-full bg-amber-400"></span>
              {opponents.length === 0 || room.status !== "playing" ? "Waiting for another player..." : "Waiting for opponent..."}
            </div>
          )}
        </div>

        <BoardGrid
          board={board as number[][]}
          marked={marked}
          onCellClick={cancelCell}
          animatingCell={animatingCell}
          completedLines={completedLines}
          showHeaders={false}
          readOnly={!isMyTurn || isSubmitting}
        />

        <p className="mt-4 text-sm text-slate-500 font-medium bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          Moves: <span className="font-bold text-primary text-base">{currentPlayer?.moves ?? 0}</span>
        </p>
      </div>

      {/* Right — Stats, Live Feed & Chat */}
      <div className="space-y-4 order-3">
        <GlassCard className="p-4 shadow-sm">
          <h3 className="font-semibold text-sm mb-3 text-slate-800">Game Stats</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <p className="text-xl font-bold text-primary">{currentPlayer?.moves ?? 0}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Moves</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <p className="text-xl font-bold text-primary">{currentPlayer?.lines_completed ?? 0}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lines</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <p className="text-xl font-bold text-primary">{formatDuration(room.started_at)}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</p>
            </div>
          </div>
        </GlassCard>

        <LiveMovesFeed moves={liveMoves} currentPlayerId={currentUser.id} />

        <Leaderboard players={players} currentPlayerId={currentUser.id} />

        <GameChat
          messages={messages}
          onSend={sendMessage}
          currentPlayerId={currentUser.id}
        />
      </div>
    </div>
  );
}
