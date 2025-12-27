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
  GanttChartIcon,
  SwordsIcon,
  CoinsIcon,
  EyeIcon,
  FlameIcon,
  TrophyIcon,
  XCircleIcon,
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
          <GanttChartIcon className="size-3.5" />
          {t("matchTimeline.view")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GanttChartIcon className="size-5" />
            {t("matchTimeline.title")}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !timeline ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("matchTimeline.noData")}
          </p>
        ) : (
          <div className="space-y-6">
            {/* Game Duration Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0:00</span>
                <span className="font-medium text-foreground">
                  {t("matchTimeline.duration")}: {formatDuration(timeline.gameDuration)}
                </span>
                <span>{formatDuration(timeline.gameDuration)}</span>
              </div>
              <div className="relative h-8 rounded-full bg-muted overflow-hidden">
                {/* Phase markers */}
                <div
                  className="absolute top-0 h-full bg-blue-500/20 border-r border-blue-500/40"
                  style={{
                    left: "0%",
                    width: `${(timeline.phases.early.end / (timeline.gameDuration / 60)) * 100}%`,
                  }}
                >
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-blue-400">
                    {t("matchTimeline.early")}
                  </span>
                </div>
                <div
                  className="absolute top-0 h-full bg-yellow-500/20 border-r border-yellow-500/40"
                  style={{
                    left: `${(timeline.phases.early.end / (timeline.gameDuration / 60)) * 100}%`,
                    width: `${((timeline.phases.mid.end - timeline.phases.mid.start) / (timeline.gameDuration / 60)) * 100}%`,
                  }}
                >
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-yellow-400">
                    {t("matchTimeline.mid")}
                  </span>
                </div>
                <div
                  className="absolute top-0 h-full bg-red-500/20"
                  style={{
                    left: `${(timeline.phases.mid.end / (timeline.gameDuration / 60)) * 100}%`,
                    width: `${((timeline.phases.late.end - timeline.phases.late.start) / (timeline.gameDuration / 60)) * 100}%`,
                  }}
                >
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] text-red-400">
                    {t("matchTimeline.late")}
                  </span>
                </div>
              </div>
            </div>

            {/* Team Stats Comparison */}
            <div className="grid grid-cols-2 gap-4">
              {/* Blue Team */}
              <TeamCard
                team={timeline.blueTeam}
                side="blue"
                resolveSlug={resolveSlug}
                resolveName={resolveName}
                championKeyToIdMap={championKeyToIdMap}
                highlightPuuid={puuid}
                t={t}
              />

              {/* Red Team */}
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

            {/* Stats Comparison Bars */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{t("matchTimeline.teamComparison")}</h4>

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
        )}
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
  const bgColor = side === "blue" ? "bg-blue-500/10" : "bg-red-500/10";
  const borderColor =
    side === "blue" ? "border-blue-500/30" : "border-red-500/30";
  const textColor = side === "blue" ? "text-blue-400" : "text-red-400";

  return (
    <div className={cn("rounded-lg border p-3 space-y-3", bgColor, borderColor)}>
      <div className="flex items-center justify-between">
        <span className={cn("text-sm font-semibold", textColor)}>
          {side === "blue" ? t("matchTimeline.blueTeam") : t("matchTimeline.redTeam")}
        </span>
        {team.won ? (
          <Badge className="gap-1 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            <TrophyIcon className="size-3" />
            {t("matchTimeline.victory")}
          </Badge>
        ) : (
          <Badge variant="destructive" className="gap-1">
            <XCircleIcon className="size-3" />
            {t("matchTimeline.defeat")}
          </Badge>
        )}
      </div>

      <div className="space-y-1.5">
        {team.participants.map((p) => {
          const slug = resolveSlug(p.championId);
          const name = resolveName(p.championId);
          const isHighlighted = highlightPuuid && p.puuid === highlightPuuid;

          return (
            <div
              key={p.participantId}
              className={cn(
                "flex items-center gap-2 rounded-md px-2 py-1 transition-colors",
                isHighlighted
                  ? "bg-primary/20 ring-1 ring-primary/40"
                  : "hover:bg-muted/50"
              )}
            >
              <ChampionIcon
                championId={slug}
                championKey={p.championId}
                championKeyToId={championKeyToIdMap}
                size={28}
                shape="circle"
                className="border border-border/50"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{name}</p>
                <p className="text-[10px] text-muted-foreground">
                  {p.kills}/{p.deaths}/{p.assists}
                </p>
              </div>
              <div className="text-right text-[10px] text-muted-foreground">
                <p>{formatGold(p.gold)} gold</p>
                <p>{formatGold(p.damage)} dmg</p>
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
  const redPercent = total > 0 ? (redValue / total) * 100 : 50;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-blue-400 font-medium">{format(blueValue)}</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          {icon}
          {label}
        </span>
        <span className="text-red-400 font-medium">{format(redValue)}</span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden bg-muted">
        <div
          className="bg-blue-500 transition-all"
          style={{ width: `${bluePercent}%` }}
        />
        <div
          className="bg-red-500 transition-all"
          style={{ width: `${redPercent}%` }}
        />
      </div>
    </div>
  );
}
