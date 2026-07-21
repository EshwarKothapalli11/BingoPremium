import {
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
  type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";
import { toRoom, toRoomPlayer, toGameEvent, toMessage } from "./helpers";
import type { GameEvent, Message, Room, RoomPlayer } from "@/types";

export type RealtimeHandlers = {
  onRoomChange?: (room: Room) => void;
  onPlayerChange?: (player: RoomPlayer, event: "INSERT" | "UPDATE" | "DELETE") => void;
  onGameEvent?: (event: GameEvent) => void;
  onMessage?: (message: Message) => void;
  onSubscribed?: () => void;
};

/**
 * Subscribe to real-time updates for a room and its subcollections.
 * Returns an unsubscribe function that cleans up all listeners.
 */
export function subscribeToRoom(
  roomId: string,
  handlers: RealtimeHandlers
): Unsubscribe {
  const unsubscribers: Unsubscribe[] = [];
  let isFirstRoomSnapshot = true;

  // 1. Room document changes
  if (handlers.onRoomChange) {
    const roomRef = doc(db, "rooms", roomId);
    const unsub = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        // Skip the initial snapshot (we already have the data)
        if (isFirstRoomSnapshot) {
          isFirstRoomSnapshot = false;
          // Notify that subscription is ready
          handlers.onSubscribed?.();
          return;
        }
        handlers.onRoomChange!(toRoom(snap.id, snap.data()));
      }
    });
    unsubscribers.push(unsub);
  } else {
    // Still notify subscribed even without room handler
    handlers.onSubscribed?.();
  }

  // 2. Players subcollection changes
  if (handlers.onPlayerChange) {
    const playersRef = collection(db, "rooms", roomId, "players");
    const q = query(playersRef);
    const unsub = onSnapshot(q, (snap) => {
      console.log("Players snapshot updated");
      for (const change of snap.docChanges()) {
        const player = toRoomPlayer(change.doc.id, change.doc.data());
        switch (change.type) {
          case "added":
            handlers.onPlayerChange!(player, "INSERT");
            break;
          case "modified":
            handlers.onPlayerChange!(player, "UPDATE");
            break;
          case "removed":
            handlers.onPlayerChange!(player, "DELETE");
            break;
        }
      }
    });
    unsubscribers.push(unsub);
  }

  // 3. Game events subcollection (new inserts only)
  if (handlers.onGameEvent) {
    const eventsRef = collection(db, "rooms", roomId, "game_events");
    const q = query(eventsRef);
    const unsub = onSnapshot(q, (snap) => {
      for (const change of snap.docChanges()) {
        if (change.type === "added") {
          handlers.onGameEvent!(toGameEvent(change.doc.id, change.doc.data()));
        }
      }
    });
    unsubscribers.push(unsub);
  }

  // 4. Messages subcollection (new inserts only)
  if (handlers.onMessage) {
    const messagesRef = collection(db, "rooms", roomId, "messages");
    const q = query(messagesRef);
    const unsub = onSnapshot(q, (snap) => {
      for (const change of snap.docChanges()) {
        if (change.type === "added") {
          handlers.onMessage!(toMessage(change.doc.id, change.doc.data()));
        }
      }
    });
    unsubscribers.push(unsub);
  }

  // Return a combined unsubscribe function
  return () => {
    for (const unsub of unsubscribers) {
      unsub();
    }
  };
}
