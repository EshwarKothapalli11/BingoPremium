"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { BoardGrid } from "@/components/game/BoardGrid";
import { BingoProgress } from "@/components/game/BingoProgress";
import { OpponentCard } from "@/components/game/OpponentCard";
import { GameChat } from "@/components/game/GameChat";
import { Leaderboard } from "@/components/game/Leaderboard";
import { WinModal } from "@/components/game/WinModal";
import { LiveMovesFeed, type LiveMove } from "@/components/game/LiveMovesFeed";
import { GlassCard } from "@/components/ui/GlassCard";
import { useGame, useGameChat } from "@/hooks/useGame";
import { useRealtime } from "@/hooks/useRealtime";
import {
  getMessages,
  getGameEvents,
  getRoomPlayers,
  fetchProfile,
} from "@/lib/firebase/firestore";
import { formatDuration } from "@/lib/utils";
import type { GameEvent, Message, Profile, Room, RoomPlayer } from "@/types";

interface GameViewProps {
  room: Room;
  players: RoomPlayer[];
  currentUser: Profile;
  onPlayersUpdate: (players: RoomPlayer[]) => void;
  onRoomUpdate: (room: Room) => void;
}

export function GameView({
  room,
  players,
  currentUser,
  onPlayersUpdate,
  onRoomUpdate,
}: GameViewProps) {
  const currentPlayer = players.find((p) => p.player_id === currentUser.id);
  const opponents = players.filter((p) => p.player_id !== currentUser.id);

  const {
    marked,
    setMarked,
    animatingCell,
    cancelCell,
  } = useGame(room.id, currentUser.id, currentPlayer?.id ?? null);

  const { sendMessage } = useGameChat(room.id, currentUser.id);
  const [messages, setMessages] = useState<(Message & { profile?: Profile })[]>([]);
  const [flashPlayerId, setFlashPlayerId] = useState<string | null>(null);
  const [pulseLetter, setPulseLetter] = useState<number | null>(null);
  const [, setTick] = useState(0);
  const [liveMoves, setLiveMoves] = useState<LiveMove[]>([]);
  const [opponentLastMoves, setOpponentLastMoves] = useState<
    Record<string, { row: number; col: number; number?: number }>
  >({});

  useEffect(() => {
    if (currentPlayer?.marked) {
      setMarked(currentPlayer.marked as boolean[][]);
    }
  }, [currentPlayer?.marked, setMarked]);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // Load existing messages
  useEffect(() => {
    async function loadMessages() {
      const msgs = await getMessages(room.id);
      // Attach profiles
      const msgsWithProfiles: (Message & { profile?: Profile })[] = [];
      for (const msg of msgs) {
        const profile = await fetchProfile(msg.player_id);
        msgsWithProfiles.push({
          ...msg,
          profile: profile ?? undefined,
        });
      }
      setMessages(msgsWithProfiles);
    }
    loadMessages();
  }, [room.id]);

  // Load existing game events on mount to populate the live feed
  useEffect(() => {
    async function loadEvents() {
      const events = await getGameEvents(room.id, "cell_cancelled", 50);
      if (events.length > 0) {
        const existingMoves: LiveMove[] = events.map((ev) => {
          const evPlayer = players.find((p) => p.player_id === ev.player_id);
          const payload = ev.payload as Record<string, unknown>;
          const playerBoard = evPlayer?.board as number[][] | null;
          const row = (payload.row as number) ?? 0;
          const col = (payload.col as number) ?? 0;
          let cellNumber: number | undefined;
          if (playerBoard && playerBoard[row] && playerBoard[row][col]) {
            cellNumber = playerBoard[row][col];
          }

          return {
            id: ev.id,
            playerName: evPlayer?.profile?.username ?? "Player",
            playerId: ev.player_id,
            avatarUrl: evPlayer?.profile?.avatar_url,
            number: cellNumber,
            row,
            col,
            marked: (payload.marked as boolean) ?? true,
            moves: (payload.moves as number) ?? 0,
            timestamp: new Date(ev.created_at).getTime(),
          };
        });
        setLiveMoves(existingMoves);
      }
    }
    loadEvents();
  }, [room.id, players]);

  const refreshPlayers = useCallback(async () => {
    const data = await getRoomPlayers(room.id);
    if (data) {
      onPlayersUpdate(data);
    }
  }, [room.id, onPlayersUpdate]);

  const handleGameEvent = useCallback(
    (event: GameEvent) => {
      if (event.event_type === "cell_cancelled") {
        const payload = event.payload as Record<string, unknown>;
        const row = (payload.row as number) ?? 0;
        const col = (payload.col as number) ?? 0;
        const isMarked = (payload.marked as boolean) ?? true;
        const moves = (payload.moves as number) ?? 0;

        // Find the player who made this move
        const movePlayer = players.find((p) => p.player_id === event.player_id);
        const playerBoard = movePlayer?.board as number[][] | null;
        let cellNumber: number | undefined;
        if (playerBoard && playerBoard[row] && playerBoard[row][col]) {
          cellNumber = playerBoard[row][col];
        }

        const liveMove: LiveMove = {
          id: event.id,
          playerName: movePlayer?.profile?.username ?? "Player",
          playerId: event.player_id,
          avatarUrl: movePlayer?.profile?.avatar_url,
          number: cellNumber,
          row,
          col,
          marked: isMarked,
          moves,
          timestamp: Date.now(),
        };

        setLiveMoves((prev) => [...prev.slice(-49), liveMove]);

        // Track last move per opponent for the OpponentCard toast
        if (event.player_id !== currentUser.id) {
          setOpponentLastMoves((prev) => ({
            ...prev,
            [event.player_id]: { row, col, number: cellNumber },
          }));
        }
      }

      refreshPlayers();
    },
    [players, currentUser.id, refreshPlayers]
  );

  useRealtime(room.id, {
    onPlayerChange: async (player, event) => {
      await refreshPlayers();
      if (event === "UPDATE" && player.player_id !== currentUser.id) {
        setFlashPlayerId(player.player_id);
        setTimeout(() => setFlashPlayerId(null), 150);
        if (player.bingo_letters > 0) {
          setPulseLetter(player.bingo_letters - 1);
          setTimeout(() => setPulseLetter(null), 400);
        }
      }
    },
    onRoomChange: (updatedRoom) => {
      onRoomUpdate(updatedRoom);
    },
    onMessage: async (msg) => {
      const profile = await fetchProfile(msg.player_id);
      setMessages((prev) => [...prev, { ...msg, profile: profile ?? undefined }]);
    },
    onGameEvent: handleGameEvent,
  }, "room-game");

  const winner = useMemo(() => {
    if (!room.winner_id) return null;
    return players.find((p) => p.player_id === room.winner_id);
  }, [room.winner_id, players]);

  const board = currentPlayer?.board ?? Array.from({ length: 5 }, () => Array(5).fill(0));
  const completedLines = (currentPlayer?.completed_lines as string[]) ?? [];

  if (room.status === "finished" && room.winner_id) {
    const isWinner = room.winner_id === currentUser.id;
    const winPlayer = isWinner ? currentPlayer : winner;

    return (
      <WinModal
        isWinner={isWinner}
        winnerName={winner?.profile?.username ?? "Unknown"}
        profile={currentUser}
        stats={{
          moves: winPlayer?.moves ?? 0,
          lines: winPlayer?.lines_completed ?? 0,
          duration: formatDuration(room.started_at),
        }}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-6 max-w-7xl mx-auto">
      {/* Left — Opponents */}
      <div className="space-y-3 order-2 lg:order-1">
        <h3 className="font-semibold text-sm text-slate-500 px-1 uppercase tracking-wider">Opponents</h3>
        {opponents.map((opp) => (
          <OpponentCard
            key={opp.id}
            player={opp}
            flash={flashPlayerId === opp.player_id}
            lastMove={opponentLastMoves[opp.player_id] ?? null}
          />
        ))}
        {opponents.length === 0 && (
          <GlassCard className="p-4 text-sm text-slate-500 text-center font-medium border border-slate-200">
            No opponents yet
          </GlassCard>
        )}
      </div>

      {/* Center — Your Board */}
      <div className="order-1 lg:order-2 flex flex-col items-center">
        <div className="mb-6">
          <BingoProgress
            lettersEarned={currentPlayer?.bingo_letters ?? 0}
            pulseLetter={pulseLetter}
          />
        </div>

        <BoardGrid
          board={board as number[][]}
          marked={marked}
          onCellClick={cancelCell}
          animatingCell={animatingCell}
          completedLines={completedLines}
          showHeaders={false}
        />

        <p className="mt-4 text-sm text-slate-500 font-medium bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
          Moves: <span className="font-bold text-primary text-base">{currentPlayer?.moves ?? 0}</span>
        </p>
      </div>

      {/* Right — Stats, Live Feed & Chat */}
      <div className="space-y-4 order-3">
        <GlassCard className="p-4 shadow-sm">
          <h3 className="font-semibold text-sm mb-3 text-slate-800">Game Stats</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <p className="text-xl font-bold text-primary">{currentPlayer?.moves ?? 0}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Moves</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <p className="text-xl font-bold text-primary">{currentPlayer?.lines_completed ?? 0}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Lines</p>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
              <p className="text-xl font-bold text-primary">{formatDuration(room.started_at)}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Time</p>
            </div>
          </div>
        </GlassCard>

        <LiveMovesFeed moves={liveMoves} currentPlayerId={currentUser.id} />

        <Leaderboard players={players} currentPlayerId={currentUser.id} />

        <GameChat
          messages={messages}
          onSend={sendMessage}
          currentPlayerId={currentUser.id}
        />
      </div>
    </div>
  );
}
