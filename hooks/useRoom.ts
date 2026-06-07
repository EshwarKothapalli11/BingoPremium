"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { ensureSession } from "@/lib/session";
import { generateRoomCode } from "@/lib/utils";
import type { Profile, Room, RoomPlayer } from "@/types";

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      try {
        const user = await ensureSession();

        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

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
    const supabase = createClient();
    setLoading(true);

    const { data: roomData, error: roomError } = await supabase
      .from("rooms")
      .select("*")
      .eq("code", code.toUpperCase())
      .single();

    if (roomError || !roomData) {
      setError("Room not found");
      setLoading(false);
      return null;
    }

    setRoom(roomData);

    const { data: playersData } = await supabase
      .from("room_players")
      .select("*, profile:profiles(*)")
      .eq("room_id", roomData.id)
      .order("joined_at", { ascending: true });

    setPlayers(
      (playersData || []).map((p) => ({
        ...p,
        profile: Array.isArray(p.profile) ? p.profile[0] : p.profile,
      }))
    );

    setLoading(false);
    return roomData;
  }, [code]);

  useEffect(() => {
    fetchRoom();
  }, [fetchRoom]);

  const joinRoom = useCallback(
    async (userId: string) => {
      if (!room) return { error: "Room not loaded" };

      const supabase = createClient();

      const existing = players.find((p) => p.player_id === userId);
      if (existing) {
        // Already joined — just refresh to be sure
        await fetchRoom();
        return { success: true };
      }

      if (players.length >= room.max_players) {
        return { error: "Room is full" };
      }

      const { error: joinError } = await supabase.from("room_players").upsert(
        {
          room_id: room.id,
          player_id: userId,
        },
        { onConflict: "room_id,player_id", ignoreDuplicates: true }
      );

      if (joinError) return { error: joinError.message };
      await fetchRoom();
      return { success: true };
    },
    [room, players, fetchRoom]
  );

  const setReady = useCallback(
    async (userId: string, ready: boolean) => {
      const supabase = createClient();
      await supabase
        .from("room_players")
        .update({ is_ready: ready })
        .eq("room_id", room?.id)
        .eq("player_id", userId);
    },
    [room?.id]
  );

  const startGame = useCallback(async () => {
    if (!room) return;
    const supabase = createClient();
    await supabase
      .from("rooms")
      .update({ status: "matrix", started_at: new Date().toISOString() })
      .eq("id", room.id);
  }, [room]);

  const createRoom = useCallback(
    async (name: string, hostId: string, maxPlayers: number) => {
      const supabase = createClient();
      let code = generateRoomCode();
      let attempts = 0;

      while (attempts < 5) {
        const { data: existing } = await supabase
          .from("rooms")
          .select("id")
          .eq("code", code)
          .maybeSingle();

        if (!existing) break;
        code = generateRoomCode();
        attempts++;
      }

      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .insert({
          code,
          name,
          host_id: hostId,
          max_players: maxPlayers,
          status: "waiting",
        })
        .select()
        .single();

      if (roomError || !roomData) return { error: roomError?.message };

      await supabase.from("room_players").insert({
        room_id: roomData.id,
        player_id: hostId,
        is_ready: true,
      });

      return { room: roomData };
    },
    []
  );

  return {
    room,
    players,
    loading,
    error,
    fetchRoom,
    joinRoom,
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
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("rooms")
        .select("*, room_players(count)")
        .in("status", ["waiting", "matrix"])
        .order("created_at", { ascending: false })
        .limit(10);

      setRooms(
        (data || []).map((r) => ({
          ...r,
          player_count: r.room_players?.[0]?.count ?? 0,
        }))
      );
    }

    load();

    const channel = supabase
      .channel("active-rooms")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rooms" },
        () => load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return rooms;
}

export function useRecentWinners() {
  const [winners, setWinners] = useState<
    { username: string; moves: number; duration: string; created_at: string }[]
  >([]);

  useEffect(() => {
    const supabase = createClient();

    async function load() {
      const { data } = await supabase
        .from("history")
        .select("moves, duration, created_at, winner:profiles(username)")
        .order("created_at", { ascending: false })
        .limit(5);

      setWinners(
        (data || []).map((h) => ({
          username: (Array.isArray(h.winner) ? h.winner[0] : h.winner)?.username ?? "Unknown",
          moves: h.moves,
          duration: h.duration,
          created_at: h.created_at,
        }))
      );
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
    const supabase = createClient();

    async function load() {
      const { data: playerRooms } = await supabase
        .from("room_players")
        .select("moves, room:rooms(name, winner_id, created_at)")
        .eq("player_id", userId)
        .order("joined_at", { ascending: false })
        .limit(10);

      setHistory(
        (playerRooms || []).map((pr) => {
          const room = Array.isArray(pr.room) ? pr.room[0] : pr.room;
          return {
            room_name: room?.name ?? "Unknown",
            result: room?.winner_id === userId ? "Won" : "Lost",
            moves: pr.moves,
            date: room?.created_at ?? "",
          };
        })
      );
    }

    load();
  }, [userId]);

  return history;
}
