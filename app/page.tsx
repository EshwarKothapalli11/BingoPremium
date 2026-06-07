"use client";

import DashboardClient from "./dashboard/DashboardClient";
import { AuthGate } from "@/components/auth/AuthGate";

export default function HomePage() {
  return (
    <AuthGate>
      {(profile) => <DashboardClient profile={profile} />}
    </AuthGate>
  );
}
