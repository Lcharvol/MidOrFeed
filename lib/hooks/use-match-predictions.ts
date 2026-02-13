import { useMemo } from "react";
import { useApiSWR } from "./swr";

interface MatchPrediction {
  matchId: string;
  participantPUuid: string | null;
  championId: string;
  winProbability: number;
}

interface PredictionsResponse {
  success: boolean;
  data?: {
    predictions: Record<string, MatchPrediction[]>;
    matchCount: number;
    noModel?: boolean;
  };
  error?: string;
}

/**
 * Hook to fetch ML win predictions for a list of matches
 * @param matchIds - Array of match IDs to fetch predictions for
 * @param puuid - Optional PUUID to filter predictions for specific player
 * @returns Object containing predictions map and loading/error states
 */
export function useMatchPredictions(matchIds: string[], puuid?: string) {
  // Only fetch if we have match IDs
  const shouldFetch = matchIds.length > 0;
  const matchIdsParam = matchIds.join(",");
  const puuidParam = puuid ? `&puuid=${puuid}` : "";
  const url = shouldFetch
    ? `/api/ml/predictions/by-matches?matchIds=${matchIdsParam}${puuidParam}`
    : null;

  const { data, error, isLoading } = useApiSWR<PredictionsResponse>(url);

  // Memoize the map to avoid recreating it on every render
  const predictionsMap = useMemo(() => {
    const map = new Map<string, number>();

    if (data?.success && data.data?.predictions) {
      for (const [matchId, preds] of Object.entries(data.data.predictions)) {
        if (puuid) {
          const playerPred = preds.find((p) => p.participantPUuid === puuid);
          if (playerPred) {
            map.set(matchId, playerPred.winProbability);
          }
        } else if (preds.length > 0) {
          map.set(matchId, preds[0].winProbability);
        }
      }
    }

    return map;
  }, [data, puuid]);

  return {
    predictions: predictionsMap,
    isLoading,
    error,
    noModel: data?.data?.noModel ?? false,
  };
}
