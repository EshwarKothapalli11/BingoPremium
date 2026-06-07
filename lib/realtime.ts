import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import type { GameEvent, Message, Room, RoomPlayer } from "@/types";

export type RealtimeHandlers = {
  onRoomChange?: (room: Room) => void;
  onPlayerChange?: (player: RoomPlayer, event: "INSERT" | "UPDATE" | "DELETE") => void;
  onGameEvent?: (event: GameEvent) => void;
  onMessage?: (message: Message) => void;
  onSubscribed?: () => void;
};

export function subscribeToRoom(
  supabase: SupabaseClient,
  roomId: string,
  handlers: RealtimeHandlers,
  channelKey = "room"
): RealtimeChannel {
  const channel = supabase.channel(`${channelKey}:${roomId}`);

  if (handlers.onRoomChange) {
    channel.on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${roomId}`,
      },
      (payload) => handlers.onRoomChange!(payload.new as Room)
    );
  }

  if (handlers.onPlayerChange) {
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "room_players",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        const event = payload.eventType as "INSERT" | "UPDATE" | "DELETE";
        if (event === "DELETE") {
          handlers.onPlayerChange!(payload.old as RoomPlayer, event);
        } else {
          handlers.onPlayerChange!(payload.new as RoomPlayer, event);
        }
      }
    );
  }

  if (handlers.onGameEvent) {
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "game_events",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => handlers.onGameEvent!(payload.new as GameEvent)
    );
  }

  if (handlers.onMessage) {
    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => handlers.onMessage!(payload.new as Message)
    );
  }

  channel.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      handlers.onSubscribed?.();
    }
  });

  return channel;
}

export function unsubscribeChannel(
  supabase: SupabaseClient,
  channel: RealtimeChannel
) {
  supabase.removeChannel(channel);
}
