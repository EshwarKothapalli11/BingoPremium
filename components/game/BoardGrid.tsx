"use client";

import { memo } from "react";
import type { MarkedGrid } from "@/types";
import { getWinningCells } from "@/lib/bingo-logic";
import { BingoCell } from "./BingoCell";

interface BoardGridProps {
  board: number[][];
  marked: MarkedGrid;
  onCellClick?: (row: number, col: number) => void;
  readOnly?: boolean;
  animatingCell?: string | null;
  completedLines?: string[];
  showHeaders?: boolean;
}

export const BoardGrid = memo(function BoardGrid({
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
            const isMarked = marked[r]?.[c] ?? false;
            const isWinner = winningCells.has(key);
            const isAnimating = animatingCell === key;

            return (
              <BingoCell
                key={key}
                row={r}
                col={c}
                cell={cell}
                isMarked={isMarked}
                isWinner={isWinner}
                isAnimating={isAnimating}
                readOnly={readOnly}
                onCellClick={onCellClick}
              />
            );
          })
        )}
      </div>
    </div>
  );
});
