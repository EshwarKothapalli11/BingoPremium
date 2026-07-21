"use client";

import { useCallback, useState } from "react";
import { createEmptyMarkedGrid } from "@/lib/utils";
import {
  getRoomPlayerDoc,
  insertMessage,
  submitMoveTransaction,
} from "@/lib/firebase/firestore";
import type { MarkedGrid } from "@/types";

export function useGame(
  roomId: string | null,
  playerId: string | null,
  roomPlayerId: string | null,
  allPlayerIds: string[] = []
) {
  const [marked, setMarked] = useState<MarkedGrid>(createEmptyMarkedGrid());
  const [animatingCell, setAnimatingCell] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cancelCell = useCallback(
    async (row: number, col: number) => {
      if (!roomId || !playerId || isSubmitting) return;

      const effectivePlayerId = roomPlayerId || playerId;

      // Guard: already marked locally
      if (marked[row][col]) return;

      setIsSubmitting(true);
      try {
        // Resolve the number from the player's board
        const current = await getRoomPlayerDoc(roomId, effectivePlayerId);
        const selectedNumber = current?.board?.[row]?.[col];

        if (selectedNumber === undefined) {
          throw new Error("Cell is empty or board is missing");
        }

        // Optimistic animation
        setAnimatingCell(`${row}-${col}`);
        setTimeout(() => setAnimatingCell(null), 300);

        // Single transaction: updates all players, emits events, switches turn
        await submitMoveTransaction(
          roomId,
          effectivePlayerId,
          allPlayerIds,
          selectedNumber
        );
      } catch (err: any) {
        console.error("Move failed:", err);
        window.alert(`Move failed: ${err.message}`);
      } finally {
        setIsSubmitting(false);
      }
    },
    [roomId, playerId, roomPlayerId, marked, allPlayerIds, isSubmitting]
  );

  return {
    marked,
    setMarked,
    animatingCell,
    cancelCell,
    isSubmitting,
  };
}

// Simple helper to format elapsed time in useGame
function formatDuration(isoString: string) {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}


export function useGameChat(roomId: string | null, playerId: string | null) {
  const sendMessage = useCallback(
    async (content: string) => {
      if (!roomId || !playerId || !content.trim()) return;
      await insertMessage(roomId, {
        room_id: roomId,
        player_id: playerId,
        content: content.trim(),
      });
    },
    [roomId, playerId]
  );

  return { sendMessage };
}
