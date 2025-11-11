import { useMemo, useCallback } from "react";
import type {
  ApiResponse,
  SummonerOverviewMatchData,
  MatchesAggregateStats,
  MatchSummary,
  ChampionIdToStats,
  RoleIdToStats,
  MatchesPayload,
} from "@/types";
import { useMatches } from "./use-matches";
import { useChampions } from "./use-champions";
import {
  computeAiInsights,
  computeRolePerformance,
  computeTopChampions,
  resolveChampionSlug,
  type TopChampionEntry,
  type RolePerformanceEntry,
} from "@/lib/summoners/overview";

interface UseSummonerOverviewResult {
  overview: SummonerOverviewMatchData | null;
  matches: MatchSummary[];
  stats: MatchesAggregateStats | null;
  championStats: ChampionIdToStats;
  roleStats: RoleIdToStats;
  topChampions: TopChampionEntry[];
  rolePerformance: RolePerformanceEntry[];
  aiInsights: ReturnType<typeof computeAiInsights>;
  winRateValue: number;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  championNameMap: Map<string, string>;
  championKeyToIdMap: Map<string, string>;
  resolveSlug: (value: string) => string;
  refresh: () => Promise<ApiResponse<MatchesPayload> | undefined>;
}

export const useSummonerOverview = (
  puuid?: string
): UseSummonerOverviewResult => {
  const {
    data,
    matches,
    stats,
    championStats,
    roleStats,
    isLoading: matchesLoading,
    isValidating,
    error: matchesError,
    refresh,
  } = useMatches({ puuid });

  const {
    championNameMap,
    championKeyToIdMap,
    isLoading: championsLoading,
    error: championsError,
  } = useChampions();

  const overview = useMemo<SummonerOverviewMatchData | null>(
    () => (data ? data : null),
    [data]
  );

  const combinedLoading = matchesLoading || championsLoading;
  const combinedError = matchesError ?? championsError ?? null;

  const topChampions = useMemo(
    () => computeTopChampions(overview),
    [overview]
  );

  const rolePerformance = useMemo(
    () => computeRolePerformance(overview),
    [overview]
  );

  const winRateValue = useMemo(
    () => (overview ? parseFloat(overview.stats.winRate) : 0),
    [overview]
  );

  const aiInsights = useMemo(
    () => computeAiInsights(overview, topChampions, championNameMap),
    [overview, topChampions, championNameMap]
  );

  const resolveSlug = useCallback(
    (value: string) => resolveChampionSlug(value, championKeyToIdMap),
    [championKeyToIdMap]
  );

  return {
    overview,
    matches,
    stats,
    championStats,
    roleStats,
    topChampions,
    rolePerformance,
    aiInsights,
    winRateValue,
    isLoading: combinedLoading,
    isValidating,
    error: combinedError,
    championNameMap,
    championKeyToIdMap,
    resolveSlug,
    refresh,
  };
};

