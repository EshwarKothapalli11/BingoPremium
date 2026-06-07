"use client";

import { useEffect, useRef } from "react";
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

export function LiveMovesFeed({ moves, currentPlayerId }: LiveMovesFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [moves.length]);

  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <h3 className="font-semibold text-sm">Live Moves</h3>
      </div>

      <div
        ref={scrollRef}
        className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1 scroll-smooth"
      >
        {moves.length === 0 && (
          <p className="text-xs text-text-muted text-center py-3">
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
                "flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-xs transition-all duration-300",
                isNew && "animate-slide-in",
                isYou
                  ? "bg-primary/8 border border-primary/15"
                  : "bg-white/40 border border-white/30"
              )}
            >
              <Avatar
                name={move.playerName}
                avatarUrl={move.avatarUrl}
                size="xs"
              />
              <div className="flex-1 min-w-0">
                <span className={cn("font-semibold", isYou && "text-primary")}>
                  {isYou ? "You" : move.playerName}
                </span>{" "}
                <span className="text-text-muted">
                  {move.marked ? "cancelled" : "unmarked"}{" "}
                </span>
                {move.number !== undefined && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-primary/12 text-primary font-bold text-[10px]">
                    {move.number}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-text-muted tabular-nums whitespace-nowrap">
                #{move.moves}
              </span>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
