"use client";

import { ChampionIcon } from "@/components/ChampionIcon";
import { cn } from "@/lib/utils";
import type { MatchParticipant } from "../RecentMatchesSection";

interface MatchParticipantsProps {
  participants: MatchParticipant[];
  teamId: number;
  championNameMap: Map<string, string>;
  championKeyToId: Map<string, string>;
  resolveSlug: (idOrKey: string) => string;
  puuid?: string;
}

export const MatchParticipants = ({
  participants,
  teamId,
  championNameMap,
  championKeyToId,
  resolveSlug,
  puuid,
}: MatchParticipantsProps) => {
  if (!participants || participants.length === 0) {
    return null;
  }

  const allies = participants.filter((p) => p.teamId === teamId);
  const enemies = participants.filter((p) => p.teamId !== teamId);

  if (allies.length === 0 && enemies.length === 0) {
    return null;
  }

  return (
    <div className="flex items-start gap-3 shrink-0 my-auto">
      {/* Allies */}
      <div className="flex flex-col gap-0.5 min-w-[120px]">
        {allies.map((participant) => {
          const participantChampionName =
            championNameMap.get(participant.championId) ??
            participant.championId;
          const participantChampionSlug = resolveSlug(participant.championId);
          const isCurrentPlayer = participant.participantPUuid === puuid;
          return (
            <div
              key={participant.participantId}
              className={cn(
                "flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs",
                isCurrentPlayer && "bg-primary/10 border border-primary/20"
              )}
            >
              <ChampionIcon
                championId={participantChampionSlug}
                championKey={participant.championId}
                championKeyToId={championKeyToId}
                size={16}
                shape="circle"
                className="border border-border/50"
                clickable
              />
              <span className="truncate text-[11px] text-muted-foreground">
                {participantChampionName}
              </span>
            </div>
          );
        })}
      </div>

      {/* Enemies */}
      <div className="flex flex-col gap-0.5 min-w-[120px]">
        {enemies.map((participant) => {
          const participantChampionName =
            championNameMap.get(participant.championId) ??
            participant.championId;
          const participantChampionSlug = resolveSlug(participant.championId);
          return (
            <div
              key={participant.participantId}
              className="flex items-center gap-1.5 px-1.5 py-0.5 rounded text-xs"
            >
              <ChampionIcon
                championId={participantChampionSlug}
                championKey={participant.championId}
                championKeyToId={championKeyToId}
                size={16}
                shape="circle"
                className="border border-border/50"
                clickable
              />
              <span className="truncate text-[11px] text-muted-foreground">
                {participantChampionName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
