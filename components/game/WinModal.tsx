"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { BingoButton } from "@/components/ui/BingoButton";
import type { Profile, WinStats } from "@/types";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface WinModalProps {
  isWinner: boolean;
  winnerName: string;
  profile: Profile;
  stats: WinStats;
  onPlayAgain?: () => void;
}

export function WinModal({
  isWinner,
  winnerName,
  profile,
  stats,
  onPlayAgain,
}: WinModalProps) {
  const router = useRouter();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
        className="max-w-md w-full mx-4"
      >
        <GlassCard className="p-10 text-center shadow-2xl bg-white/90">
          {isWinner ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <div className="text-7xl mb-6">🏆</div>
              <h2 className="text-xl font-bold mb-1 text-slate-500 uppercase tracking-widest">
                Winner
              </h2>
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
                {profile.username}
              </p>
              <p className="text-lg font-medium text-slate-800 mb-8">completed BINGO</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              <div className="text-7xl mb-6">🏆</div>
              <h2 className="text-xl font-bold mb-1 text-slate-500 uppercase tracking-widest">
                Winner
              </h2>
              <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-2">
                {winnerName}
              </p>
              <p className="text-lg font-medium text-slate-800 mb-8">completed BINGO</p>
            </motion.div>
          )}

          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <p className="text-2xl font-black text-slate-900">{stats.moves}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase">Moves</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <p className="text-2xl font-black text-slate-900">{stats.lines}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase">Lines</p>
            </div>
            <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
              <p className="text-2xl font-black text-slate-900">{stats.duration}</p>
              <p className="text-xs font-semibold text-slate-500 uppercase">Time</p>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            {onPlayAgain && (
              <BingoButton variant="secondary" onClick={onPlayAgain} className="px-6 py-4 font-bold">
                Play Again
              </BingoButton>
            )}
            <BingoButton onClick={() => router.push("/")} className="px-6 py-4 font-bold shadow-lg shadow-primary/20">
              Back to Dashboard
            </BingoButton>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
