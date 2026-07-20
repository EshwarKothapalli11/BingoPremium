"use client";

import { cn, copyToClipboard, getRoomShareUrl } from "@/lib/utils";
import { GlassCard } from "@/components/ui/GlassCard";
import { BingoButton } from "@/components/ui/BingoButton";
import { Avatar } from "@/components/ui/Avatar";
import type { Room, RoomPlayer } from "@/types";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="max-w-3xl mx-auto space-y-8 relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <GlassCard className="p-10 text-center shadow-xl">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-3">Room Code</p>
          <div className="flex items-center justify-center gap-6 mb-6">
            <span className="text-6xl font-black tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent drop-shadow-sm">
              {room.code}
            </span>
            <BingoButton variant="secondary" size="sm" onClick={handleCopyCode} className="px-6 py-3 font-bold">
              {copied ? "Copied!" : "Copy"}
            </BingoButton>
          </div>
          <p className="text-2xl font-extrabold mb-2 text-slate-900">{room.name}</p>
          <p className="text-sm font-medium text-slate-500 mb-6">
            {players.length}/{room.max_players} players
          </p>
          <BingoButton variant="secondary" size="sm" onClick={handleShareLink} className="font-bold">
            📋 Share Link
          </BingoButton>
        </GlassCard>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <GlassCard className="p-8 shadow-lg">
          <h3 className="font-extrabold text-xl mb-6 text-slate-900">Players in Lobby</h3>
          <div className="space-y-4">
            <AnimatePresence>
              {players.map((player) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, scale: 0.95, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 20 }}
                  transition={{ type: "spring", stiffness: 100, damping: 15 }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm"
                >
                  <Avatar
                    name={player.profile?.username ?? "P"}
                    avatarUrl={player.profile?.avatar_url}
                  />
                  <div className="flex-1">
                    <p className="font-bold text-lg text-slate-900">
                      {player.profile?.username ?? "Player"}
                      {player.player_id === room.host_id && (
                        <span className="text-xs font-black uppercase tracking-wider text-primary ml-3 bg-primary/10 px-2 py-1 rounded-md">Host</span>
                      )}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-bold px-4 py-2 rounded-xl transition-colors border",
                      player.is_ready
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    )}
                  >
                    {player.is_ready ? "Ready" : "Not Ready"}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </GlassCard>
      </motion.div>

      <motion.div 
        className="flex justify-center gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {isHost ? (
          <BingoButton size="lg" disabled={!canStart} onClick={onStart} className="px-12 py-5 text-xl font-black shadow-xl shadow-primary/20">
            Start Game
          </BingoButton>
        ) : (
          <BingoButton
            size="lg"
            variant={currentPlayer?.is_ready ? "secondary" : "primary"}
            onClick={() => onReady(!currentPlayer?.is_ready)}
            className={`px-12 py-5 text-xl font-black shadow-xl ${currentPlayer?.is_ready ? 'shadow-sm' : 'shadow-primary/20'}`}
          >
            {currentPlayer?.is_ready ? "Not Ready" : "Mark Ready"}
          </BingoButton>
        )}
      </motion.div>

      {isHost && !canStart && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-sm font-medium text-slate-500"
        >
          {players.length < 2
            ? "Waiting for more players to join…"
            : "Waiting for all players to be ready…"}
        </motion.p>
      )}
    </div>
  );
}
