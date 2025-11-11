"use client";

import { useAuth } from "@/lib/auth-context";
import { ProfileInfo } from "./ProfileInfo";
import { RiotAccountSection } from "@/components/RiotAccountSection";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto py-10">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-3xl font-bold">Mon Profil</h1>
        <ProfileInfo user={user} />
        <RiotAccountSection />
      </div>
    </div>
  );
}
