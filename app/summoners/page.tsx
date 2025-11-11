"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { RiotAccountSection } from "@/components/RiotAccountSection";

export default function SummonersPage() {
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (user?.leagueAccount?.puuid && user?.leagueAccount?.riotRegion) {
      router.replace(
        `/summoners/${user.leagueAccount.puuid}/overview?region=${user.leagueAccount.riotRegion}`
      );
    }
  }, [router, user?.leagueAccount?.puuid, user?.leagueAccount?.riotRegion]);

  if (!user?.leagueAccount) {
    return (
      <div className="container mx-auto py-10">
        <RiotAccountSection showAnalyzeButton={false} />
      </div>
    );
  }

  return null;
}
