"use client";

import { GlassCard } from "@/components/ui/GlassCard";
import { BingoButton } from "@/components/ui/BingoButton";
import type { Profile, WinStats } from "@/types";
import { useRouter } from "next/navigation";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <GlassCard className="p-10 max-w-md w-full mx-4 text-center animate-modal-in">
        {isWinner ? (
          <>
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-2xl font-bold mb-2">
              Congratulations {profile.username}!
            </h2>
            <p className="text-lg text-primary font-semibold mb-6">You won!</p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold mb-2">Better luck next time</h2>
            <p className="text-text-muted mb-6">
              <span className="font-semibold text-text-primary">{winnerName}</span> won
              this round!
            </p>
          </>
        )}

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="glass-card p-3 rounded-xl">
            <p className="text-2xl font-bold text-primary">{stats.moves}</p>
            <p className="text-xs text-text-muted">Moves</p>
          </div>
          <div className="glass-card p-3 rounded-xl">
            <p className="text-2xl font-bold text-primary">{stats.lines}</p>
            <p className="text-xs text-text-muted">Lines</p>
          </div>
          <div className="glass-card p-3 rounded-xl">
            <p className="text-2xl font-bold text-primary">{stats.duration}</p>
            <p className="text-xs text-text-muted">Time</p>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          {onPlayAgain && (
            <BingoButton variant="secondary" onClick={onPlayAgain}>
              Play Again
            </BingoButton>
          )}
          <BingoButton onClick={() => router.push("/")}>
            Back to Dashboard
          </BingoButton>
        </div>
      </GlassCard>
    </div>
  );
}
