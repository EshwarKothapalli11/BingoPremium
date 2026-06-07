"use client";

import CreateRoomPage from "@/components/lobby/CreateRoomPage";
import type { Profile } from "@/types";

export default function CreateRoomClient({ profile }: { profile: Profile }) {
  return <CreateRoomPage profile={profile} />;
}
