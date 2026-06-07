"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase";
import { detectBingoState, toggleCell } from "@/lib/bingo-logic";
import { createEmptyMarkedGrid } from "@/lib/utils";
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
      if (!roomId || !playerId || !roomPlayerId) return;

      const supabase = createClient();
      const nextMarked = toggleCell(marked, row, col);
      const prevMarked = marked[row][col];
      const newMarked = !prevMarked;

      setMarked(nextMarked);
      setAnimatingCell(`${row}-${col}`);
      setTimeout(() => setAnimatingCell(null), 100);

      const bingoState = detectBingoState(nextMarked);

      const { data: current } = await supabase
        .from("room_players")
        .select("moves, completed_lines")
        .eq("id", roomPlayerId)
        .single();

      const newMoves = (current?.moves ?? 0) + 1;

      await supabase
        .from("room_players")
        .update({
          marked: nextMarked,
          moves: newMoves,
          completed_lines: bingoState.completedLines,
          bingo_letters: bingoState.bingoLetters,
          lines_completed: bingoState.linesCompleted,
        })
        .eq("id", roomPlayerId);

      await supabase.from("game_events").insert({
        room_id: roomId,
        player_id: playerId,
        event_type: newMarked ? "cell_cancelled" : "cell_cancelled",
        payload: { row, col, marked: newMarked, moves: newMoves, bingoState },
      });

      if (bingoState.bingoLetters > (current?.completed_lines?.length ?? 0)) {
        await supabase.from("game_events").insert({
          room_id: roomId,
          player_id: playerId,
          event_type: "bingo_letter",
          payload: { letters: bingoState.bingoLetters },
        });
      }

      if (bingoState.hasBingo) {
        await supabase.from("game_events").insert({
          room_id: roomId,
          player_id: playerId,
          event_type: "game_won",
          payload: { moves: newMoves, lines: bingoState.linesCompleted },
        });

        await supabase
          .from("rooms")
          .update({ status: "finished", winner_id: playerId })
          .eq("id", roomId);

        const { data: room } = await supabase
          .from("rooms")
          .select("started_at")
          .eq("id", roomId)
          .single();

        const duration = room?.started_at
          ? formatElapsed(room.started_at)
          : "0:00";

        const { count } = await supabase
          .from("room_players")
          .select("*", { count: "exact", head: true })
          .eq("room_id", roomId);

        await supabase.from("history").insert({
          room_id: roomId,
          winner_id: playerId,
          moves: newMoves,
          duration,
          players_count: count ?? 2,
        });

        const { data: winnerProfile } = await supabase
          .from("profiles")
          .select("games_played, games_won, total_moves")
          .eq("id", playerId)
          .single();

        if (winnerProfile) {
          await supabase
            .from("profiles")
            .update({
              games_won: winnerProfile.games_won + 1,
              games_played: winnerProfile.games_played + 1,
              total_moves: winnerProfile.total_moves + newMoves,
            })
            .eq("id", playerId);
        }

        const losers = await supabase
          .from("room_players")
          .select("player_id, moves")
          .eq("room_id", roomId)
          .neq("player_id", playerId);

        for (const loser of losers.data ?? []) {
          const { data: lp } = await supabase
            .from("profiles")
            .select("games_played, total_moves")
            .eq("id", loser.player_id)
            .single();
          if (lp) {
            await supabase
              .from("profiles")
              .update({
                games_played: lp.games_played + 1,
                total_moves: lp.total_moves + loser.moves,
              })
              .eq("id", loser.player_id);
          }
        }
      }
    },
    [roomId, playerId, roomPlayerId, marked]
  );

  const submitBoard = useCallback(
    async (board: number[][]) => {
      if (!roomPlayerId || !roomId) return;

      const supabase = createClient();
      const emptyMarked = createEmptyMarkedGrid();

      await supabase
        .from("room_players")
        .update({
          board,
          marked: emptyMarked,
          has_submitted_board: true,
        })
        .eq("id", roomPlayerId);

      const { data: allPlayers } = await supabase
        .from("room_players")
        .select("has_submitted_board")
        .eq("room_id", roomId);

      const allSubmitted = (allPlayers || []).every((p) => p.has_submitted_board);

      if (allSubmitted) {
        await supabase
          .from("rooms")
          .update({ status: "playing" })
          .eq("id", roomId);
      }
    },
    [roomPlayerId, roomId]
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
    submitBoard,
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
      const supabase = createClient();
      await supabase.from("messages").insert({
        room_id: roomId,
        player_id: playerId,
        content: content.trim(),
      });
    },
    [roomId, playerId]
  );

  return { sendMessage };
}
