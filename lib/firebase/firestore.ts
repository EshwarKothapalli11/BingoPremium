import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  deleteDoc,
  runTransaction,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { toProfile, toRoom, toRoomPlayer, toGameEvent, toMessage, toHistoryEntry } from "./helpers";
import { generateRoomCode } from "@/lib/utils";
import type { Profile, Room, RoomPlayer, GameEvent, Message, HistoryEntry } from "@/types";

// ─── Collection References ───────────────────────────────────────────

export const profilesCol = () => collection(db, "profiles");
export const roomsCol = () => collection(db, "rooms");
export const roomPlayersCol = (roomId: string) =>
  collection(db, "rooms", roomId, "players");
export const gameEventsCol = (roomId: string) =>
  collection(db, "rooms", roomId, "game_events");
export const messagesCol = (roomId: string) =>
  collection(db, "rooms", roomId, "messages");
export const historyCol = () => collection(db, "history");

// ─── Profiles ────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const snap = await getDoc(doc(db, "profiles", userId));
  if (!snap.exists()) return null;
  return toProfile(snap.id, snap.data());
}

export async function updateProfile(
  userId: string,
  data: Partial<Omit<Profile, "id">>
): Promise<void> {
  await updateDoc(doc(db, "profiles", userId), data as DocumentData);
}

// ─── Rooms ───────────────────────────────────────────────────────────

export async function getRoomByCode(code: string): Promise<Room | null> {
  const q = query(roomsCol(), where("code", "==", code.toUpperCase()));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const roomDoc = snap.docs[0];
  return toRoom(roomDoc.id, roomDoc.data());
}

export async function fetchRoom(roomId: string): Promise<Room | null> {
  const snap = await getDoc(doc(db, "rooms", roomId));
  if (!snap.exists()) return null;
  return toRoom(snap.id, snap.data());
}

export async function updateRoom(
  roomId: string,
  data: Partial<Omit<Room, "id">>
): Promise<void> {
  await updateDoc(doc(db, "rooms", roomId), data as DocumentData);
}

export async function createRoom(
  name: string,
  hostId: string,
  maxPlayers: number
): Promise<{ room?: Room; error?: string }> {
  let code = generateRoomCode();
  let attempts = 0;

  // Ensure unique code
  while (attempts < 5) {
    const existing = await getRoomByCode(code);
    if (!existing) break;
    code = generateRoomCode();
    attempts++;
  }

  const roomData = {
    code,
    name,
    host_id: hostId,
    status: "waiting" as const,
    max_players: maxPlayers,
    winner_id: null,
    started_at: null,
    created_at: new Date().toISOString(),
  };

  const roomRef = await addDoc(roomsCol(), roomData);
  const room: Room = { id: roomRef.id, ...roomData };

  // Add host as first player
  await setDoc(doc(db, "rooms", roomRef.id, "players", hostId), {
    room_id: roomRef.id,
    player_id: hostId,
    is_ready: true,
    board: null,
    marked: null,
    completed_lines: [],
    bingo_letters: 0,
    lines_completed: 0,
    moves: 0,
    has_submitted_board: false,
    joined_at: new Date().toISOString(),
  });

  return { room };
}

// ─── Room Players ────────────────────────────────────────────────────

export async function getRoomPlayers(roomId: string): Promise<RoomPlayer[]> {
  const q = query(roomPlayersCol(roomId), orderBy("joined_at", "asc"));
  const snap = await getDocs(q);

  const players: RoomPlayer[] = [];
  for (const playerDoc of snap.docs) {
    const rp = toRoomPlayer(playerDoc.id, playerDoc.data());

    // Attach profile
    const profileSnap = await getDoc(doc(db, "profiles", rp.player_id));
    if (profileSnap.exists()) {
      rp.profile = toProfile(profileSnap.id, profileSnap.data());
    }

    players.push(rp);
  }

  return players;
}

