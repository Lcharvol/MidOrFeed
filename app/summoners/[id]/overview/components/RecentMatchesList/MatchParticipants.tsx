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

  const TeamColumn = ({
    team,
    isAlly,
  }: {
    team: MatchParticipant[];
    isAlly: boolean;
  }) => (
    <div className="flex flex-col gap-0.5">
      {team.map((participant) => {
        const participantChampionName =
          championNameMap.get(participant.championId) ?? participant.championId;
        const participantChampionSlug = resolveSlug(participant.championId);
        const isCurrentPlayer = participant.participantPUuid === puuid;

        return (
          <div
            key={participant.participantId}
            className={cn(
              "flex items-center gap-1.5 px-1.5 py-0.5 rounded-md transition-colors",
              "hover:bg-muted/50",
              isCurrentPlayer && "bg-primary/15 ring-1 ring-primary/30"
            )}
          >
            <div className="relative">
              <ChampionIcon
                championId={participantChampionSlug}
                championKey={participant.championId}
                championKeyToId={championKeyToId}
                size={18}
                shape="circle"
                className={cn(
                  "border",
                  isAlly ? "border-blue-500/40" : "border-rose-500/40"
                )}
                clickable
              />
              {isCurrentPlayer && (
                <div className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full bg-primary border border-background" />
              )}
            </div>
            <span
              className={cn(
                "truncate text-[11px] max-w-[80px]",
                isCurrentPlayer
                  ? "text-foreground font-medium"
                  : "text-muted-foreground"
              )}
            >
              {participantChampionName}
            </span>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="flex items-start gap-3 py-2 px-2">
      {/* Allies */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 px-1.5">
          <div className="size-1.5 rounded-full bg-blue-500" />
          <span className="text-[9px] font-medium text-blue-500/80 uppercase tracking-wide">
            Allies
          </span>
        </div>
        <TeamColumn team={allies} isAlly={true} />
      </div>

      {/* Separator */}
      <div className="w-px h-full min-h-[100px] bg-gradient-to-b from-transparent via-border/50 to-transparent" />

      {/* Enemies */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 px-1.5">
          <div className="size-1.5 rounded-full bg-rose-500" />
          <span className="text-[9px] font-medium text-rose-500/80 uppercase tracking-wide">
            Enemies
          </span>
        </div>
        <TeamColumn team={enemies} isAlly={false} />
      </div>
    </div>
  );
};
