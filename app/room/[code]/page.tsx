"use client";

import RoomPageClient from "./RoomPageClient";
import { AuthGate } from "@/components/auth/AuthGate";

interface RoomPageProps {
  params: { code: string };
}

export default function RoomPage({ params }: RoomPageProps) {
  return (
    <AuthGate>
      {(profile) => (
        <RoomPageClient code={params.code.toUpperCase()} profile={profile} />
      )}
    </AuthGate>
  );
}