export async function getRoomPlayerDoc(
  roomId: string,
  playerId: string
): Promise<RoomPlayer | null> {
  const snap = await getDoc(doc(db, "rooms", roomId, "players", playerId));
  if (!snap.exists()) return null;
  return toRoomPlayer(snap.id, snap.data());
}

export async function joinRoom(
  roomId: string,
  playerId: string
): Promise<{ success?: boolean; error?: string }> {
  const playerRef = doc(db, "rooms", roomId, "players", playerId);
  const existing = await getDoc(playerRef);

  if (existing.exists()) {
    return { success: true };
  }

  await setDoc(playerRef, {
    room_id: roomId,
    player_id: playerId,
    is_ready: false,
    board: null,
    marked: null,
    completed_lines: [],
    bingo_letters: 0,
    lines_completed: 0,
    moves: 0,
    has_submitted_board: false,
    joined_at: new Date().toISOString(),
  });

  return { success: true };
}

export async function updateRoomPlayer(
  roomId: string,
  playerId: string,
  data: Partial<Omit<RoomPlayer, "id">>
): Promise<void> {
  const updateData: Record<string, any> = { ...data };

  // Firestore does not support nested arrays. Flatten 2D arrays to 1D.
  if (updateData.board && Array.isArray(updateData.board) && Array.isArray(updateData.board[0])) {
    updateData.board = updateData.board.flat();
  }
  if (updateData.marked && Array.isArray(updateData.marked) && Array.isArray(updateData.marked[0])) {
    updateData.marked = updateData.marked.flat();
  }

  await updateDoc(
    doc(db, "rooms", roomId, "players", playerId),
    updateData as DocumentData
  );
}

export async function removeRoomPlayer(
  roomId: string,
  playerId: string
): Promise<void> {
  await deleteDoc(doc(db, "rooms", roomId, "players", playerId));
}

export async function getRoomPlayerCount(roomId: string): Promise<number> {
  const snap = await getDocs(roomPlayersCol(roomId));
  return snap.size;
}

export async function submitBoardTransaction(
  roomId: string,
  playerId: string,
  board: number[][],
  allPlayerIds: string[]
): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  const playerRefs = allPlayerIds.map((id) =>
    doc(db, "rooms", roomId, "players", id)
  );
  const currentPlayerRef = doc(db, "rooms", roomId, "players", playerId);

  await runTransaction(db, async (transaction) => {
    // 1. Reads
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;

    const playerSnaps = await Promise.all(
      playerRefs.map((ref) => transaction.get(ref))
    );

    let submittedCount = 0;
    for (const snap of playerSnaps) {
      if (snap.id === playerId) {
        submittedCount++; // Current player is submitting right now
      } else if (snap.exists() && snap.data().has_submitted_board) {
        submittedCount++;
      }
    }

    const totalPlayers = allPlayerIds.length;
    console.log(
      `[Submit] playerId=${playerId}, submittedPlayers=${submittedCount}, totalPlayers=${totalPlayers}, room.status (before)=${
        roomSnap.data()?.status
      }`
    );

    // 2. Writes
    transaction.update(currentPlayerRef, {
      board: board.flat(),
      marked: Array(25).fill(false),
      has_submitted_board: true,
    });

    if (submittedCount >= totalPlayers) {
      console.log(
        `[Submit] All players submitted! Changing room.status to 'playing'`
      );
      transaction.update(roomRef, { status: "playing" });
      console.log(`[Submit] room.status updated to 'playing'`);
    } else {
      console.log(
        `[Submit] Waiting for ${totalPlayers - submittedCount} more players.`
      );
    }
  });
}

// ─── Game Events ─────────────────────────────────────────────────────

export async function insertGameEvent(
  roomId: string,
  event: Omit<GameEvent, "id" | "created_at">
): Promise<string> {
  const ref = await addDoc(gameEventsCol(roomId), {
    ...event,
    created_at: new Date().toISOString(),
  });
  return ref.id;
}

