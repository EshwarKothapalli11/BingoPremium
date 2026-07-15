"use client";

import { useCallback, useEffect, useState } from "react";
import { ensureSession } from "@/lib/session";
import { generateRoomCode } from "@/lib/utils";
import {
  fetchProfile,
  getRoomByCode,
  getRoomPlayers,
  joinRoom as firestoreJoinRoom,
  updateRoomPlayer,
  updateRoom,
  createRoom as firestoreCreateRoom,
  getActiveRooms,
  getRecentWinners,
  getPlayerHistory as firestoreGetPlayerHistory,
} from "@/lib/firebase/firestore";
import {
  subscribeToRoom,
  type RealtimeHandlers,
} from "@/lib/firebase/realtime";
import type { Profile, Room, RoomPlayer } from "@/types";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const user = await ensureSession();
        const data = await fetchProfile(user.id);
        setProfile(data);
      } catch {
        setProfile(null);
      }
      setLoading(false);
    }

    load();
  }, []);

  return { profile, loading };
}

export function useRoom(code: string) {
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<RoomPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoom = useCallback(async () => {
    if (!code) {
      setLoading(false);
      return null;
    }
    setLoading(true);

    const roomData = await getRoomByCode(code.toUpperCase());

    if (!roomData) {
      setError("Room not found");
      setLoading(false);
      return null;
    }

    setRoom(roomData);

    const playersData = await getRoomPlayers(roomData.id);
    setPlayers(playersData);

    setLoading(false);
    return roomData;
  }, [code]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  const joinRoomAction = useCallback(
    async (userId: string) => {
      if (!room) return { error: "Room not loaded" };

      const existing = players.find((p) => p.player_id === userId);
      if (existing) {
        await fetchRoom();
        return { success: true };
      }

      if (players.length >= room.max_players) {
        return { error: "Room is full" };
      }

      const result = await firestoreJoinRoom(room.id, userId);
      if (result.error) return { error: result.error };

      await fetchRoom();
      return { success: true };
    },
    [room, players, fetchRoom]
  );

  const setReady = useCallback(
    async (userId: string, ready: boolean) => {
      if (!room?.id) return;
      await updateRoomPlayer(room.id, userId, { is_ready: ready });
    },
    [room?.id]
  );

  const startGame = useCallback(async () => {
    if (!room) return;
    await updateRoom(room.id, {
      status: "matrix",
      started_at: new Date().toISOString(),
    });
  }, [room]);

  const createRoom = useCallback(
    async (name: string, hostId: string, maxPlayers: number) => {
      return await firestoreCreateRoom(name, hostId, maxPlayers);
    },
    []
  );

  return {
    room,
    players,
    loading,
    error,
    fetchRoom,
    joinRoom: joinRoomAction,
    setReady,
    startGame,
    createRoom,
    setRoom,
    setPlayers,
  };
}

export function useActiveRooms() {
  const [rooms, setRooms] = useState<(Room & { player_count: number })[]>([]);

  useEffect(() => {
    async function load() {
      const data = await getActiveRooms();
      setRooms(data);
    }

    load();

    // Set up realtime listener for room changes
    const unsub = subscribeToRoom("__active_rooms__", {});

    // Poll for updates since we can't easily listen to a top-level collection
    // with our room-based subscription model. Use a simple interval.
    const interval = setInterval(() => load(), 5000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  return rooms;
}

export function useRecentWinners() {
  const [winners, setWinners] = useState<
    { username: string; moves: number; duration: string; created_at: string }[]
  >([]);

  useEffect(() => {
    async function load() {
      const data = await getRecentWinners();
      setWinners(data);
    }

    load();
  }, []);

  return winners;
}

export function usePlayerHistory(userId: string | undefined) {
  const [history, setHistory] = useState<
    { room_name: string; result: string; moves: number; date: string }[]
  >([]);

  useEffect(() => {
    if (!userId) return;

    async function load() {
      const data = await firestoreGetPlayerHistory(userId!);
      setHistory(data);
    }

    load();
  }, [userId]);

  return history;
}
