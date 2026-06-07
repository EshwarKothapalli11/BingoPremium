"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { BingoButton } from "@/components/ui/BingoButton";
import { Navbar } from "@/components/ui/Navbar";
import { useRoom } from "@/hooks/useRoom";
import { copyToClipboard, getRoomShareUrl } from "@/lib/utils";
import type { Profile } from "@/types";

export default function CreateRoomPage({ profile }: { profile: Profile }) {
  const router = useRouter();
  const { createRoom } = useRoom("");
  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setLoading(true);
    const result = await createRoom(name.trim(), profile.id, maxPlayers);
    setLoading(false);

    if (result.room) {
      setCreatedCode(result.room.code);
    }
  };

  const handleCopy = async () => {
    if (!createdCode) return;
    await copyToClipboard(getRoomShareUrl(createdCode));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnterLobby = () => {
    if (createdCode) router.push(`/room/${createdCode}`);
  };

  return (
    <div className="min-h-screen px-4 py-6 max-w-2xl mx-auto">
      <Navbar profile={profile} />

      <GlassCard className="p-8">
        <h1 className="text-2xl font-bold mb-6">Create New Room</h1>

        {!createdCode ? (
          <div className="space-y-6">
            <div>
              <label className="text-sm font-medium text-text-muted block mb-2">
                Room Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Friday Night Bingo"
                className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 outline-none focus:border-primary/50"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-text-muted block mb-2">
                Max Players ({maxPlayers})
              </label>
              <input
                type="range"
                min={2}
                max={6}
                value={maxPlayers}
                onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                className="w-full accent-primary"
              />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>2</span>
                <span>6</span>
              </div>
            </div>

            <BingoButton
              className="w-full"
              size="lg"
              onClick={handleCreate}
              disabled={!name.trim() || loading}
            >
              {loading ? "Creating…" : "Create Room"}
            </BingoButton>
          </div>
        ) : (
          <div className="text-center space-y-6">
            <div>
              <p className="text-sm text-text-muted mb-2">Your Room Code</p>
              <p className="text-4xl font-extrabold tracking-[0.3em] text-primary">
                {createdCode}
              </p>
            </div>

            <div className="glass-card p-4 rounded-xl">
              <p className="text-xs text-text-muted mb-1">Shareable Link</p>
              <p className="text-sm font-mono break-all">{getRoomShareUrl(createdCode)}</p>
            </div>

            <div className="flex gap-3 justify-center">
              <BingoButton variant="secondary" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy Link"}
              </BingoButton>
              <BingoButton size="lg" onClick={handleEnterLobby}>
                Enter Lobby →
              </BingoButton>
            </div>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
