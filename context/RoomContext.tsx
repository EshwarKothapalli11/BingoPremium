"use client";

import { createContext, useContext, useEffect, useState, useRef, ReactNode, useCallback, useMemo } from "react";
import { 
  getRoomByCode, 
  getRoomPlayers, 
  getGameEvents, 
  getMessages, 
  fetchProfile,
  joinRoom as firestoreJoinRoom,
  updateRoomPlayer,
  updateRoom,
  submitBoardTransaction,
  hostAutoStartGame,
  hostAutoFinishGame
} from "@/lib/firebase/firestore";
import { subscribeToRoom } from "@/lib/firebase/realtime";
import type { Room, RoomPlayer, GameEvent, Message, Profile } from "@/types";
import type { LiveMove } from "@/components/game/LiveMovesFeed";

interface RoomContextState {
  room: Room | null;
  players: RoomPlayer[];
  messages: (Message & { profile?: Profile })[];
  liveMoves: LiveMove[];
  loading: boolean;
  error: string | null;
  joined: boolean;
  joinRoom: (userId: string) => Promise<{ success?: boolean; error?: string }>;
  setReady: (userId: string, ready: boolean) => Promise<void>;
  startGame: () => Promise<void>;
  submitBoard: (userId: string, board: number[][]) => Promise<void>;
}

const RoomContext = createContext<RoomContextState | null>(null);

