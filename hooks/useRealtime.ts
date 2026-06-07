"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase";
import type { RealtimeHandlers } from "@/lib/realtime";
import { subscribeToRoom, unsubscribeChannel } from "@/lib/realtime";

export function useRealtime(
  roomId: string | null,
  handlers: RealtimeHandlers,
  channelKey = "room"
) {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!roomId) return;

    const supabase = createClient();
    const channel = subscribeToRoom(
      supabase,
      roomId,
      {
        onRoomChange: (room) => handlersRef.current.onRoomChange?.(room),
        onPlayerChange: (player, event) =>
          handlersRef.current.onPlayerChange?.(player, event),
        onGameEvent: (event) => handlersRef.current.onGameEvent?.(event),
        onMessage: (message) => handlersRef.current.onMessage?.(message),
        onSubscribed: () => setConnected(true),
      },
      channelKey
    );

    return () => {
      unsubscribeChannel(supabase, channel);
      setConnected(false);
    };
  }, [roomId, channelKey]);

  return { connected };
}
