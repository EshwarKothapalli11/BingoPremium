import { createClient } from "@/lib/supabase";

const GUEST_KEY = "bingo_guest_id";

export interface GuestSession {
  id: string;
}

function guestUsername(userId: string): string {
  return `Guest-${userId.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

export function getGuestId(): string {
  if (typeof window === "undefined") return "";

  let id = localStorage.getItem(GUEST_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(GUEST_KEY, id);
  }
  return id;
}

export async function ensureSession(): Promise<GuestSession> {
  const guestId = getGuestId();
  if (!guestId) {
    throw new Error("Could not create guest session");
  }

  await ensureProfile(guestId);
  return { id: guestId };
}

async function ensureProfile(userId: string): Promise<void> {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    const { error } = await supabase.from("profiles").insert({
      id: userId,
      username: guestUsername(userId),
    });
    if (error) throw new Error(error.message);
    return;
  }

  if (!profile.username?.trim()) {
    await supabase
      .from("profiles")
      .update({ username: guestUsername(userId) })
      .eq("id", userId);
  }
}

export async function getProfile(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (error) throw new Error(error.message);
  return data;
}
