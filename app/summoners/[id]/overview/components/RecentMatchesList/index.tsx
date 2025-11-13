"use client";

import type { RecentMatchEntry } from "../RecentMatchesSection";
import { QUEUE_NAMES } from "@/constants/queues";
import { MatchEntry } from "./MatchEntry";

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
          />
        );
      })}
    </div>
  );
};

