"use client";

import { useEffect, useRef, memo } from "react";
import { cn } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { Avatar } from "@/components/ui/Avatar";

export interface LiveMove {
  id: string;
  playerName: string;
  playerId: string;
  avatarUrl?: string | null;
  number?: number;
  row: number;
  col: number;
  marked: boolean;
  moves: number;
  timestamp: number;
}

interface LiveMovesFeedProps {
  moves: LiveMove[];
  currentPlayerId: string;
}

export const LiveMovesFeed = memo(function LiveMovesFeed({ moves, currentPlayerId }: LiveMovesFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length]);

  return (
    <GlassCard className="p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <h3 className="font-semibold text-sm text-slate-800">Live Moves</h3>
      </div>

      <div
        ref={scrollRef}
        className="space-y-2 max-h-[180px] overflow-y-auto pr-1 scroll-smooth"
      >
        {moves.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-3 font-medium">
            No moves yet — waiting for action…
          </p>
        )}

        {moves.map((move, i) => {
          const isYou = move.playerId === currentPlayerId;
          const isNew = i >= moves.length - 1;

          return (
            <div
              key={move.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-xl text-xs transition-all duration-300 shadow-sm",
                isNew && "animate-slide-in",
                isYou
                  ? "bg-blue-50 border border-blue-100"
                  : "bg-white border border-slate-200"
              )}
            >
              <Avatar
                name={move.playerName}
                avatarUrl={move.avatarUrl}
                size="xs"
              />
              <div className="flex-1 min-w-0">
                <span className={cn("font-semibold", isYou ? "text-blue-700" : "text-slate-700")}>
                  {isYou ? "You" : move.playerName}
                </span>{" "}
                <span className="text-slate-500">
                  {move.marked ? "cancelled" : "unmarked"}{" "}
                </span>
                {move.number !== undefined && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px] ml-1">
                    {move.number}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 font-medium tabular-nums whitespace-nowrap">
                #{move.moves}
              </span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
});