export function RoomProvider({ 
  code, 
  profile, 
  children 
}: { 
  code: string; 
  profile: Profile; 
  children: ReactNode 
}) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [messages, setMessages] = useState<(Message & { profile?: Profile })[]>([]);
  const [liveMoves, setLiveMoves] = useState<LiveMove[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);

  // Prevent double-mount in StrictMode
  const mountedRef = useRef(false);
  // Profile cache to prevent duplicate fetches
  const profileCache = useRef<Record<string, Profile>>({ [profile.id]: profile });

  const getCachedProfile = useCallback(async (userId: string): Promise<Profile | undefined> => {
    if (profileCache.current[userId]) return profileCache.current[userId];
    const p = await fetchProfile(userId);
    if (p) profileCache.current[userId] = p;
    return p ?? undefined;
  }, []);

  useEffect(() => {
    if (!code) {
      setLoading(false);
      return;
    }

    let unsub: (() => void) | null = null;
    let cancelled = false;
    let currentStep = "loading room document";

    const timeoutId = setTimeout(() => {
      if (!cancelled) {
        console.error(`[RoomContext] Loading timeout exceeded (5s) at step: ${currentStep}`);
        setError(`Failed while ${currentStep}.`);
        setLoading(false);
      }
    }, 5000);

    const totalStart = performance.now();
    console.log("3. Entering room...");

    async function load() {
      try {
        // ── STEP 1: Fetch room doc (required for roomId) ─────────────
        const roomData = await getRoomByCode(code.toUpperCase());

        if (!roomData) {
          if (!cancelled) { setError("Room not found"); setLoading(false); clearTimeout(timeoutId); }
          return;
        }

        console.log("4. Room document received");
        
        if (cancelled) return;
        setRoom(roomData);
        setLoading(false);
        clearTimeout(timeoutId);

        // ── STEP 2: Safe Auto-join ──
        currentStep = "auto joining room";
        const playerDoc = await import("@/lib/firebase/firestore").then(m => m.getRoomPlayerDoc(roomData.id, profile.id));
        if (!playerDoc) {
          const count = await import("@/lib/firebase/firestore").then(m => m.getRoomPlayerCount(roomData.id));
          if (count < roomData.max_players) {
            await firestoreJoinRoom(roomData.id, profile.id);
          } else {
            setError("Room is full");
            setLoading(false);
            return;
          }
        }
        setJoined(true);

        // ── STEP 3: Fetch everything else asynchronously ──
        currentStep = "fetching players and events";
        Promise.all([
          getRoomPlayers(roomData.id),
          getGameEvents(roomData.id, "cell_cancelled", 50),
          getMessages(roomData.id)
        ]).then(([playersData, eventsData, messagesData]) => {
          if (cancelled) return;
          console.log("5. Player registered");

          // Cache player profiles
          for (const p of playersData) {
            if (p.profile) profileCache.current[p.player_id] = p.profile;
          }

          setPlayers(playersData);

          const currentPlayer = playersData.find((p) => p.player_id === profile.id);
          if (currentPlayer?.board || currentPlayer?.has_submitted_board) {
            console.log("6. Board loaded");
          }

          // Process messages
          const msgsWithProfiles = messagesData.map((msg) => {
            const p = profileCache.current[msg.player_id];
            return { ...msg, profile: p ?? undefined };
          });
          setMessages(msgsWithProfiles);

          // Process game events
          const initialMoves: LiveMove[] = eventsData.map((ev) => {
            const evPlayer = playersData.find((p) => p.player_id === ev.player_id);
            const payload = ev.payload as Record<string, unknown>;
            const playerBoard = evPlayer?.board as number[][] | null;
            const row = (payload.row as number) ?? 0;
            const col = (payload.col as number) ?? 0;
            let cellNumber: number | undefined;
            if (playerBoard && playerBoard[row] && playerBoard[row][col]) {
              cellNumber = playerBoard[row][col];
            }

            const pCache = profileCache.current[ev.player_id];
            return {
              id: ev.id,
              playerName: pCache?.username ?? evPlayer?.profile?.username ?? "Player",
              playerId: ev.player_id,
              avatarUrl: pCache?.avatar_url ?? evPlayer?.profile?.avatar_url,
              number: cellNumber,
              row,
              col,
              marked: (payload.marked as boolean) ?? true,
              moves: (payload.moves as number) ?? 0,
              timestamp: new Date(ev.created_at).getTime(),
            };
          });
          setLiveMoves(initialMoves);
        }).catch(err => console.error("[RoomContext] async fetch error:", err));

        // ── STEP 4: Single realtime subscription ─────────────────────
        unsub = subscribeToRoom(roomData.id, {
          onRoomChange: (updatedRoom) => {
            if (!cancelled) {
              setRoom(updatedRoom);
              console.log("Room snapshot updated");
              if (updatedRoom.status === "playing") {
                console.log("Game started");
              }
            }
          },
          onPlayerChange: async (player, event) => {
            if (cancelled) return;
            console.log("Host received update");
            
            // Attach profile safely for realtime events (if not already fetched)
            if (!player.profile && !profileCache.current[player.player_id]) {
              const p = await getCachedProfile(player.player_id);
              if (p) {
                player.profile = p;
                profileCache.current[player.player_id] = p;
              }
            } else if (!player.profile) {
              player.profile = profileCache.current[player.player_id];
            } else {
              profileCache.current[player.player_id] = player.profile;
            }

            if (cancelled) return;

            setPlayers((prev) => {
              if (event === "DELETE") return prev.filter((p) => p.id !== player.id);
              const exists = prev.some((p) => p.id === player.id);
              if (exists) return prev.map((p) => p.id === player.id ? player : p);
              return [...prev, player].sort((a, b) => a.joined_at.localeCompare(b.joined_at));
            });
          },
          onMessage: async (msg) => {
            if (cancelled) return;
            const p = await getCachedProfile(msg.player_id);
            setMessages((prev) => [...prev, { ...msg, profile: p ?? undefined }]);
          },
          onGameEvent: (event) => {
            if (cancelled) return;
            if (event.event_type === "cell_cancelled") {
              const payload = event.payload as Record<string, unknown>;
              const row = (payload.row as number) ?? 0;
              const col = (payload.col as number) ?? 0;
              const pCache = profileCache.current[event.player_id];

              const liveMove: LiveMove = {
                id: event.id,
                playerName: pCache?.username ?? "Player",
                playerId: event.player_id,
                avatarUrl: pCache?.avatar_url,
                number: undefined,
                row,
                col,
                marked: (payload.marked as boolean) ?? true,
                moves: (payload.moves as number) ?? 0,
                timestamp: Date.now(),
              };
              setLiveMoves((prev) => [...prev.slice(-49), liveMove]);
            }
          }
        });
      } catch (err) {
        console.error("[RoomContext] load error:", err);
        if (!cancelled) {
          setError(`Failed while ${currentStep}.`);
          setLoading(false);
          clearTimeout(timeoutId);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (unsub) unsub();
    };
  }, [code, profile.id, getCachedProfile]);

  // ── Actions (stable references via useCallback) ──────────────────
  const joinRoom = useCallback(async (userId: string) => {
    if (!room) return { error: "Room not loaded" };
    if (players.length >= room.max_players) return { error: "Room is full" };
    return firestoreJoinRoom(room.id, userId);
  }, [room, players.length]);

  const setReady = useCallback(async (userId: string, ready: boolean) => {
    if (!room?.id) return;
    await updateRoomPlayer(room.id, userId, { is_ready: ready });
  }, [room?.id]);

  const startGame = useCallback(async () => {
    if (!room) return;
    await updateRoom(room.id, {
      status: "matrix",
      started_at: new Date().toISOString(),
    });
  }, [room]);

  const submitBoard = useCallback(async (userId: string, board: number[][]) => {
    if (!room) return;
    try {
      console.log("Writing board to Firestore");
      const allPlayerIds = players.map(p => p.player_id);
      await submitBoardTransaction(room.id, userId, board, allPlayerIds);
      console.log("Firestore write successful");
    } catch (error: any) {
      console.error(error.code);
      console.error(error.message);
      throw error;
    }
  }, [room, players]);

  const isTransitioningRef = useRef(false);

  // ── Auto-start / Auto-finish Game Logic (Host Only) ──
  useEffect(() => {
    if (!room || !joined) return;
    
    const isHost = room.host_id === profile.id;
    if (!isHost) return;

    const allSubmitted = players.length >= room.max_players && players.every(p => p.has_submitted_board);
    if (room.status === "matrix" && allSubmitted && !isTransitioningRef.current) {
      console.log("Both players ready. Host auto-starting game...");
      isTransitioningRef.current = true;
      const allPlayerIds = players.map(p => p.player_id);
      hostAutoStartGame(room.id, allPlayerIds, room.max_players)
        .catch(err => console.error("Auto-start failed:", err))
        .finally(() => { isTransitioningRef.current = false; });
      return;
    }

    if (room.status === "playing" && !isTransitioningRef.current) {
      const winner = players.find(p => p.lines_completed >= 5);
      if (winner) {
        console.log(`Host detected winner: ${winner.player_id}`);
        isTransitioningRef.current = true;
        hostAutoFinishGame(room.id, winner.player_id, players)
          .catch(err => console.error("Auto-finish failed:", err))
          .finally(() => { isTransitioningRef.current = false; });
      }
    }
  }, [room, players, joined, profile.id]);

  const value = useMemo(() => ({
    room, players, messages, liveMoves, loading, error, joined,
    joinRoom, setReady, startGame, submitBoard
  }), [room, players, messages, liveMoves, loading, error, joined, joinRoom, setReady, startGame, submitBoard]);

  return (
    <RoomContext.Provider value={value}>
      {children}
    </RoomContext.Provider>
  );
}

export function useRoomContext() {
  const ctx = useContext(RoomContext);
  if (!ctx) throw new Error("useRoomContext must be used within RoomProvider");
  return ctx;
}
