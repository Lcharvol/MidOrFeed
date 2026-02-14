"use client";

import useSWR, { mutate as globalMutate } from "swr";
import { useCallback, useMemo, useRef } from "react";
import type { ApiResponse } from "@/types";
import type { LeagueAccount } from "@/types";
import { MATCHES_REFRESH_LIMIT } from "@/constants/matches";
import { SEMI_DYNAMIC_CONFIG } from "./swr";
import { apiKeys } from "@/lib/api/keys";

type LeagueAccountApi = {
  data: {
    puuid: string;
    riotRegion: string;
    riotGameName?: string | null;
    riotTagLine?: string | null;
    summonerLevel?: number | null;
    profileIconId?: number | null;
  };
};

// Fetcher POST optimisé avec gestion d'erreur
const postFetcher = async ([url, body]: [string, unknown]): Promise<LeagueAccountApi> => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(errText || `Request failed: ${res.status}`);
  }
  return res.json();
};

export function useAccount(puuid?: string | null, region?: string | null) {
  // Clé SWR pour le cache et la déduplication
  // Include region in the request body so API can auto-fetch if needed
  const key = puuid
    ? ["/api/league-accounts/get-by-puuid", { puuid, region: region || undefined }] as const
    : null;

  // Ref pour éviter les appels simultanés
  const isRefreshingRef = useRef(false);

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    postFetcher,
    {
      ...SEMI_DYNAMIC_CONFIG,
      // Déduplication plus longue pour les comptes (2 minutes)
      dedupingInterval: 2 * 60 * 1000,
    }
  );

  const account: LeagueAccount | null = useMemo(() => {
    if (!data?.data) return null;
    const a = data.data;
    return {
      puuid: a.puuid,
      riotRegion: a.riotRegion,
      riotGameName: a.riotGameName ?? null,
      riotTagLine: a.riotTagLine ?? null,
      summonerLevel: a.summonerLevel ?? null,
      profileIconId: a.profileIconId ?? null,
    };
  }, [data]);

  // Fonction POST réutilisable avec gestion d'erreur
  const postRequest = useCallback(
    async <TBody, TResponse>(url: string, body: TBody): Promise<TResponse> => {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(errText || `Request failed: ${res.status}`);
      }
      return res.json();
    },
    []
  );

  const forceRefreshFromRiot = useCallback(
    async (region: string) => {
      if (!puuid) return { success: false, error: "Missing puuid" } as const;

      // Éviter les appels simultanés
      if (isRefreshingRef.current) {
        return { success: false, error: "Refresh already in progress" } as const;
      }

      isRefreshingRef.current = true;

      try {
        const res = await postRequest<
          { puuid: string; region: string; force: boolean },
          ApiResponse<{
            puuid: string;
            gameName?: string | null;
            tagLine?: string | null;
            summonerLevel?: number | null;
            profileIconId?: number | null;
          }>
        >("/api/riot/get-account-details", { puuid, region, force: true });
        await mutate();
        return res;
      } catch (err) {
        let message = "Erreur lors du rafraîchissement";
        if (err instanceof Error) {
          try {
            const parsed = JSON.parse(err.message);
            message = parsed.error || message;
          } catch {
            message = err.message || message;
          }
        }
        return { success: false as const, error: message };
      } finally {
        isRefreshingRef.current = false;
      }
    },
    [mutate, puuid, postRequest]
  );

  const refreshAccountAndMatches = useCallback(
    async (region: string) => {
      if (!puuid) {
        return { success: false, error: "Missing puuid" } as const;
      }

      // Éviter les appels simultanés
      if (isRefreshingRef.current) {
        return { success: false, error: "Refresh already in progress" } as const;
      }

      isRefreshingRef.current = true;

      try {
        let accountRes: ApiResponse<unknown> & { code?: string; newPuuid?: string };
        try {
          accountRes = await postRequest<
            { puuid: string; region: string; force: boolean },
            ApiResponse<unknown> & { code?: string; newPuuid?: string }
          >("/api/riot/get-account-details", { puuid, region, force: true });
        } catch (err) {
          // Check if the error contains a PUUID_REFRESHED response
          if (err instanceof Error) {
            try {
              const parsed = JSON.parse(err.message);
              if (parsed.code === "PUUID_REFRESHED" && parsed.newPuuid) {
                return {
                  success: false as const,
                  error: "PUUID_REFRESHED",
                  newPuuid: parsed.newPuuid as string,
                };
              }
            } catch { /* not JSON, rethrow */ }
          }
          throw err;
        }

        if (!accountRes.success) {
          return accountRes;
        }

        const matchResponse = await postRequest<
          { puuid: string; region: string; count: number },
          {
            message: string;
            matchesCollected: number;
            participantsCreated: number;
            totalFound: number;
          }
        >("/api/matches/collect", {
          puuid,
          region,
          count: MATCHES_REFRESH_LIMIT,
        });

        // Revalidate account cache
        await mutate();

        // Revalidate matches cache to show new data without page reload
        if (puuid) {
          await globalMutate(apiKeys.matches({ puuid }));
        }

        // Revalidate ranked cache to show fresh ranked data
        if (puuid && region) {
          await globalMutate(apiKeys.summonerRanked(puuid, region));
        }

        return {
          success: true as const,
          matchesCollected: matchResponse.matchesCollected ?? 0,
          participantsCreated: matchResponse.participantsCreated ?? 0,
          totalFound: matchResponse.totalFound ?? 0,
        };
      } catch (err) {
        // postRequest throws on non-200 responses with the raw body as message
        let message = "Erreur lors de la mise à jour";
        if (err instanceof Error) {
          try {
            const parsed = JSON.parse(err.message);
            message = parsed.error || message;
          } catch {
            message = err.message || message;
          }
        }
        return { success: false as const, error: message };
      } finally {
        isRefreshingRef.current = false;
      }
    },
    [mutate, puuid, postRequest]
  );

  return {
    account,
    isLoading,
    isValidating,
    error: error ? (error as Error) : null,
    mutate,
    forceRefreshFromRiot,
    refreshAccountAndMatches,
  } as const;
}
