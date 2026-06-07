"use client";

import CreateRoomClient from "./CreateRoomClient";
import { AuthGate } from "@/components/auth/AuthGate";

export default function CreateRoomPage() {
  return (
    <AuthGate>
      {(profile) => <CreateRoomClient profile={profile} />}
    </AuthGate>
  );
}
