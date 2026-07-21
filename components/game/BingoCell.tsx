"use client";

import { memo } from "react";
import { cn } from "@/lib/utils";

interface BingoCellProps {
  row: number;
  col: number;
  cell: number;
  isMarked: boolean;
  isWinner: boolean;
  isAnimating: boolean;
  readOnly: boolean;
  onCellClick?: (row: number, col: number) => void;
}

export const BingoCell = memo(function BingoCell({
  row,
  col,
  cell,
  isMarked,
  isWinner,
  isAnimating,
  readOnly,
  onCellClick,
}: BingoCellProps) {
  return (
    <button
      type="button"
      disabled={readOnly}
      onClick={() => onCellClick?.(row, col)}
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
}, (prev, next) => {
  return (
    prev.isMarked === next.isMarked &&
    prev.isWinner === next.isWinner &&
    prev.isAnimating === next.isAnimating &&
    prev.readOnly === next.readOnly &&
    prev.cell === next.cell
  );
});
