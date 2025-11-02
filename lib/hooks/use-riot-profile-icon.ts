import { useState, useEffect } from "react";

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
    const fetchRiotDetails = async () => {
      if (!riotPuuid || !riotRegion) {
        // Nettoyer les détails si pas de puuid ou region
        setRiotDetails(null);
        return;
      }

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
        });

        const result = await response.json();

        if (response.ok && result.data) {
          setRiotDetails(result.data);
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRiotDetails();
  }, [riotPuuid, riotRegion]);

  const getProfileIconUrl = (iconId: number | null) => {
    if (!iconId) return null;
    const version = "15.21.1";
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
  };

  return {
    profileIconUrl: riotDetails?.profileIconId
      ? getProfileIconUrl(riotDetails.profileIconId)
      : null,
    isLoading,
  };
}
