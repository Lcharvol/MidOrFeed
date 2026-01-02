"use client";

import Link from "next/link";
import { ChampionIcon } from "@/components/ChampionIcon";
import { ItemIcon } from "@/components/ItemIcon";
import { SpellIcon } from "@/components/SpellIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n-context";
import type { RecentMatchEntry } from "../RecentMatchesSection";
import { MatchParticipants } from "./MatchParticipants";
import { WinPredictionBadge } from "./WinPredictionBadge";
import { BuildAnalysisBadge } from "./BuildAnalysisBadge";
import { MatchTimeline } from "./MatchTimeline";
import { SparklesIcon, SwordsIcon, EyeIcon, CoinsIcon } from "lucide-react";
import {
  TEAM_STYLES,
  MATCH_RESULT_STYLES,
  KDA_STYLES,
  getKdaLevel,
} from "@/lib/styles/game-colors";

// KDA color based on ratio
const getKdaColor = (ratio: number) => {
  const level = getKdaLevel(ratio);
  const style = KDA_STYLES[level];
  if (level === "excellent") return `${style.text} font-bold`;
  if (level === "veryGood" || level === "good") return `${style.text} font-semibold`;
  return style.text;
};

interface MatchEntryProps {
  match: RecentMatchEntry;
  championName: string;
  queueLabel: string;
  championNameMap: Map<string, string>;
  championKeyToId: Map<string, string>;
  resolveSlug: (idOrKey: string) => string;
  puuid?: string;
  winPrediction?: number;
}

