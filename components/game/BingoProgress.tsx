"use client";

import { cn } from "@/lib/utils";
import { BINGO_LETTERS } from "@/types";

interface BingoProgressProps {
  lettersEarned: number;
  size?: "sm" | "md";
  pulseLetter?: number | null;
}

export function BingoProgress({ lettersEarned, size = "md", pulseLetter }: BingoProgressProps) {
  const badgeSize = size === "sm" ? "w-7 h-7 text-xs" : "w-10 h-10 text-sm";

  return (
    <div className="flex gap-1.5">
      {BINGO_LETTERS.map((letter, i) => {
        const earned = i < lettersEarned;
        const pulsing = pulseLetter === i;

        return (
          <div
            key={letter}
            className={cn(
              "rounded-full flex items-center justify-center font-bold transition-all duration-300",
              badgeSize,
              earned
                ? "bingo-badge-earned shadow-md shadow-primary/30"
                : "glass-badge text-text-muted"
            )}
            style={pulsing ? { animation: "badgePulse 400ms ease-out" } : undefined}
          >
            {letter}
          </div>
        );
      })}
    </div>
  );
}
