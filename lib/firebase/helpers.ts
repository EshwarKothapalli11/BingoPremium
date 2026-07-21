import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";
import type { Profile, Room, RoomPlayer, GameEvent, Message, HistoryEntry } from "@/types";

/**
 * Convert a Firestore document snapshot to a typed object with `id` field.
 */
export function docToData<T>(snap: QueryDocumentSnapshot<DocumentData>): T {
  return { id: snap.id, ...snap.data() } as T;
}

/**
 * Convert Firestore doc data to Profile type.
 */
export function toProfile(id: string, data: DocumentData): Profile {
  return {
    id,
    username: data.username ?? "",
    avatar_url: data.avatar_url ?? null,
    games_played: data.games_played ?? 0,
    games_won: data.games_won ?? 0,
    total_moves: data.total_moves ?? 0,
    created_at: data.created_at ?? new Date().toISOString(),
  };
}

/**
 * Convert Firestore doc data to Room type.
 */
export function toRoom(id: string, data: DocumentData): Room {
  return {
    id,
    code: data.code ?? "",
    name: data.name ?? "",
    host_id: data.host_id ?? "",
    status: data.status ?? "waiting",
    max_players: data.max_players ?? 4,
    winner_id: data.winner_id ?? null,
    current_turn_id: data.current_turn_id ?? null,
    started_at: data.started_at ?? null,
    created_at: data.created_at ?? new Date().toISOString(),
  };
}

/**
 * Helper to unflatten 1D arrays from Firestore back to 2D arrays.
 * Preserves 2D arrays if already 2D (e.g. from local optimistic updates).
 */
function unflatten(arr: any[] | null): any[][] | null {
  if (!arr) return null;
  // If already 2D (or at least first element is an array), return as is
  if (arr.length > 0 && Array.isArray(arr[0])) return arr as any[][];
  
  const result: any[][] = [];
  for (let i = 0; i < arr.length; i += 5) {
    result.push(arr.slice(i, i + 5));
  }
  return result;
}

/**
 * Convert Firestore doc data to RoomPlayer type.
 */
export function toRoomPlayer(id: string, data: DocumentData): RoomPlayer {
  return {
    id,
    room_id: data.room_id ?? "",
    player_id: data.player_id ?? "",
    is_ready: data.is_ready ?? false,
    board: unflatten(data.board),
    marked: unflatten(data.marked),
    completed_lines: data.completed_lines ?? [],
    bingo_letters: data.bingo_letters ?? 0,
    lines_completed: data.lines_completed ?? 0,
    moves: data.moves ?? 0,
    has_submitted_board: data.has_submitted_board ?? false,
    joined_at: data.joined_at ?? new Date().toISOString(),
  };
}

/**
 * Convert Firestore doc data to GameEvent type.
 */
export function toGameEvent(id: string, data: DocumentData): GameEvent {
  return {
    id,
    room_id: data.room_id ?? "",
    player_id: data.player_id ?? "",
    event_type: data.event_type ?? "cell_cancelled",
    payload: data.payload ?? {},
    created_at: data.created_at ?? new Date().toISOString(),
  };
}

/**
 * Convert Firestore doc data to Message type.
 */
export function toMessage(id: string, data: DocumentData): Message {
  return {
    id,
    room_id: data.room_id ?? "",
    player_id: data.player_id ?? "",
    content: data.content ?? "",
    created_at: data.created_at ?? new Date().toISOString(),
  };
}

/**
 * Convert Firestore doc data to HistoryEntry type.
 */
export function toHistoryEntry(id: string, data: DocumentData): HistoryEntry {
  return {
    id,
    room_id: data.room_id ?? "",
    winner_id: data.winner_id ?? "",
    moves: data.moves ?? 0,
    duration: data.duration ?? "0:00",
    players_count: data.players_count ?? 2,
    created_at: data.created_at ?? new Date().toISOString(),
  };
}
