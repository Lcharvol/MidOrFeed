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
    <div className="flex flex-col gap-2.5">
      {matches.map((match, index) => {
        const championName =
          championNameMap.get(match.championId) ?? match.championId;
        const queueLabel =
          match.queueId !== null && match.queueId !== undefined
            ? QUEUE_NAMES[match.queueId] ?? `Queue ${match.queueId}`
            : "Unknown queue";

        // Get prediction for this match
        const winPrediction = predictions.get(match.matchId);

        return (
          <div
            key={match.id}
            className="animate-in fade-in-0 slide-in-from-bottom-2"
            style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
          >
            <MatchEntry
              match={match}
              championName={championName}
              queueLabel={queueLabel}
              championNameMap={championNameMap}
              championKeyToId={championKeyToId}
              resolveSlug={resolveSlug}
              puuid={puuid}
              winPrediction={winPrediction}
            />
          </div>
        );
      })}
    </div>
  );
};

