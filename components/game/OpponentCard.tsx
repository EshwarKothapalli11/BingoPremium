"use client";

import { useEffect, useRef, useState, memo } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/Avatar";
import { BingoProgress } from "@/components/game/BingoProgress";
import { GlassCard } from "@/components/ui/GlassCard";
import type { RoomPlayer } from "@/types";

interface OpponentCardProps {
  player: RoomPlayer;
  flash?: boolean;
  lastMove?: { row: number; col: number; number?: number } | null;
  isActiveTurn?: boolean;
}

export const OpponentCard = memo(function OpponentCard({ player, flash, lastMove, isActiveTurn }: OpponentCardProps) {
  const name = player.profile?.username ?? "Player";
  const prevMoves = useRef(player.moves);
  const [showMoveToast, setShowMoveToast] = useState(false);

  useEffect(() => {
    if (player.moves > prevMoves.current && lastMove) {
      setShowMoveToast(true);
      const timer = setTimeout(() => setShowMoveToast(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [player.moves, lastMove]);

  useEffect(() => {
    prevMoves.current = player.moves;
  }, [player.moves]);

  const marked = (player.marked as boolean[][]) ?? Array.from({ length: 5 }, () => Array(5).fill(false));

  return (
    <GlassCard
      className={cn(
        "p-4 transition-all duration-300 relative overflow-hidden shadow-sm",
        flash && "animate-flash",
        isActiveTurn ? "border-amber-400 shadow-md shadow-amber-400/20 ring-1 ring-amber-400" : "border-slate-200"
      )}
    >
      {/* Active Turn Indicator for Opponent */}
      {isActiveTurn && (
        <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Turn</span>
        </div>
      )}
      {/* Move toast overlay */}
      {showMoveToast && lastMove && (
        <div className="absolute top-2 right-2 z-10 animate-slide-in">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-[10px] font-semibold text-blue-700 shadow-sm backdrop-blur-sm">
            <span className="w-4 h-4 rounded bg-blue-100 flex items-center justify-center text-[9px]">
              {lastMove.number ?? "?"}
            </span>
            cancelled
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-3">
        <Avatar name={name} avatarUrl={player.profile?.avatar_url} size="sm" />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">
            {player.lines_completed} line{player.lines_completed !== 1 ? "s" : ""} · {player.moves} moves
          </p>
        </div>
      </div>

      {/* Mini 5×5 marked pattern grid */}
      <div className="mb-3">
        <div className="grid grid-cols-5 gap-[3px] max-w-[100px]">
          {marked.map((row: boolean[], r: number) =>
            row.map((isMarked: boolean, c: number) => {
              const isLastMove = lastMove && lastMove.row === r && lastMove.col === c && showMoveToast;
              return (
                <div
                  key={`${r}-${c}`}
                  className={cn(
                    "w-[17px] h-[17px] rounded-[3px] transition-all duration-200",
                    isMarked
                      ? "bg-gradient-to-br from-primary/80 to-accent/80 shadow-sm shadow-primary/20"
                      : "bg-white border border-slate-200 shadow-sm",
                    isLastMove && "ring-1 ring-primary animate-cell-cancel scale-110"
                  )}
                />
              );
            })
          )}
        </div>
      </div>

      <BingoProgress lettersEarned={player.bingo_letters} size="sm" />
    </GlassCard>
  );
});
