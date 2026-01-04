import { useApiSWR, SEMI_DYNAMIC_CONFIG } from "./swr";

interface ItemBuildData {
  items: number[];
  wins: number;
  games: number;
  winRate: number;
}

interface BuildAnalysisData {
  playerBuild: number[];
  optimalBuilds: ItemBuildData[];
  matchScore: number;
  suggestions: string[];
  commonItems: number[];
  unusualItems: number[];
  gamesAnalyzed: number;
}

interface BuildAnalysisResponse {
  success: boolean;
  data?: BuildAnalysisData;
  error?: string;
}

/**
 * Hook to fetch build analysis for a champion with specific items
 * @param championId - The champion ID to analyze
 * @param items - Array of item IDs the player built
 * @param queueId - Optional queue ID to filter analysis
 */
export function useBuildAnalysis(
  championId: string | undefined,
  items: number[],
  queueId?: number
) {
  // Only fetch if we have a champion and items
  const shouldFetch = !!championId && items.length > 0;
  const itemsParam = items.join(",");
  const queueParam = queueId ? `&queueId=${queueId}` : "";
  const url = shouldFetch
    ? `/api/builds/analyze?championId=${championId}&items=${itemsParam}${queueParam}`
    : null;

  const { data, error, isLoading } = useApiSWR<BuildAnalysisResponse>(
    url,
    SEMI_DYNAMIC_CONFIG
  );

  return {
    analysis: data?.data ?? null,
    isLoading,
    error,
  };
}
