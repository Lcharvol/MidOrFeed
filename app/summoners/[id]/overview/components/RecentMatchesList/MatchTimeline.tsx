"use client";

import { useState } from "react";
import { ChampionIcon } from "@/components/ChampionIcon";
import { useApiSWR } from "@/lib/hooks/swr";
import { useChampions } from "@/lib/hooks/use-champions";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClockIcon,
  SwordsIcon,
  CoinsIcon,
  EyeIcon,
  FlameIcon,
  TrophyIcon,
  XCircleIcon,
  ActivityIcon,
} from "lucide-react";

interface MatchTimelineProps {
  matchId: string;
  puuid?: string;
}

interface ParticipantTimeline {
  participantId: number;
  championId: string;
  teamId: number;
  puuid: string | null;
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  damage: number;
  vision: number;
  items: number[];
  win: boolean;
  role: string | null;
}

interface TeamStats {
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  damage: number;
  vision: number;
}

interface TimelineData {
  matchId: string;
  gameDuration: number;
  gameMode: string;
  queueId: number;
  blueTeam: {
    participants: ParticipantTimeline[];
    stats: TeamStats;
    won: boolean;
  };
  redTeam: {
    participants: ParticipantTimeline[];
    stats: TeamStats;
    won: boolean;
  };
  phases: {
    early: { start: number; end: number; description: string };
    mid: { start: number; end: number; description: string };
    late: { start: number; end: number; description: string };
  };
}

