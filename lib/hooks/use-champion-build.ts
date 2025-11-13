"use client";

import { useMemo } from "react";
import type { ApiResponse, ChampionBuildSummary } from "@/types";
import { apiKeys } from "@/lib/api/keys";
import { validateChampionBuildResponse } from "@/lib/api/schemas";
import { useApiSWR } from "./swr";

type UseChampionBuildResult = {
  build: ChampionBuildSummary | null;
  isLoading: boolean;
  isValidating: boolean;
  error: string | undefined;
  mutate: (() => Promise<ApiResponse<ChampionBuildSummary> | undefined>) | undefined;
};

export const useChampionBuild = (
  championId: string | null | undefined
): UseChampionBuildResult => {
  const shouldFetch = Boolean(championId);

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useApiSWR<ApiResponse<ChampionBuildSummary>>(
    shouldFetch && championId ? apiKeys.championBuild(championId) : null,
    {
      revalidateOnFocus: false,
      refreshInterval: 300_000,
    }
  );

  const validation = useMemo(
    () => (data ? validateChampionBuildResponse(data) : null),
    [data]
  );

  const build = useMemo<ChampionBuildSummary | null>(() => {
    if (!validation || !validation.ok) {
      return null;
    }
    return validation.value;
  }, [validation]);

  const resolvedError =
    (validation && !validation.ok ? validation.error : undefined) ||
    (error instanceof Error ? error.message : undefined);

  return {
    build,
    isLoading,
    isValidating,
    error: resolvedError,
    mutate,
  };
};


