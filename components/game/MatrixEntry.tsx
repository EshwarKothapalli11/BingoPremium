"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { cn } from "@/lib/utils";
import { validateBoard } from "@/lib/bingo-logic";
import { createEmptyBoardGrid } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { BingoButton } from "@/components/ui/BingoButton";

interface MatrixEntryProps {
  onSubmit: (board: number[][]) => void;
  submitted: boolean;
  waitingCount: { submitted: number; total: number };
}

export function MatrixEntry({ onSubmit, submitted, waitingCount }: MatrixEntryProps) {
  const [board, setBoard] = useState<number[][]>(createEmptyBoardGrid());
  const [focused, setFocused] = useState<[number, number]>([0, 0]);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: 5 }, () => Array(5).fill(null))
  );

  const validation = validateBoard(board);

  useEffect(() => {
    inputRefs.current[0]?.[0]?.focus();
  }, []);

  const setCell = useCallback((r: number, c: number, value: string) => {
    const num = parseInt(value, 10);
    setBoard((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = isNaN(num) ? 0 : num;
      return next;
    });
  }, []);

  const moveFocus = useCallback((r: number, c: number) => {
    const nr = Math.max(0, Math.min(4, r));
    const nc = Math.max(0, Math.min(4, c));
    setFocused([nr, nc]);
    inputRefs.current[nr]?.[nc]?.focus();
  }, []);

  const handleKeyDown = (
    e: React.KeyboardEvent,
    r: number,
    c: number
  ) => {
    switch (e.key) {
      case "ArrowUp":
        e.preventDefault();
        moveFocus(r - 1, c);
        break;
      case "ArrowDown":
      case "Enter":
        e.preventDefault();
        moveFocus(r + 1, c);
        break;
      case "ArrowLeft":
        e.preventDefault();
        moveFocus(r, c - 1);
        break;
      case "ArrowRight":
        e.preventDefault();
        moveFocus(r, c + 1);
        break;
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) moveFocus(r, c - 1);
        else moveFocus(r, c + 1);
        break;
    }
  };

  if (submitted) {
    return (
      <GlassCard className="p-8 text-center max-w-md mx-auto">
        <div className="text-4xl mb-4">⏳</div>
        <h2 className="text-xl font-bold mb-2">Board Submitted!</h2>
        <p className="text-text-muted">
          Waiting for other players… ({waitingCount.submitted}/{waitingCount.total})
        </p>
        <div className="mt-4 h-2 bg-white/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{
              width: `${(waitingCount.submitted / waitingCount.total) * 100}%`,
            }}
          />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-bold mb-1">Enter Your Matrix</h2>
      <p className="text-sm text-text-muted mb-6">
        Fill in 25 unique integers ≥ 1. Use arrow keys, Enter, and Tab to navigate.
      </p>

      <div className="grid grid-cols-5 gap-2 mb-6">
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isDuplicate = validation.duplicates.has(`${r}-${c}`);
            const isFocused = focused[0] === r && focused[1] === c;

            return (
              <input
                key={`${r}-${c}`}
                ref={(el) => {
                  if (!inputRefs.current[r]) inputRefs.current[r] = [];
                  inputRefs.current[r][c] = el;
                }}
                type="number"
                min={1}
                value={cell || ""}
                onChange={(e) => setCell(r, c, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, r, c)}
                onFocus={() => setFocused([r, c])}
                className={cn(
                  "w-full aspect-square glass-card text-center text-lg font-semibold outline-none",
                  "transition-all duration-150",
                  isFocused && "ring-2 ring-primary/50 border-primary/50",
                  isDuplicate && "border-danger ring-2 ring-danger/50"
                )}
              />
            );
          })
        )}
      </div>

      {!validation.valid && (
        <p className="text-sm text-danger mb-4">
          {validation.errors[0] || "Fix duplicate values highlighted in red"}
        </p>
      )}

      <BingoButton
        className="w-full"
        disabled={!validation.valid}
        onClick={() => onSubmit(board)}
      >
        Submit Board
      </BingoButton>
    </GlassCard>
  );
}
