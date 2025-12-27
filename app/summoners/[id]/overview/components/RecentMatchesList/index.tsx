"use client";

import { useMemo } from "react";
import type { RecentMatchEntry } from "../RecentMatchesSection";
import { QUEUE_NAMES } from "@/constants/queues";
import { MatchEntry } from "./MatchEntry";
import { useMatchPredictions } from "@/lib/hooks/use-match-predictions";

interface RecentMatchesListProps {
  matches: RecentMatchEntry[];
  championNameMap: Map<string, string>;
  championKeyToId: Map<string, string>;
  resolveSlug: (idOrKey: string) => string;
  puuid?: string;
}

export const RecentMatchesList = ({
  matches,
  championNameMap,
  championKeyToId,
  resolveSlug,
  puuid,
}: RecentMatchesListProps) => {
  // Extract match IDs for prediction fetching
  const matchIds = useMemo(
    () => matches.map((m) => m.matchId),
    [matches]
  );

  // Fetch ML predictions for all matches
  const { predictions } = useMatchPredictions(matchIds, puuid);

  if (matches.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {matches.map((match) => {
        const championName =
          championNameMap.get(match.championId) ?? match.championId;
        const queueLabel =
          match.queueId !== null && match.queueId !== undefined
            ? QUEUE_NAMES[match.queueId] ?? `Queue ${match.queueId}`
            : "File inconnue";

        // Get prediction for this match
        const winPrediction = predictions.get(match.matchId);

        return (
          <MatchEntry
            key={match.id}
            match={match}
            championName={championName}
            queueLabel={queueLabel}
            championNameMap={championNameMap}
            championKeyToId={championKeyToId}
            resolveSlug={resolveSlug}
            puuid={puuid}
            winPrediction={winPrediction}
          />
        );
      })}
    </div>
  );
};

