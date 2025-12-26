"use client";

import { useMemo, useCallback } from "react";
import type { ApiResponse, ChampionEntity, ChampionSummary } from "@/types";
import { useApiSWR, STATIC_DATA_CONFIG } from "./swr";
import { apiKeys } from "@/lib/api/keys";
import { validateChampionListResponse } from "@/lib/api/schemas";

type ChampionsApiResponse = ApiResponse<ChampionEntity[]> & {
  count?: number;
};

export const useChampions = (options?: { limit?: number }) => {
  // Par défaut, récupérer tous les champions (200 devrait suffire pour LoL)
  // La limite maximum de l'API est maintenant 1000, donc on peut tout récupérer en une fois
  const limit = options?.limit ?? 200;
  
  const { data, error, isLoading, mutate, isValidating } =
    useApiSWR<ChampionsApiResponse>(
      apiKeys.champions({ page: 1, limit }),
      STATIC_DATA_CONFIG
    );

  const validation = useMemo(
    () => (data ? validateChampionListResponse(data) : null),
    [data]
  );

  const champions = useMemo<ChampionEntity[]>(() => {
    if (!validation || !validation.ok) return [];
    return validation.value.champions as unknown as ChampionEntity[];
  }, [validation]);

  const championSummaries = useMemo<ChampionSummary[]>(
    () =>
      champions.map(({ championId, name }) => ({
        championId,
        name,
      })),
    [champions]
  );

  const championNameMap = useMemo(() => {
    const map = new Map<string, string>();
    champions.forEach(({ championId, championKey, name }) => {
      map.set(championId, name);
      if (championKey !== undefined && championKey !== null) {
        map.set(String(championKey), name);
      }
    });
    return map;
  }, [champions]);

  const championKeyToIdMap = useMemo(() => {
    const map = new Map<string, string>();
    champions.forEach(({ championKey, championId }) => {
      if (championKey !== undefined && championKey !== null) {
        map.set(String(championKey), championId);
      }
    });
    return map;
  }, [champions]);

  const championIdToEntityMap = useMemo(() => {
    const map = new Map<string, ChampionEntity>();
    champions.forEach((champion) => {
      map.set(champion.championId, champion);
    });
    return map;
  }, [champions]);

  const resolveSlug = useCallback(
    (value: string) => championKeyToIdMap.get(value) ?? value,
    [championKeyToIdMap]
  );

  const resolveName = useCallback(
    (value: string) =>
      championNameMap.get(resolveSlug(value)) ??
      championNameMap.get(value) ??
      value,
    [championNameMap, resolveSlug]
  );

  return {
    champions,
    championSummaries,
    championNameMap,
    championKeyToIdMap,
    championIdToEntityMap,
    resolveSlug,
    resolveName,
    count:
      validation && validation.ok && validation.value.count !== undefined
        ? validation.value.count
        : champions.length,
    error: error ?? (validation && !validation.ok ? validation.error : undefined),
    isLoading,
    isValidating,
    mutate,
  };
};
