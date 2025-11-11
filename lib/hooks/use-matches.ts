import { useMemo, useCallback } from "react";
import type { KeyedMutator } from "swr";
import { useApiSWR } from "./swr";
import type {
  ApiResponse,
  MatchesPayload,
  MatchesAggregateStats,
  MatchSummary,
  ChampionIdToStats,
  RoleIdToStats,
} from "@/types";
import { apiKeys } from "@/lib/api/keys";
import { validateMatchesResponse } from "@/lib/api/schemas";

interface UseMatchesParams {
  puuid?: string;
}

interface UseMatchesResult {
  data: MatchesPayload | null;
  matches: MatchSummary[];
  stats: MatchesAggregateStats | null;
  championStats: ChampionIdToStats;
  roleStats: RoleIdToStats;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  mutate: KeyedMutator<ApiResponse<MatchesPayload>>;
  refresh: () => Promise<ApiResponse<MatchesPayload> | undefined>;
}

export const useMatches = (
  params?: UseMatchesParams,
  options?: Parameters<typeof useApiSWR<ApiResponse<MatchesPayload>>>[1]
): UseMatchesResult => {
  const key = params?.puuid ? apiKeys.matches({ puuid: params.puuid }) : apiKeys.matches();

  const {
    data,
    isLoading,
    isValidating,
    error,
    mutate,
  } = useApiSWR<ApiResponse<MatchesPayload>>(key, {
    keepPreviousData: true,
    revalidateOnFocus: false,
    ...options,
  });

  const validation = useMemo(
    () => (data ? validateMatchesResponse(data) : null),
    [data]
  );

  const payload = useMemo<MatchesPayload | null>(
    () => (validation && validation.ok ? validation.value : null),
    [validation]
  );

  const matches = useMemo<MatchSummary[]>(() => payload?.matches ?? [], [payload]);
  const stats = useMemo<MatchesAggregateStats | null>(() => payload?.stats ?? null, [payload]);
  const championStats = useMemo<ChampionIdToStats>(() => payload?.championStats ?? {}, [payload]);
  const roleStats = useMemo<RoleIdToStats>(() => payload?.roleStats ?? {}, [payload]);

  const refresh = useCallback(() => mutate(), [mutate]);

  return {
    data: payload,
    matches,
    stats,
    championStats,
    roleStats,
    isLoading,
    isValidating,
    error: error ?? (validation && !validation.ok ? validation.error : undefined),
    mutate,
    refresh,
  };
};
