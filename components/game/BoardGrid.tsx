"use client";

import { cn } from "@/lib/utils";
import type { MarkedGrid } from "@/types";
import { getWinningCells } from "@/lib/bingo-logic";

interface BoardGridProps {
  board: number[][];
  marked: MarkedGrid;
  onCellClick?: (row: number, col: number) => void;
  readOnly?: boolean;
  animatingCell?: string | null;
  completedLines?: string[];
  showHeaders?: boolean;
}

export function BoardGrid({
  board,
  marked,
  onCellClick,
  readOnly = false,
  animatingCell,
  completedLines = [],
  showHeaders = true,
}: BoardGridProps) {
  const winningCells = getWinningCells(completedLines);
  const headers = ["B", "I", "N", "G", "O"];

  return (
    <div className="flex flex-col items-center gap-3">
      {showHeaders && (
        <div className="flex gap-2 mb-1">
          {headers.map((h) => (
            <div
              key={h}
              className="w-20 h-10 rounded-full glass-badge flex items-center justify-center font-bold text-primary"
            >
              {h}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-5 gap-2">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const key = `${r}-${c}`;
            const isMarked = marked[r]?.[c];
            const isWinner = winningCells.has(key);
            const isAnimating = animatingCell === key;

            return (
              <button
                key={key}
                type="button"
                disabled={readOnly}
                onClick={() => onCellClick?.(r, c)}
                className={cn(
                  "w-20 h-20 glass-card flex items-center justify-center",
                  "text-lg font-semibold transition-all duration-100",
                  !readOnly && "hover:-translate-y-0.5 hover:border-primary/50 cursor-pointer",
                  isMarked && "cell-cancelled",
                  isWinner && "cell-winner",
                  isAnimating && "animate-cell-cancel",
                  readOnly && "cursor-default"
                )}
              >
                {cell || "—"}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
