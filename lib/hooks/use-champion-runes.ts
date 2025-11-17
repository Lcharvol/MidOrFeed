"use client";

import { useMemo } from "react";
import type { ApiResponse } from "@/types";
import { useApiSWR } from "./swr";
import { apiKeys } from "@/lib/api/keys";

export type SummonerSpellStat = {
  spell1Id: number;
  spell2Id: number;
  spell1Name: string;
  spell2Name: string;
  picks: number;
  wins: number;
  winRate: number;
  pickRate: number;
};

export type ChampionRunesData = {
  summonerSpells: SummonerSpellStat[];
  runes: null;
  skillOrder: null;
  totalMatches: number;
};

type ChampionRunesResponse = ApiResponse<ChampionRunesData>;

export const useChampionRunes = (championId: string) => {
  const { data, error, isLoading, mutate, isValidating } =
    useApiSWR<ChampionRunesResponse>(apiKeys.championRunes(championId), {
      revalidateOnFocus: false,
    });

  const runesData = useMemo(() => {
    if (!data?.success || !data.data) return null;
    return data.data;
  }, [data]);

  return {
    runesData,
    isLoading,
    error,
    isValidating,
    mutate,
  };
};

