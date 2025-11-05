"use client";

import useSWR from "swr";
import { useCallback, useMemo } from "react";
import type { ApiResponse } from "@/types";
import type { LeagueAccount } from "@/types";

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

const postJson = async <TRequest, TResponse>(
  url: string,
  body: TRequest
): Promise<TResponse> => {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(errText || `Request failed: ${res.status}`);
  }
  return (await res.json()) as TResponse;
};

export function useAccount(puuid?: string | null) {
  const key = puuid ? ["leagueAccountByPuuid", puuid] : (null as const);

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    ([, id]) =>
      postJson<{ puuid: string }, LeagueAccountApi>(
        "/api/league-accounts/get-by-puuid",
        { puuid: id }
      ),
    {
      revalidateOnFocus: false,
      shouldRetryOnError: false,
      dedupingInterval: 10_000,
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

  const forceRefreshFromRiot = useCallback(
    async (region: string) => {
      if (!puuid) return { success: false, error: "Missing puuid" } as const;
      const res = await postJson<
        { puuid: string; region: string; force: boolean },
        ApiResponse<{
          puuid: string;
          gameName?: string | null;
          tagLine?: string | null;
          summonerLevel?: number | null;
          profileIconId?: number | null;
        }>
      >("/api/riot/get-account-details", { puuid, region, force: true });
      // Revalider le cache local après MAJ
      await mutate();
      return res;
    },
    [mutate, puuid]
  );

  return {
    account,
    isLoading,
    isValidating,
    error: error ? (error as Error) : null,
    mutate,
    forceRefreshFromRiot,
  } as const;
}