export async function getGameEvents(
  roomId: string,
  eventType?: string,
  maxResults = 50
): Promise<GameEvent[]> {
  let q;
  if (eventType) {
    q = query(
      gameEventsCol(roomId),
      where("event_type", "==", eventType),
      orderBy("created_at", "asc"),
      limit(maxResults)
    );
  } else {
    q = query(
      gameEventsCol(roomId),
      orderBy("created_at", "asc"),
      limit(maxResults)
    );
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => toGameEvent(d.id, d.data()));
}

// ─── Messages ────────────────────────────────────────────────────────

export async function insertMessage(
  roomId: string,
  msg: Omit<Message, "id" | "created_at">
): Promise<string> {
  const ref = await addDoc(messagesCol(roomId), {
    ...msg,
    created_at: new Date().toISOString(),
  });
  return ref.id;
}

export async function getMessages(roomId: string): Promise<Message[]> {
  const q = query(
    messagesCol(roomId),
    orderBy("created_at", "asc")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toMessage(d.id, d.data()));
}

// ─── History ─────────────────────────────────────────────────────────

export async function insertHistory(
  data: Omit<HistoryEntry, "id" | "created_at">
): Promise<void> {
  await addDoc(historyCol(), {
    ...data,
    created_at: new Date().toISOString(),
  });
}

export async function getRecentWinners(
  maxResults = 5
): Promise<{ username: string; moves: number; duration: string; created_at: string }[]> {
  const q = query(
    historyCol(),
    orderBy("created_at", "desc"),
    limit(maxResults)
  );
  const snap = await getDocs(q);

  const results: { username: string; moves: number; duration: string; created_at: string }[] = [];
  for (const histDoc of snap.docs) {
    const entry = toHistoryEntry(histDoc.id, histDoc.data());
    // Fetch winner profile
    let username = "Unknown";
    if (entry.winner_id) {
      const profileSnap = await getDoc(doc(db, "profiles", entry.winner_id));
      if (profileSnap.exists()) {
        username = profileSnap.data().username ?? "Unknown";
      }
    }
    results.push({
      username,
      moves: entry.moves,
      duration: entry.duration,
      created_at: entry.created_at,
    });
  }

  return results;
}

export async function getActiveRooms(
  maxResults = 10
): Promise<(Room & { player_count: number })[]> {
  const q = query(
    roomsCol(),
    where("status", "in", ["waiting", "matrix"]),
    orderBy("created_at", "desc"),
    limit(maxResults)
  );
  const snap = await getDocs(q);

  const rooms: (Room & { player_count: number })[] = [];
  for (const roomDoc of snap.docs) {
    const room = toRoom(roomDoc.id, roomDoc.data());
    const playerCount = await getRoomPlayerCount(room.id);
    rooms.push({ ...room, player_count: playerCount });
  }

  return rooms;
}

export async function getPlayerHistory(
  userId: string,
  maxResults = 10
): Promise<{ room_name: string; result: string; moves: number; date: string }[]> {
  // We need to search across all rooms' players subcollections.
  // Since Firestore doesn't support collectionGroup queries without an index easily,
  // we'll query the history collection for games involving this player,
  // and also check rooms where this player participated.
  // For simplicity, we query rooms and check player membership.

  // Alternative approach: query all rooms, filter by player membership
  // Since the old code queries room_players directly, we'll iterate active rooms.
  // This is acceptable for small scale.

  const allRooms = query(roomsCol(), orderBy("created_at", "desc"), limit(50));
  const roomSnap = await getDocs(allRooms);

  const results: { room_name: string; result: string; moves: number; date: string }[] = [];

  for (const roomDoc of roomSnap.docs) {
    const room = toRoom(roomDoc.id, roomDoc.data());
    const playerSnap = await getDoc(
      doc(db, "rooms", roomDoc.id, "players", userId)
    );

    if (playerSnap.exists()) {
      const player = toRoomPlayer(playerSnap.id, playerSnap.data());
      results.push({
        room_name: room.name,
        result: room.winner_id === userId ? "Won" : "Lost",
        moves: player.moves,
        date: room.created_at,
      });
    }

    if (results.length >= maxResults) break;
  }

  return results;
}
