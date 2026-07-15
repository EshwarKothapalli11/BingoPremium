// Re-export Firebase auth functions with the same interface
// that the rest of the app expects.
export { ensureSession, getGuestId, getProfile, type GuestSession } from "./firebase/auth";
