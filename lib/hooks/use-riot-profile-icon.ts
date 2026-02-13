import { useState, useEffect } from "react";
import { DDRAGON_VERSION, getProfileIconUrl as buildProfileIconUrl } from "@/constants/ddragon";

interface RiotAccountDetails {
  puuid: string;
  gameName: string;
  tagLine: string;
  summonerLevel: number | null;
  profileIconId: number | null;
  summonerId: string | null;
  accountId: string | null;
  revisionDate: number | null;
}

export function useRiotProfileIcon(
  riotPuuid?: string | null,
  riotRegion?: string | null
) {
  const [riotDetails, setRiotDetails] = useState<RiotAccountDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!riotPuuid || !riotRegion) {
      setRiotDetails(null);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    const fetchRiotDetails = async () => {
      setIsLoading(true);

      try {
        const response = await fetch("/api/riot/get-account-details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            puuid: riotPuuid,
            region: riotRegion,
          }),
          signal: controller.signal,
        });

        const result = await response.json();

        if (!cancelled && response.ok && result.data) {
          setRiotDetails(result.data);
        }
      } catch (error) {
        if (!cancelled && (error as Error).name !== "AbortError") {
          console.error("Erreur:", error);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchRiotDetails();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [riotPuuid, riotRegion]);

  return {
    profileIconUrl: riotDetails?.profileIconId
      ? buildProfileIconUrl(riotDetails.profileIconId, DDRAGON_VERSION)
      : null,
    isLoading,
  };
}
