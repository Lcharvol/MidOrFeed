"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "@/lib/hooks/use-account";
import { getProfileIconUrl } from "@/constants/ddragon";

type SummonerDetails = {
  puuid: string;
  gameName?: string;
  tagLine?: string;
  summonerLevel?: number | null;
  profileIconId?: number | null;
};

export const useSummonerDetails = (puuid?: string, region?: string) => {
  const [details, setDetails] = useState<SummonerDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const {
    account,
    isLoading: accLoading,
    refreshAccountAndMatches,
  } = useAccount(puuid, region);

  // Set details from DB cache-first
  useEffect(() => {
    if (!puuid) {
      setLoading(false);
      return;
    }
    if (accLoading) {
      setLoading(true);
      return;
    }
    if (account) {
      setDetails({
        puuid,
        gameName: account.riotGameName || undefined,
        tagLine: account.riotTagLine || undefined,
        summonerLevel: account.summonerLevel || null,
        profileIconId: account.profileIconId || null,
      });
    }
    setLoading(false);
  }, [puuid, accLoading, account]);

  const profileIconUrl = useMemo(() => {
    if (!details?.profileIconId) return null;
    return getProfileIconUrl(details.profileIconId);
  }, [details]);

  return {
    details,
    loading,
    account,
    profileIconUrl,
    refreshAccountAndMatches,
  };
};

