"use client";

import { cn, copyToClipboard, getRoomShareUrl } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { BingoButton } from "@/components/ui/BingoButton";
import { Avatar } from "@/components/ui/Avatar";
import type { Room, RoomPlayer } from "@/types";
import { useState } from "react";

interface LobbyViewProps {
  room: Room;
  players: RoomPlayer[];
  currentUserId: string;
  onReady: (ready: boolean) => void;
  onStart: () => void;
}

export function LobbyView({
  room,
  players,
  currentUserId,
  onReady,
  onStart,
}: LobbyViewProps) {
  const [copied, setCopied] = useState(false);
  const isHost = room.host_id === currentUserId;
  const currentPlayer = players.find((p) => p.player_id === currentUserId);
  const allReady = players.length >= 2 && players.every((p) => p.is_ready);
  const canStart = isHost && allReady && players.length >= 2;

  const handleCopyCode = async () => {
    await copyToClipboard(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareLink = async () => {
    await copyToClipboard(getRoomShareUrl(room.code));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <GlassCard className="p-8 text-center">
        <p className="text-sm text-text-muted mb-2">Room Code</p>
        <div className="flex items-center justify-center gap-4 mb-4">
          <span className="text-5xl font-extrabold tracking-[0.3em] text-primary">
            {room.code}
          </span>
          <BingoButton variant="secondary" size="sm" onClick={handleCopyCode}>
            {copied ? "Copied!" : "Copy"}
          </BingoButton>
        </div>
        <p className="text-lg font-semibold mb-1">{room.name}</p>
        <p className="text-sm text-text-muted mb-4">
          {players.length}/{room.max_players} players
        </p>
        <BingoButton variant="secondary" size="sm" onClick={handleShareLink}>
          📋 Share Link
        </BingoButton>
      </GlassCard>

      <GlassCard className="p-6">
        <h3 className="font-semibold mb-4">Players in Lobby</h3>
        <div className="space-y-3">
          {players.map((player) => (
            <div
              key={player.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/40 animate-slide-in"
            >
              <Avatar
                name={player.profile?.username ?? "P"}
                avatarUrl={player.profile?.avatar_url}
              />
              <div className="flex-1">
                <p className="font-medium">
                  {player.profile?.username ?? "Player"}
                  {player.player_id === room.host_id && (
                    <span className="text-xs text-accent ml-2">Host</span>
                  )}
                </p>
              </div>
              <span
                className={cn(
                  "text-xs font-semibold px-3 py-1 rounded-full",
                  player.is_ready
                    ? "bg-success/15 text-success"
                    : "bg-white/60 text-text-muted"
                )}
              >
                {player.is_ready ? "Ready" : "Not Ready"}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="flex justify-center gap-4">
        {isHost ? (
          <BingoButton size="lg" disabled={!canStart} onClick={onStart}>
            Start Game
          </BingoButton>
        ) : (
          <BingoButton
            size="lg"
            variant={currentPlayer?.is_ready ? "secondary" : "primary"}
            onClick={() => onReady(!currentPlayer?.is_ready)}
          >
            {currentPlayer?.is_ready ? "Not Ready" : "Mark Ready"}
          </BingoButton>
        )}
      </div>

      {isHost && !canStart && (
        <p className="text-center text-sm text-text-muted">
          {players.length < 2
            ? "Waiting for more players to join…"
            : "Waiting for all players to be ready…"}
        </p>
      )}
    </div>
  );
}
