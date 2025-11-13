"use client";

import { useMemo } from "react";
import type { KeyedMutator } from "swr";
import type { ApiResponse, ChampionAdviceSummary } from "@/types";
import { apiKeys } from "@/lib/api/keys";
import {
  validateChampionAdviceListResponse,
  validateChampionAdviceSingleResponse,
} from "@/lib/api/schemas";
import { useApiSWR } from "./swr";

type UseChampionAdviceResult = {
  advices: ChampionAdviceSummary["advices"];
  isLoading: boolean;
  isValidating: boolean;
  error: string | undefined;
  mutate: KeyedMutator<ApiResponse<ChampionAdviceSummary>> | undefined;
  validateSingle: (input: unknown) => ReturnType<typeof validateChampionAdviceSingleResponse>;
};

export const useChampionAdvice = (
  championId: string | null | undefined
): UseChampionAdviceResult => {
  const shouldFetch = Boolean(championId);

  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useApiSWR<ApiResponse<ChampionAdviceSummary>>(
    shouldFetch && championId ? apiKeys.championAdvice(championId) : null,
    {
      revalidateOnFocus: false,
      refreshInterval: 120_000,
    }
  );

  const validation = useMemo(
    () => (data ? validateChampionAdviceListResponse(data) : null),
    [data]
  );

  const advices = useMemo(() => {
    if (!validation || !validation.ok) {
      return [] as ChampionAdviceSummary["advices"];
    }
    return validation.value.advices;
  }, [validation]);

  const resolvedError =
    (validation && !validation.ok ? validation.error : undefined) ||
    (error instanceof Error ? error.message : undefined);

  return {
    advices,
    isLoading,
    isValidating,
    error: resolvedError,
    mutate,
    validateSingle: validateChampionAdviceSingleResponse,
  };
};


