"use client";

import { useMemo } from "react";
import type { ApiResponse, ItemStatsData } from "@/types";
import { useApiSWR, SEMI_DYNAMIC_CONFIG } from "./swr";
import { apiKeys } from "@/lib/api/keys";
import { validateItemStatsResponse } from "@/lib/api/schemas";

type ItemStatsResponse = ApiResponse<ItemStatsData[]> & {
  count?: number;
};

export const useItemStats = () => {
  const { data, error, isLoading, mutate, isValidating } =
    useApiSWR<ItemStatsResponse>(apiKeys.itemStats(), SEMI_DYNAMIC_CONFIG);

  const validation = useMemo(
    () => (data ? validateItemStatsResponse(data) : null),
    [data]
  );

  const itemStats = useMemo(() => {
    if (!validation || !validation.ok) return [];
    return validation.value.stats;
  }, [validation]);

  const totalUniqueMatches = useMemo(() => {
    if (!validation || !validation.ok) return undefined;
    return validation.value.totalUniqueMatches;
  }, [validation]);

  return {
    itemStats,
    count:
      validation && validation.ok && validation.value.count !== undefined
        ? validation.value.count
        : itemStats.length,
    totalUniqueMatches,
    error: error ?? (validation && !validation.ok ? validation.error : undefined),
    isLoading,
    isValidating,
    mutate,
  };
};
