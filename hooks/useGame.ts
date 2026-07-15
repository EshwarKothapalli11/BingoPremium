"use client";

import { useCallback, useState } from "react";
import { detectBingoState, toggleCell } from "@/lib/bingo-logic";
import { createEmptyMarkedGrid } from "@/lib/utils";
import {
  getRoomPlayerDoc,
  updateRoomPlayer,
  insertGameEvent,
  updateRoom,
  fetchRoom as firestoreFetchRoom,
  getRoomPlayerCount,
  insertHistory,
  fetchProfile,
  updateProfile,
  getRoomPlayers,
  insertMessage,
} from "@/lib/firebase/firestore";
import type { MarkedGrid, RoomPlayer } from "@/types";

export function useGame(
  roomId: string | null,
  playerId: string | null,
  roomPlayerId: string | null
) {
  const [marked, setMarked] = useState<MarkedGrid>(createEmptyMarkedGrid());
  const [animatingCell, setAnimatingCell] = useState<string | null>(null);

  const cancelCell = useCallback(
    async (row: number, col: number) => {
      if (!roomId || !playerId) return;

      // In Firestore, room_player doc ID = playerId (not a separate UUID)
      const effectivePlayerId = roomPlayerId || playerId;

      const nextMarked = toggleCell(marked, row, col);
      const prevMarked = marked[row][col];
      const newMarked = !prevMarked;

      setMarked(nextMarked);
      setAnimatingCell(`${row}-${col}`);
      setTimeout(() => setAnimatingCell(null), 100);

      const bingoState = detectBingoState(nextMarked);

      const current = await getRoomPlayerDoc(roomId, effectivePlayerId);
      const newMoves = (current?.moves ?? 0) + 1;

      await updateRoomPlayer(roomId, effectivePlayerId, {
        marked: nextMarked,
        moves: newMoves,
        completed_lines: bingoState.completedLines,
        bingo_letters: bingoState.bingoLetters,
        lines_completed: bingoState.linesCompleted,
      });

      await insertGameEvent(roomId, {
        room_id: roomId,
        player_id: playerId,
        event_type: newMarked ? "cell_cancelled" : "cell_cancelled",
        payload: { row, col, marked: newMarked, moves: newMoves, bingoState },
      });

      if (bingoState.bingoLetters > (current?.completed_lines?.length ?? 0)) {
        await insertGameEvent(roomId, {
          room_id: roomId,
          player_id: playerId,
          event_type: "bingo_letter",
          payload: { letters: bingoState.bingoLetters },
        });
      }

      if (bingoState.hasBingo) {
        await insertGameEvent(roomId, {
          room_id: roomId,
          player_id: playerId,
          event_type: "game_won",
          payload: { moves: newMoves, lines: bingoState.linesCompleted },
        });

        await updateRoom(roomId, {
          status: "finished",
          winner_id: playerId,
        });

        const room = await firestoreFetchRoom(roomId);
        const duration = room?.started_at
          ? formatElapsed(room.started_at)
          : "0:00";

        const playerCount = await getRoomPlayerCount(roomId);

        await insertHistory({
          room_id: roomId,
          winner_id: playerId,
          moves: newMoves,
          duration,
          players_count: playerCount,
        });

        const winnerProfile = await fetchProfile(playerId);
        if (winnerProfile) {
          await updateProfile(playerId, {
            games_won: winnerProfile.games_won + 1,
            games_played: winnerProfile.games_played + 1,
            total_moves: winnerProfile.total_moves + newMoves,
          });
        }

        const allPlayers = await getRoomPlayers(roomId);
        const losers = allPlayers.filter((p) => p.player_id !== playerId);

        for (const loser of losers) {
          const lp = await fetchProfile(loser.player_id);
          if (lp) {
            await updateProfile(loser.player_id, {
              games_played: lp.games_played + 1,
              total_moves: lp.total_moves + loser.moves,
            });
          }
        }
      }
    },
    [roomId, playerId, roomPlayerId, marked]
  );


  const syncFromPlayer = useCallback((player: RoomPlayer) => {
    if (player.marked) {
      setMarked(player.marked as MarkedGrid);
    }
  }, []);

  return {
    marked,
    setMarked,
    animatingCell,
    cancelCell,
    syncFromPlayer,
  };
}

function formatElapsed(startIso: string): string {
  const elapsed = Date.now() - new Date(startIso).getTime();
  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
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
