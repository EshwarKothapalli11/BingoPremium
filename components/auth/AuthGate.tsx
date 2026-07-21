"use client";

import { useEffect, useState } from "react";
import { ensureSession } from "@/lib/session";
import { getProfile } from "@/lib/firebase/auth";
import { GlassCard } from "@/components/ui/GlassCard";
import { BingoButton } from "@/components/ui/BingoButton";
import { LoginScreen } from "@/components/auth/LoginScreen";
import type { Profile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

// Module-level session cache — survives re-mounts and navigations
let cachedProfile: Profile | null = null;

interface AuthGateProps {
  children: (profile: Profile) => React.ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const [profile, setProfile] = useState<Profile | null>(cachedProfile);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [showLogin, setShowLogin] = useState(false);
  const [loading, setLoading] = useState(!cachedProfile);

  useEffect(() => {
    // If we already have a cached profile, skip everything
    if (cachedProfile) {
      setProfile(cachedProfile);
      console.log("1. Auth completed");
      console.log("2. User loaded (cached)");
      setLoading(false);
      return;
    }

    let cancelled = false;
    console.time("[perf] AuthGate: total auth");

    const storedName = localStorage.getItem("playerName");
    if (!storedName) {
      if (!cancelled) {
        setShowLogin(true);
        setLoading(false);
      }
      console.timeEnd("[perf] AuthGate: total auth");
      return;
    }

    setLoading(true);
    ensureSession(storedName)
      .then((session) => getProfile(session.id))
      .then((p) => {
        if (!cancelled) {
          cachedProfile = p as Profile;
          setProfile(cachedProfile);
          console.log("1. Auth completed");
          console.log("2. User loaded");
          setLoading(false);
        }
        console.timeEnd("[perf] AuthGate: total auth");
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message ?? "Could not start session");
          setLoading(false);
        }
        console.timeEnd("[perf] AuthGate: total auth");
      });

    return () => {
      cancelled = true;
    };
  }, [retryKey]);

  const handleLogin = async (name: string) => {
    localStorage.setItem("playerName", name);
    cachedProfile = null; // Force re-fetch on login
    setShowLogin(false);
    setRetryKey((k) => k + 1);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 relative z-10">
        <GlassCard className="p-8 max-w-lg w-full text-center">
          <p className="text-red-500 font-semibold text-xl mb-2">Connection Error</p>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500 mb-8">
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

  if (showLogin) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 relative z-10">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-20 h-20 mb-6 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-4xl font-extrabold shadow-lg shadow-primary/30"
        >
          B
        </motion.div>
        <p className="text-lg text-gray-600 font-medium animate-pulse">Loading game…</p>
      </div>
    );
  }

  return <>{children(profile)}</>;
}
