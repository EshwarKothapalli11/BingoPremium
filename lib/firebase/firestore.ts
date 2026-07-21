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
  serverTimestamp,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { toProfile, toRoom, toRoomPlayer, toGameEvent, toMessage, toHistoryEntry } from "./helpers";
import { generateRoomCode } from "@/lib/utils";
import { detectBingoState } from "@/lib/bingo-logic";
import type { Profile, Room, RoomPlayer, GameEvent, Message, GameHistory, HistoryEntry } from "@/types";

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
    current_turn_id: null,
    started_at: null,
    created_at: new Date().toISOString(),
  };

  const roomRef = await addDoc(roomsCol(), roomData);
  const room: Room = { id: roomRef.id, ...roomData };
  console.log("Room created");
  console.log("Room written");

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
  console.log("Player added");

  return { room };
}

// ─── Room Players ────────────────────────────────────────────────────

export async function getRoomPlayers(roomId: string): Promise<RoomPlayer[]> {
  const q = query(roomPlayersCol(roomId));
  const snap = await getDocs(q);

  const players = snap.docs.map((playerDoc) =>
    toRoomPlayer(playerDoc.id, playerDoc.data())
  );
  players.sort((a, b) => a.joined_at.localeCompare(b.joined_at));

  // Fetch all profiles in parallel instead of sequentially
  const profilePromises = players.map(async (rp) => {
    const profileSnap = await getDoc(doc(db, "profiles", rp.player_id));
    if (profileSnap.exists()) {
      rp.profile = toProfile(profileSnap.id, profileSnap.data());
    }
    return rp;
  });

  return Promise.all(profilePromises);
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
  console.log("Player added");

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
  const currentPlayerRef = doc(db, "rooms", roomId, "players", playerId);

  await updateDoc(currentPlayerRef, {
    board: board.flat(),
    marked: Array(25).fill(false),
    has_submitted_board: true,
  });
}

export async function hostAutoStartGame(
  roomId: string,
  allPlayerIds: string[],
  maxPlayers: number
): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  const playerRefs = allPlayerIds.map((id) =>
    doc(db, "rooms", roomId, "players", id)
  );

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;
    
    // Idempotency check
    if (roomSnap.data().status !== "matrix") return;

    const playerSnaps = await Promise.all(
      playerRefs.map((ref) => transaction.get(ref))
    );

    const allSubmitted = playerSnaps.every((snap) => snap.exists() && snap.data().has_submitted_board);
    if (allSubmitted && playerSnaps.length >= maxPlayers) {
      const randomFirstPlayerId = allPlayerIds[Math.floor(Math.random() * allPlayerIds.length)];
      transaction.update(roomRef, {
        status: "playing",
        current_turn_id: randomFirstPlayerId,
      });
      console.log(`[Transaction] Host auto-started game. Turn: ${randomFirstPlayerId}`);
    }
  });
}

export async function hostAutoFinishGame(
  roomId: string,
  winnerId: string,
  clientPlayers: RoomPlayer[]
): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);
  const historyRef = doc(collection(db, "game_history"));

  await runTransaction(db, async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) return;
    
    // Idempotency check
    const roomData = roomSnap.data();
    if (roomData.status !== "playing") return;

    const loserId = clientPlayers.find(p => p.player_id !== winnerId)?.player_id;
    if (!loserId) return; // Need exactly 2 players

    const winnerRef = doc(db, "rooms", roomId, "players", winnerId);
    const loserRef = doc(db, "rooms", roomId, "players", loserId);

    const winnerSnap = await transaction.get(winnerRef);
    const loserSnap = await transaction.get(loserRef);

    if (!winnerSnap.exists() || !loserSnap.exists()) return;

    const winnerData = winnerSnap.data();
    const loserData = loserSnap.data();

    if ((winnerData.lines_completed ?? 0) >= 5) {
      // 1. Update Room
      transaction.update(roomRef, {
        status: "finished",
        winner_id: winnerId,
      });

      // 2. Insert Game History
      const winnerClient = clientPlayers.find(p => p.player_id === winnerId);
      const loserClient = clientPlayers.find(p => p.player_id === loserId);

      const historyData: GameHistory = {
        roomId: roomId,
        roomCode: roomData.code,
        winner: {
          uid: winnerId,
          name: winnerClient?.profile?.username || "Unknown",
          isHost: roomData.host_id === winnerId,
          completedLines: winnerData.lines_completed ?? 0,
          bingoLetters: winnerData.bingo_letters ?? 0,
          moves: winnerData.moves ?? 0,
          board: winnerData.board || [],
          marked: winnerData.marked || [],
        },
        loser: {
          uid: loserId,
          name: loserClient?.profile?.username || "Unknown",
          isHost: roomData.host_id === loserId,
          completedLines: loserData.lines_completed ?? 0,
          bingoLetters: loserData.bingo_letters ?? 0,
          moves: loserData.moves ?? 0,
          board: loserData.board || [],
          marked: loserData.marked || [],
        },
        players: [
          {
            uid: winnerId,
            name: winnerClient?.profile?.username || "Unknown",
            isHost: roomData.host_id === winnerId,
            joinedAt: winnerData.joined_at,
          },
          {
            uid: loserId,
            name: loserClient?.profile?.username || "Unknown",
            isHost: roomData.host_id === loserId,
            joinedAt: loserData.joined_at,
          }
        ],
        gameStats: {
          totalMoves: (winnerData.moves ?? 0) + (loserData.moves ?? 0),
          durationSeconds: Math.floor((Date.now() - new Date(roomData.started_at).getTime()) / 1000),
          startedAt: roomData.started_at,
          endedAt: serverTimestamp(),
        },
        createdAt: serverTimestamp(),
      };

      transaction.set(historyRef, historyData);
      console.log(`[Transaction] Host declared winner: ${winnerId} and saved history.`);
    }
  });
}

