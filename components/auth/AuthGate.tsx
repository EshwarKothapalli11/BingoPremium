"use client";

import { useEffect, useState } from "react";
import { ensureSession } from "@/lib/session";
import { getProfile } from "@/lib/firebase/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { BingoButton } from "@/components/ui/BingoButton";
import type { Profile } from "@/types";

interface AuthGateProps {
  children: (profile: Profile) => React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    ensureSession()
      .then((session) => getProfile(session.id))
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message ?? "Could not start session");
      });

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <GlassCard className="p-8 max-w-lg w-full">
          <p className="text-danger font-semibold text-lg mb-2">Connection Error</p>
          <p className="text-sm text-text-muted mb-4">{error}</p>
          <p className="text-sm text-text-muted mb-4">
            Please check that your Firebase project is configured correctly and
            Anonymous Authentication is enabled.
          </p>

          <BingoButton className="w-full" onClick={() => { setError(null); setRetryKey((k) => k + 1); }}>
            Retry
          </BingoButton>
        </GlassCard>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-extrabold">
          B
        </div>
        <p className="text-sm text-text-muted animate-pulse">Loading game…</p>
      </div>
    );
  }

  return <>{children(profile)}</>;
}
