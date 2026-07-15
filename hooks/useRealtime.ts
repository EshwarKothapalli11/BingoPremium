"use client";

import { useEffect, useRef, useState } from "react";
import { subscribeToRoom, type RealtimeHandlers } from "@/lib/firebase/realtime";

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

    const unsubscribe = subscribeToRoom(roomId, {
      onRoomChange: (room) => handlersRef.current.onRoomChange?.(room),
      onPlayerChange: (player, event) =>
        handlersRef.current.onPlayerChange?.(player, event),
      onGameEvent: (event) => handlersRef.current.onGameEvent?.(event),
      onMessage: (message) => handlersRef.current.onMessage?.(message),
      onSubscribed: () => setConnected(true),
    });

    return () => {
      unsubscribe();
      setConnected(false);
    };
  }, [roomId, channelKey]);

  return { connected };
}