// ─── Game Events ─────────────────────────────────────────────────────

export async function submitMoveTransaction(
  roomId: string,
  playerId: string,
  allPlayerIds: string[],
  selectedNumber: number
): Promise<void> {
  const roomRef = doc(db, "rooms", roomId);

  // Determine turn order
  const sortedPlayers = [...allPlayerIds].sort();
  const currentIndex = sortedPlayers.indexOf(playerId);
  const nextPlayerId = sortedPlayers[(currentIndex + 1) % sortedPlayers.length];

  console.log(`[LIFECYCLE] 4. Transaction started for player ${playerId}`);

  await runTransaction(db, async (transaction) => {
    // ── Step 1: Read room, verify turn ──────────────────────────
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists()) throw new Error("Room not found");

    const roomData = roomSnap.data();
    if (roomData.status !== "playing") throw new Error("Game is not active");
    if (roomData.current_turn_id !== playerId) throw new Error("Not your turn!");

    // ── Step 2: Read all player documents ───────────────────────
    const playerRefs = allPlayerIds.map(id => doc(db, "rooms", roomId, "players", id));
    const playerSnaps = await Promise.all(playerRefs.map(ref => transaction.get(ref)));

    // ── Step 3: Process each player's board ─────────────────────
    let anyoneHasBingo = false;

    for (let i = 0; i < playerSnaps.length; i++) {
      const pSnap = playerSnaps[i];
      if (!pSnap.exists()) continue;
      const pData = pSnap.data();

      const board1D: number[] = pData.board || [];
      const marked1D: boolean[] = [...(pData.marked || [])];
      const moves: number = pData.moves || 0;
      const existingCompletedLines: string[] = pData.completed_lines || [];

      // Find the selected number on this player's board
      const numIndex = board1D.indexOf(selectedNumber);
      if (numIndex === -1) continue;       // Number not on their board
      if (marked1D[numIndex]) continue;     // Already marked

      // Mark the cell
      marked1D[numIndex] = true;
      const newMoves = moves + 1;

      // Convert 1D → 2D for bingo detection
      const marked2D = Array.from({ length: 5 }, (_, row) =>
        marked1D.slice(row * 5, row * 5 + 5)
      );
      const bingoState = detectBingoState(marked2D, existingCompletedLines);

      // Write updated player document
      console.log(`[LIFECYCLE] 5a. Executing write: Update player doc (${pData.player_id})`);
      transaction.update(playerRefs[i], {
        marked: marked1D,
        moves: newMoves,
        completed_lines: bingoState.completedLines,
        bingo_letters: bingoState.bingoLetters,
        lines_completed: bingoState.linesCompleted,
      });

      // Emit bingo_letter event if a new letter was earned
      if (bingoState.bingoLetters > existingCompletedLines.length) {
        console.log(`[LIFECYCLE] 5b. Executing write: Create bingo_letter event for ${pData.player_id}`);
        const letterRef = doc(gameEventsCol(roomId));
        transaction.set(letterRef, {
          room_id: roomId,
          player_id: pData.player_id,
          event_type: "bingo_letter",
          payload: { letters: bingoState.bingoLetters },
          created_at: new Date().toISOString(),
        });
      }

      // Track if anyone has reached BINGO
      if (bingoState.hasBingo) {
        anyoneHasBingo = true;
      }
    }

    // ── Step 4: Insert cell_cancelled game event ────────────────
    console.log(`[LIFECYCLE] 5c. Executing write: Create cell_cancelled event`);
    const eventRef = doc(gameEventsCol(roomId));
    transaction.set(eventRef, {
      room_id: roomId,
      player_id: playerId,
      event_type: "cell_cancelled",
      payload: { selectedNumber },
      created_at: new Date().toISOString(),
    });

    // ── Step 5: Switch turn (unless someone won) ────────────────
    if (!anyoneHasBingo) {
      console.log(`[LIFECYCLE] 5d. Executing write: Update room current_turn_id to ${nextPlayerId}`);
      transaction.update(roomRef, {
        current_turn_id: nextPlayerId,
      });
    }
  });

  console.log(`[LIFECYCLE] 6. Transaction committed successfully`);
}

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
      limit(maxResults)
    );
  } else {
    q = query(
      gameEventsCol(roomId),
      limit(maxResults)
    );
  }

  const snap = await getDocs(q);
  const events = snap.docs.map((d) => toGameEvent(d.id, d.data()));
  events.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return events;
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
    messagesCol(roomId)
  );
  const snap = await getDocs(q);
  const messages = snap.docs.map((d) => toMessage(d.id, d.data()));
  messages.sort((a, b) => a.created_at.localeCompare(b.created_at));
  return messages;
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
