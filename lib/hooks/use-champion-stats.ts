"use client";

import { useMemo } from "react";
import type { ApiResponse, TierListChampionStats } from "@/types";
import { useApiSWR } from "./swr";
import { apiKeys } from "@/lib/api/keys";
import { validateChampionStatsResponse } from "@/lib/api/schemas";

type ChampionStatsResponse = ApiResponse<TierListChampionStats[]> & {
  count?: number;
};

type UseChampionStatsOptions = {
  patch?: string;
  rank?: string;
};

export const useChampionStats = (options?: UseChampionStatsOptions) => {
  const key = options?.patch
    ? apiKeys.championStatsByPatch(options.patch, options.rank)
    : apiKeys.championStats(options?.rank ? { rank: options.rank } : undefined);

  const { data, error, isLoading, mutate, isValidating } =
    useApiSWR<ChampionStatsResponse>(key, {
      revalidateOnFocus: false,
    });

  const validation = useMemo(
    () => (data ? validateChampionStatsResponse(data) : null),
    [data]
  );

  const championStats = useMemo(() => {
    if (!validation || !validation.ok) return [];
    return validation.value.stats;
  }, [validation]);

  const totalUniqueMatches = useMemo(() => {
    if (!validation || !validation.ok) return undefined;
    return validation.value.totalUniqueMatches;
  }, [validation]);

  return {
    championStats,
    count:
      validation && validation.ok && validation.value.count !== undefined
        ? validation.value.count
        : championStats.length,
    totalUniqueMatches,
    error: error ?? (validation && !validation.ok ? validation.error : undefined),
    isLoading,
    isValidating,
    mutate,
  };
};