interface TimelineResponse {
  success: boolean;
  data?: TimelineData;
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const formatGold = (gold: number) => {
  if (gold >= 1000) {
    return `${(gold / 1000).toFixed(1)}k`;
  }
  return gold.toString();
};

export function MatchTimeline({ matchId, puuid }: MatchTimelineProps) {
  const { t } = useI18n();
  const { resolveSlug, resolveName, championKeyToIdMap } = useChampions();
  const [isOpen, setIsOpen] = useState(false);

  const { data, isLoading } = useApiSWR<TimelineResponse>(
    isOpen ? `/api/matches/${matchId}/timeline` : null,
    { revalidateOnFocus: false }
  );

  const timeline = data?.data;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs">
          <ActivityIcon className="size-3.5" />
          {t("matchTimeline.view")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-auto p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <ActivityIcon className="size-5 text-primary" />
            </div>
            <div>
              <span className="text-lg">{t("matchTimeline.title")}</span>
              {timeline && (
                <p className="text-sm font-normal text-muted-foreground flex items-center gap-2 mt-0.5">
                  <ClockIcon className="size-3.5" />
                  {formatDuration(timeline.gameDuration)}
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 pt-4">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-48 w-full rounded-xl" />
                <Skeleton className="h-48 w-full rounded-xl" />
              </div>
              <Skeleton className="h-32 w-full rounded-xl" />
            </div>
          ) : !timeline ? (
            <div className="text-center py-12">
              <div className="bg-muted/50 rounded-full p-4 w-fit mx-auto mb-4">
                <ActivityIcon className="size-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {t("matchTimeline.noData")}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Game Phases Timeline */}
              <div className="bg-muted/30 rounded-xl p-4">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                  <span className="font-mono">0:00</span>
                  <span className="font-mono">{formatDuration(timeline.gameDuration)}</span>
                </div>
                <div className="relative h-10 rounded-xl bg-muted/50 overflow-hidden flex">
                  {/* Early Game */}
                  <div
                    className="relative flex items-center justify-center bg-gradient-to-r from-blue-500/30 to-blue-500/20 border-r border-blue-500/40"
                    style={{
                      width: `${(timeline.phases.early.end / (timeline.gameDuration / 60)) * 100}%`,
                    }}
                  >
                    <span className="text-[11px] font-medium text-blue-400">
                      {t("matchTimeline.early")}
                    </span>
                  </div>
                  {/* Mid Game */}
                  <div
                    className="relative flex items-center justify-center bg-gradient-to-r from-amber-500/30 to-amber-500/20 border-r border-amber-500/40"
                    style={{
                      width: `${((timeline.phases.mid.end - timeline.phases.mid.start) / (timeline.gameDuration / 60)) * 100}%`,
                    }}
                  >
                    <span className="text-[11px] font-medium text-amber-400">
                      {t("matchTimeline.mid")}
                    </span>
                  </div>
                  {/* Late Game */}
                  <div
                    className="relative flex items-center justify-center bg-gradient-to-r from-rose-500/30 to-rose-500/20"
                    style={{
                      width: `${((timeline.phases.late.end - timeline.phases.late.start) / (timeline.gameDuration / 60)) * 100}%`,
                    }}
                  >
                    <span className="text-[11px] font-medium text-rose-400">
                      {t("matchTimeline.late")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Teams */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <TeamCard
                  team={timeline.blueTeam}
                  side="blue"
                  resolveSlug={resolveSlug}
                  resolveName={resolveName}
                  championKeyToIdMap={championKeyToIdMap}
                  highlightPuuid={puuid}
                  t={t}
                />
                <TeamCard
                  team={timeline.redTeam}
                  side="red"
                  resolveSlug={resolveSlug}
                  resolveName={resolveName}
                  championKeyToIdMap={championKeyToIdMap}
                  highlightPuuid={puuid}
                  t={t}
                />
              </div>

              {/* Stats Comparison */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  <SwordsIcon className="size-4 text-muted-foreground" />
                  {t("matchTimeline.teamComparison")}
                </h4>

                <div className="space-y-3">
                  <StatCompareBar
                    label={t("matchTimeline.kills")}
                    icon={<SwordsIcon className="size-3.5" />}
                    blueValue={timeline.blueTeam.stats.kills}
                    redValue={timeline.redTeam.stats.kills}
                  />

                  <StatCompareBar
                    label={t("matchTimeline.gold")}
                    icon={<CoinsIcon className="size-3.5" />}
                    blueValue={timeline.blueTeam.stats.gold}
                    redValue={timeline.redTeam.stats.gold}
                    format={formatGold}
                  />

                  <StatCompareBar
                    label={t("matchTimeline.damage")}
                    icon={<FlameIcon className="size-3.5" />}
                    blueValue={timeline.blueTeam.stats.damage}
                    redValue={timeline.redTeam.stats.damage}
                    format={formatGold}
                  />

                  <StatCompareBar
                    label={t("matchTimeline.vision")}
                    icon={<EyeIcon className="size-3.5" />}
                    blueValue={timeline.blueTeam.stats.vision}
                    redValue={timeline.redTeam.stats.vision}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface TeamCardProps {
  team: TimelineData["blueTeam"];
  side: "blue" | "red";
  resolveSlug: (id: string) => string;
  resolveName: (id: string) => string;
  championKeyToIdMap: Map<string, string>;
  highlightPuuid?: string;
  t: (key: string) => string;
}

function TeamCard({
  team,
  side,
  resolveSlug,
  resolveName,
  championKeyToIdMap,
  highlightPuuid,
  t,
}: TeamCardProps) {
  const isBlue = side === "blue";

  return (
    <div
      className={cn(
        "rounded-xl border overflow-hidden",
        isBlue
          ? "bg-blue-500/5 border-blue-500/20"
          : "bg-rose-500/5 border-rose-500/20"
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-3",
          isBlue ? "bg-blue-500/10" : "bg-rose-500/10"
        )}
      >
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "size-2.5 rounded-full",
              isBlue ? "bg-blue-500" : "bg-rose-500"
            )}
          />
          <span
            className={cn(
              "text-sm font-semibold",
              isBlue ? "text-blue-400" : "text-rose-400"
            )}
          >
            {isBlue ? t("matchTimeline.blueTeam") : t("matchTimeline.redTeam")}
          </span>
        </div>
        {team.won ? (
          <Badge className="gap-1.5 bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/20">
            <TrophyIcon className="size-3" />
            {t("matchTimeline.victory")}
          </Badge>
        ) : (
          <Badge className="gap-1.5 bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/20">
            <XCircleIcon className="size-3" />
            {t("matchTimeline.defeat")}
          </Badge>
        )}
      </div>

      {/* Participants */}
      <div className="p-2 space-y-1">
        {team.participants.map((p) => {
          const slug = resolveSlug(p.championId);
          const name = resolveName(p.championId);
          const isHighlighted = highlightPuuid && p.puuid === highlightPuuid;
          const kda = p.deaths === 0 ? p.kills + p.assists : (p.kills + p.assists) / p.deaths;

          return (
            <div
              key={p.participantId}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                isHighlighted
                  ? "bg-primary/15 ring-1 ring-primary/30"
                  : "hover:bg-muted/50"
              )}
            >
              <ChampionIcon
                championId={slug}
                championKey={p.championId}
                championKeyToId={championKeyToIdMap}
                size={32}
                shape="circle"
                className={cn(
                  "border-2",
                  isBlue ? "border-blue-500/30" : "border-rose-500/30"
                )}
              />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {p.kills}/{p.deaths}/{p.assists}
                  </span>
                  <span className={cn(
                    "text-[10px]",
                    kda >= 4 ? "text-amber-500" :
                    kda >= 3 ? "text-green-500" :
                    kda >= 2 ? "text-blue-500" : ""
                  )}>
                    {kda.toFixed(1)} KDA
                  </span>
                </div>
              </div>

              <div className="text-right space-y-0.5">
                <p className="text-xs font-medium flex items-center gap-1 justify-end">
                  <CoinsIcon className="size-3 text-amber-500" />
                  {formatGold(p.gold)}
                </p>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                  <FlameIcon className="size-2.5" />
                  {formatGold(p.damage)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StatCompareBarProps {
  label: string;
  icon: React.ReactNode;
  blueValue: number;
  redValue: number;
  format?: (value: number) => string;
}

function StatCompareBar({
  label,
  icon,
  blueValue,
  redValue,
  format = String,
}: StatCompareBarProps) {
  const total = blueValue + redValue;
  const bluePercent = total > 0 ? (blueValue / total) * 100 : 50;
  const blueWins = blueValue > redValue;
  const redWins = redValue > blueValue;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span
          className={cn(
            "font-semibold tabular-nums",
            blueWins ? "text-blue-400" : "text-muted-foreground"
          )}
        >
          {format(blueValue)}
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          <span className="text-foreground font-medium">{label}</span>
        </span>
        <span
          className={cn(
            "font-semibold tabular-nums",
            redWins ? "text-rose-400" : "text-muted-foreground"
          )}
        >
          {format(redValue)}
        </span>
      </div>
      <div className="relative h-2.5 rounded-full overflow-hidden bg-muted/50">
        <div
          className={cn(
            "absolute left-0 top-0 h-full rounded-l-full transition-all duration-500",
            blueWins
              ? "bg-gradient-to-r from-blue-500 to-blue-400"
              : "bg-blue-500/60"
          )}
          style={{ width: `${bluePercent}%` }}
        />
        <div
          className={cn(
            "absolute right-0 top-0 h-full rounded-r-full transition-all duration-500",
            redWins
              ? "bg-gradient-to-l from-rose-500 to-rose-400"
              : "bg-rose-500/60"
          )}
          style={{ width: `${100 - bluePercent}%` }}
        />
        {/* Center divider */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-background/50 -translate-x-1/2" />
      </div>
    </div>
  );
}
