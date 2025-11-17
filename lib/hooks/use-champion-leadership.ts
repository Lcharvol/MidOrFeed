"use client";

import { useMemo } from "react";
import type { ApiResponse } from "@/types";
import { useApiSWR } from "./swr";
import { apiKeys } from "@/lib/api/keys";

export type PlayerLeaderboardEntry = {
  puuid: string;
  gameName: string | null;
  tagLine: string | null;
  region: string | null;
  profileIconId: number | null;
  summonerLevel: number | null;
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
  avgKDA: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  score: number;
};

export type ChampionLeadershipData = {
  leaderboard: PlayerLeaderboardEntry[];
  totalPlayers: number;
};

type ChampionLeadershipResponse = ApiResponse<ChampionLeadershipData>;

export const useChampionLeadership = (championId: string) => {
  const { data, error, isLoading, mutate, isValidating } =
    useApiSWR<ChampionLeadershipResponse>(
      apiKeys.championLeadership(championId),
      {
        revalidateOnFocus: false,
      }
    );

  const leadershipData = useMemo(() => {
    if (!data?.success || !data.data) return null;
    return data.data;
  }, [data]);

  return {
    leadershipData,
    isLoading,
    error,
    isValidating,
    mutate,
  };
};

