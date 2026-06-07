"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { BingoButton } from "@/components/ui/BingoButton";

export function JoinRoomModal({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const router = useRouter();

  const handleJoin = () => {
    if (code.trim().length >= 4) {
      router.push(`/room/${code.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
      <GlassCard className="p-8 max-w-sm w-full mx-4 animate-modal-in">
        <h2 className="text-xl font-bold mb-4">Join with Code</h2>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter 6-char code"
          maxLength={6}
          className="w-full px-4 py-3 rounded-xl bg-white/50 border border-white/60 text-center text-2xl font-bold tracking-widest outline-none focus:border-primary/50 mb-4"
        />
        <div className="flex gap-3">
          <BingoButton variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </BingoButton>
          <BingoButton className="flex-1" onClick={handleJoin} disabled={code.length < 4}>
            Join
          </BingoButton>
        </div>
      </GlassCard>
    </div>
  );
}
