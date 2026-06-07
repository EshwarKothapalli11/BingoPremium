import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateRoomCode(length = 6): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatDuration(startIso: string | null): string {
  if (!startIso) return "0:00";
  const start = new Date(startIso).getTime();
  const elapsed = Math.max(0, Date.now() - start);
  const mins = Math.floor(elapsed / 60000);
  const secs = Math.floor((elapsed % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function getAppUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function getRoomShareUrl(code: string): string {
  return `${getAppUrl()}/room/${code}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export function createEmptyMarkedGrid(): boolean[][] {
  return Array.from({ length: 5 }, () => Array(5).fill(false));
}

export function createEmptyBoardGrid(): number[][] {
  return Array.from({ length: 5 }, () => Array(5).fill(0));
}

export function lineKey(type: string, index: number): string {
  return `${type}-${index}`;
}
