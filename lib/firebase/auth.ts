import { signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface GuestSession {
  id: string;
}

/**
 * Wait for Firebase Auth to resolve its persistence state.
 * Returns the current user if already signed in, or null.
 */
function waitForAuth(): Promise<User | null> {
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

/**
 * Returns the current Firebase Auth user's UID, or empty string on server.
 */
export function getGuestId(): string {
  if (typeof window === "undefined") return "";
  return auth.currentUser?.uid ?? "";
}

/**
 * Ensures a session exists by signing in anonymously if needed.
 * Creates/updates the Firestore profile document with the player name.
 */
export async function ensureSession(playerName?: string): Promise<GuestSession> {
  if (typeof window === "undefined") {
    throw new Error("Cannot create session on server");
  }

  // Wait for any persisted auth state to load
  let user = await waitForAuth();

  // If no persisted session, sign in anonymously
  if (!user) {
    const credential = await signInAnonymously(auth);
    user = credential.user;
  }

  if (!user) {
    throw new Error("Could not create guest session");
  }

  if (playerName) {
    await ensureProfile(user.uid, playerName);
  }
  
  return { id: user.uid };
}

/**
 * Check if a profile exists; create it if missing, update name if changed.
 */
async function ensureProfile(userId: string, playerName: string): Promise<void> {
  const profileRef = doc(db, "profiles", userId);
  const snap = await getDoc(profileRef);

  if (!snap.exists()) {
    await setDoc(profileRef, {
      id: userId,
      username: playerName,
      avatar_url: null,
      games_played: 0,
      games_won: 0,
      total_moves: 0,
      created_at: new Date().toISOString(),
    });
    return;
  }

  const data = snap.data();
  if (data.username !== playerName) {
    await updateDoc(profileRef, { username: playerName });
  }
}

/**
 * Fetch a user's profile from Firestore.
 */
export async function getProfile(userId: string) {
  const profileRef = doc(db, "profiles", userId);
  const snap = await getDoc(profileRef);

  if (!snap.exists()) {
    throw new Error("Profile not found");
  }

  return { id: snap.id, ...snap.data() } as {
    id: string;
    username: string;
    avatar_url: string | null;
    games_played: number;
    games_won: number;
    total_moves: number;
    created_at: string;
  };
}
