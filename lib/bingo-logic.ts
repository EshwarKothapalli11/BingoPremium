import type { BoardGrid, LineCoord, MarkedGrid, BingoState } from "@/types";
import { lineKey } from "@/lib/utils";

export function getAllLines(): LineCoord[] {
  const lines: LineCoord[] = [];

  for (let r = 0; r < 5; r++) {
    lines.push({
      type: "row",
      index: r,
      cells: Array.from({ length: 5 }, (_, c) => [r, c] as [number, number]),
    });
  }

  for (let c = 0; c < 5; c++) {
    lines.push({
      type: "col",
      index: c,
      cells: Array.from({ length: 5 }, (_, r) => [r, c] as [number, number]),
    });
  }

  lines.push({
    type: "diag",
    index: 0,
    cells: [
      [0, 0],
      [1, 1],
      [2, 2],
      [3, 3],
      [4, 4],
    ],
  });

  lines.push({
    type: "diag",
    index: 1,
    cells: [
      [0, 4],
      [1, 3],
      [2, 2],
      [3, 1],
      [4, 0],
    ],
  });

  return lines;
}

export function isLineComplete(
  marked: MarkedGrid,
  cells: [number, number][]
): boolean {
  return cells.every(([r, c]) => marked[r][c]);
}

export function detectBingoState(
  marked: MarkedGrid,
  existingCompletedLines: string[] = []
): BingoState {
  const completedSet = new Set(existingCompletedLines);
  const allLines = getAllLines();

  for (const line of allLines) {
    const key = lineKey(line.type, line.index);
    if (!completedSet.has(key) && isLineComplete(marked, line.cells)) {
      completedSet.add(key);
    }
  }

  const completedLines = Array.from(completedSet);
  const linesCompleted = completedLines.length;
  const bingoLetters = Math.min(5, linesCompleted);

  return {
    completedLines,
    bingoLetters,
    linesCompleted,
    hasBingo: bingoLetters >= 5,
  };
}

export function validateBoard(board: BoardGrid): {
  valid: boolean;
  errors: string[];
  duplicates: Set<string>;
} {
  const errors: string[] = [];
  const seen = new Map<number, [number, number]>();
  const duplicates = new Set<string>();

  for (let r = 0; r < 5; r++) {
    for (let c = 0; c < 5; c++) {
      const val = board[r][c];
      if (!Number.isInteger(val) || val < 1) {
        errors.push(`Cell (${r + 1},${c + 1}) must be an integer ≥ 1`);
      }
      if (seen.has(val)) {
        duplicates.add(`${r}-${c}`);
        const [pr, pc] = seen.get(val)!;
        duplicates.add(`${pr}-${pc}`);
      } else if (val >= 1) {
        seen.set(val, [r, c]);
      }
    }
  }

  if (seen.size !== 25) {
    errors.push("Board must contain 25 unique numbers");
  }

  return { valid: errors.length === 0 && seen.size === 25, errors, duplicates };
}

export function toggleCell(
  marked: MarkedGrid,
  row: number,
  col: number
): MarkedGrid {
  const next = marked.map((r) => [...r]);
  next[row][col] = !next[row][col];
  return next;
}

export function getWinningCells(completedLines: string[]): Set<string> {
  const winning = new Set<string>();
  const allLines = getAllLines();

  for (const key of completedLines) {
    const line = allLines.find((l) => lineKey(l.type, l.index) === key);
    if (line) {
      for (const [r, c] of line.cells) {
        winning.add(`${r}-${c}`);
      }
    }
  }

  return winning;
}
