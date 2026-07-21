"use client";

import { useState, memo } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { BingoButton } from "@/components/ui/BingoButton";
import type { Message, Profile } from "@/types";

interface GameChatProps {
  messages: (Message & { profile?: { username: string } })[];
  onSend: (content: string) => void;
  currentPlayerId: string;
}

export const GameChat = memo(function GameChat({ messages, onSend, currentPlayerId }: GameChatProps) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    onSend(input);
    setInput("");
  };

  return (
    <GlassCard className="flex flex-col h-64 shadow-sm">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50/50 rounded-t-2xl">
        <h3 className="font-semibold text-sm text-slate-800">Game Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-slate-500 text-center py-4 font-medium">No messages yet</p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm ${msg.player_id === currentPlayerId ? "text-right" : ""}`}
          >
            <span className="text-xs text-slate-500 font-medium">
              {msg.profile?.username ?? "Player"}
            </span>
            <p
              className={`inline-block px-3 py-1.5 rounded-xl mt-0.5 shadow-sm border ${
                msg.player_id === currentPlayerId
                  ? "bg-blue-50 text-blue-800 border-blue-100"
                  : "bg-white text-slate-800 border-slate-200"
              }`}
            >
              {msg.content}
            </p>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-slate-200 flex gap-2 bg-slate-50/50 rounded-b-2xl">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-slate-800 placeholder-slate-400 shadow-sm"
        />
        <BingoButton size="sm" onClick={handleSend} className="shadow-sm font-bold">
          Send
        </BingoButton>
      </div>
    </GlassCard>
  );
});
