"use client";

import { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { BingoButton } from "@/components/ui/BingoButton";
import type { Message, Profile } from "@/types";

interface GameChatProps {
  messages: (Message & { profile?: { username: string } })[];
  onSend: (content: string) => void;
  currentPlayerId: string;
}

export function GameChat({ messages, onSend, currentPlayerId }: GameChatProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <GlassCard className="flex flex-col h-64">
      <div className="px-4 py-3 border-b border-white/40">
        <h3 className="font-semibold text-sm">Game Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-text-muted text-center py-4">No messages yet</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm ${msg.player_id === currentPlayerId ? "text-right" : ""}`}
          >
            <span className="text-xs text-text-muted font-medium">
              {msg.profile?.username ?? "Player"}
            </span>
            <p
              className={`inline-block px-3 py-1.5 rounded-xl mt-0.5 ${
                msg.player_id === currentPlayerId
                  ? "bg-primary/10 text-primary"
                  : "bg-white/50"
              }`}
            >
              {msg.content}
            </p>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-white/40 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 rounded-xl bg-white/50 border border-white/60 text-sm outline-none focus:border-primary/50"
        />
        <BingoButton size="sm" onClick={handleSend}>
          Send
        </BingoButton>
      </div>
    </GlassCard>
  );
}
