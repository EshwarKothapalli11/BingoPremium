"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { BingoButton } from "@/components/ui/BingoButton";
import type { Profile } from "@/types";

interface NavbarProps {
  profile: Profile;
}

export function Navbar({ profile }: NavbarProps) {
  return (
    <nav className="glass-card px-6 py-3 flex items-center justify-between mb-8">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold text-sm">
          B
        </div>
        <span className="font-bold text-lg tracking-wide">BINGO</span>
      </Link>

      <div className="flex items-center gap-4">
        <div className="hidden sm:flex items-center gap-2">
          <Avatar name={profile.username} avatarUrl={profile.avatar_url} size="sm" />
          <span className="text-sm font-medium">{profile.username}</span>
        </div>
        <Link href="/dashboard/create">
          <BingoButton size="sm">Create Room</BingoButton>
        </Link>
      </div>
    </nav>
  );
}