const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds.toString().padStart(2, "0")}s`;
};

const formatDate = (timestamp: string | number, t: (key: string) => string) => {
  const date = new Date(Number(timestamp));
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return t("summoners.today");
  if (diffDays === 1) return t("summoners.yesterday");
  return t("summoners.daysAgo").replace("{count}", diffDays.toString());
};

export const MatchEntry = ({
  match,
  championName,
  queueLabel,
  championNameMap,
  championKeyToId,
  resolveSlug,
  puuid,
  winPrediction,
}: MatchEntryProps) => {
  const { t } = useI18n();
  const kdaLabel = `${match.kills}/${match.deaths}/${match.assists}`;
  const kdaRatio =
    match.deaths === 0
      ? match.kills + match.assists
      : (match.kills + match.assists) / match.deaths;

  // Calculer P/Kill
  const totalKills = match.kills + match.assists;
  const totalTeamKills = match.kills + match.assists + match.deaths;
  const pkill =
    totalTeamKills > 0 ? Math.round((totalKills / totalTeamKills) * 100) : 0;

  // Extraire les items (6 slots + trinket)
  const mainItems = match.items?.slice(0, 6) ?? [];
  const trinket = match.items?.[6] ?? null;

  return (
    <div
      className={cn(
        "group flex flex-col md:flex-row md:justify-between relative overflow-hidden rounded-xl border",
        match.win
          ? cn(MATCH_RESULT_STYLES.victory.border, MATCH_RESULT_STYLES.victory.bgSubtle)
          : cn(MATCH_RESULT_STYLES.defeat.border, MATCH_RESULT_STYLES.defeat.bgSubtle)
      )}
    >
      {/* Left accent bar */}
      <div
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
          match.win ? MATCH_RESULT_STYLES.victory.accent : MATCH_RESULT_STYLES.defeat.accent
        )}
      />

      <div className="flex-1 min-w-0 pl-3">
        {/* Header badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 pt-2.5 pb-1.5 flex-wrap">
          <Badge
            variant={match.win ? "info" : "destructive"}
            className="text-[10px] sm:text-xs font-semibold shadow-sm"
          >
            {match.win ? t("matches.victory") : t("matches.defeat")}
          </Badge>
          <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
            {formatDuration(match.gameDuration)}
          </span>
          <span className="text-muted-foreground/50 hidden sm:inline">•</span>
          <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">
            {queueLabel}
          </span>
          <span className="text-muted-foreground/50 hidden sm:inline">•</span>
          <span className="text-[10px] sm:text-xs text-muted-foreground">
            {formatDate(match.gameCreation, t)}
          </span>
          {winPrediction !== undefined && (
            <WinPredictionBadge winProbability={winPrediction} className="hidden sm:inline-flex" />
          )}
        </div>

        {/* Main content */}
        <div className="flex items-start gap-3 sm:gap-4 px-2 sm:px-3 pb-2 sm:pb-2.5">
          {/* Left: Champion + Spells */}
          <div className="flex items-start gap-2 shrink-0">
            {/* Champion Icon with ring */}
            <div className="relative">
              <div className={cn(
                "absolute -inset-0.5 rounded-full opacity-60",
                match.win ? TEAM_STYLES.blue.bgSubtle : TEAM_STYLES.red.bgSubtle
              )} />
              <ChampionIcon
                championId={match.championSlug}
                championKey={match.championKey ?? match.championId}
                championKeyToId={championKeyToId}
                size={52}
                shape="circle"
                className={cn(
                  "relative border-2 sm:size-14",
                  match.win ? TEAM_STYLES.blue.border : TEAM_STYLES.red.border
                )}
              />
            </div>

            {/* Summoner Spells (vertical stack) */}
            <div className="flex flex-col gap-0.5 pt-1">
              {match.summoner1Id && (
                <SpellIcon
                  spellId={match.summoner1Id}
                  alt="Summoner Spell 1"
                  size={22}
                  shape="rounded"
                  showBorder
                  className="shadow-sm"
                />
              )}
              {match.summoner2Id && (
                <SpellIcon
                  spellId={match.summoner2Id}
                  alt="Summoner Spell 2"
                  size={22}
                  shape="rounded"
                  showBorder
                  className="shadow-sm"
                />
              )}
            </div>
          </div>

          {/* Center: Stats */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Champion name + KDA */}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="font-bold text-foreground text-sm sm:text-base">
                {championName}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold">
                  <span className="text-foreground">{match.kills}</span>
                  <span className="text-muted-foreground/60"> / </span>
                  <span className="text-danger-muted-foreground">{match.deaths}</span>
                  <span className="text-muted-foreground/60"> / </span>
                  <span className="text-foreground">{match.assists}</span>
                </span>
                <span className={cn("text-xs", getKdaColor(kdaRatio))}>
                  {kdaRatio.toFixed(2)} KDA
                </span>
              </div>
            </div>

            {/* Stats row with icons */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <SwordsIcon className="size-3 opacity-60" />
                <span>P/Kill {pkill}%</span>
              </div>
              {match.visionScore !== undefined && match.visionScore > 0 && (
                <div className="flex items-center gap-1">
                  <EyeIcon className="size-3 opacity-60" />
                  <span>{match.visionScore}</span>
                </div>
              )}
              {match.goldEarned !== undefined && match.goldEarned > 0 && (
                <div className="flex items-center gap-1">
                  <CoinsIcon className="size-3 opacity-60" />
                  <span>{(match.goldEarned / 1000).toFixed(1)}k</span>
                </div>
              )}
            </div>

            {/* Items row */}
            <div className="flex items-center gap-1 mt-1.5 flex-wrap">
              <div className="flex items-center gap-0.5 p-1 rounded-lg bg-background/50 border border-border/30">
                {Array.from({ length: 6 }, (_, index) => {
                  const itemId = mainItems[index] ?? null;
                  if (!itemId) {
                    return (
                      <div
                        key={index}
                        className="relative size-6 sm:size-7 rounded bg-muted/30"
                      />
                    );
                  }
                  return (
                    <ItemIcon
                      key={index}
                      itemId={itemId}
                      alt={itemId ? `Item ${itemId}` : "Item"}
                      size={24}
                      shape="rounded"
                      showBorder={false}
                      className="hover:scale-110 transition-transform sm:size-7"
                    />
                  );
                })}
                {/* Trinket separator */}
                {trinket && (
                  <>
                    <div className="w-px h-5 bg-border/50 mx-0.5 hidden sm:block" />
                    <ItemIcon
                      itemId={trinket}
                      alt="Trinket"
                      size={24}
                      shape="rounded"
                      showBorder={false}
                      className="hidden sm:block opacity-80"
                    />
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-1 ml-1">
                {mainItems.length > 0 && (
                  <BuildAnalysisBadge
                    championId={match.championId}
                    items={mainItems.filter((i): i is number => i !== null)}
                    queueId={match.queueId ?? undefined}
                    className="hidden sm:inline-flex"
                  />
                )}
                <div className="hidden sm:block">
                  <MatchTimeline matchId={match.matchId} puuid={puuid} />
                </div>
                {puuid && (
                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-7 gap-1.5 text-xs px-2.5 transition-colors",
                      "bg-background/80 hover:bg-primary hover:text-primary-foreground",
                      "border-border/50"
                    )}
                  >
                    <Link href={`/ai-analysis/${match.matchId}?puuid=${puuid}`}>
                      <SparklesIcon className="size-3.5" />
                      <span className="hidden sm:inline">{t("summoners.analyze")}</span>
                      <span className="sm:hidden">IA</span>
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Match participants - hidden on mobile */}
      {match.participants &&
        match.participants.length > 0 &&
        match.teamId !== undefined && (
          <div className="hidden lg:flex items-center shrink-0 pr-4 border-l border-border/30 ml-2">
            <MatchParticipants
              participants={match.participants}
              teamId={match.teamId}
              championNameMap={championNameMap}
              championKeyToId={championKeyToId}
              resolveSlug={resolveSlug}
              puuid={puuid}
            />
          </div>
        )}
    </div>
  );
};
