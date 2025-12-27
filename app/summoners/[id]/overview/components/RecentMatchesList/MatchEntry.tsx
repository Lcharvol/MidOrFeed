"use client";

import Link from "next/link";
import { ChampionIcon } from "@/components/ChampionIcon";
import { ItemIcon } from "@/components/ItemIcon";
import { SpellIcon } from "@/components/SpellIcon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RecentMatchEntry } from "../RecentMatchesSection";
import { MatchParticipants } from "./MatchParticipants";
import { WinPredictionBadge } from "./WinPredictionBadge";
import { BuildAnalysisBadge } from "./BuildAnalysisBadge";
import { SparklesIcon } from "lucide-react";

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

const formatDate = (timestamp: string | number) => {
  const date = new Date(Number(timestamp));
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  return `il y a ${diffDays} jours`;
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
        "flex justify-between relative overflow-hidden rounded-lg border transition-all hover:shadow-md",
        match.win
          ? "border-blue-500/30 bg-blue-500/5"
          : "border-rose-500/30 bg-rose-500/5"
      )}
    >
      <div>
        <div className="flex items-center gap-2 px-3 pt-2 pb-1">
          <Badge variant={match.win ? "default" : "destructive"}>
            {match.win ? "Victoire" : "Défaite"} ·{" "}
            {formatDuration(match.gameDuration)}
          </Badge>
          <Badge
            variant="outline"
            className="h-5 px-2 text-[10px] font-medium bg-background/50 border-border/50"
          >
            {queueLabel} · {formatDate(match.gameCreation)}
          </Badge>
          {winPrediction !== undefined && (
            <WinPredictionBadge winProbability={winPrediction} />
          )}
        </div>

        {/* Main content */}
        <div className="flex items-start gap-3 px-3 pb-3">
          {/* Left: Champion + Spells + Runes */}
          <div className="flex items-start gap-2 shrink-0">
            {/* Champion Icon (circular) */}
            <div className="relative">
              <ChampionIcon
                championId={match.championSlug}
                championKey={match.championKey ?? match.championId}
                championKeyToId={championKeyToId}
                size={56}
                shape="circle"
                className="border-2 border-border/60"
              />
              {/* Champion Level - placeholder */}
              <div className="absolute -bottom-1 -right-1 size-5 rounded-full bg-background border-2 border-border flex items-center justify-center text-[10px] font-bold text-foreground">
                {/* TODO: Ajouter le niveau du champion si disponible */}
              </div>
            </div>

            {/* Spells et Runes (vertical stack) */}
            <div className="flex flex-col gap-1 pt-0.5">
              {/* Summoner Spells */}
              <div className="flex flex-col gap-0.5">
                {match.summoner1Id && (
                  <SpellIcon
                    spellId={match.summoner1Id}
                    alt="Summoner Spell 1"
                    size={20}
                    shape="rounded"
                    showBorder
                  />
                )}
                {match.summoner2Id && (
                  <SpellIcon
                    spellId={match.summoner2Id}
                    alt="Summoner Spell 2"
                    size={20}
                    shape="rounded"
                    showBorder
                  />
                )}
              </div>

              {/* Runes - placeholder */}
              <div className="flex flex-col gap-0.5 pt-1">
                <div className="relative size-4 rounded-full border border-border/30 bg-background/40 opacity-50" />
                <div className="relative size-3 rounded-full border border-border/30 bg-background/40 opacity-50" />
              </div>
            </div>
          </div>

          {/* Center: Stats */}
          <div className="flex-1 min-w-0 space-y-1">
            {/* Champion name + KDA */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground text-sm">
                {championName}
              </span>
              <span className="text-xs text-muted-foreground">{kdaLabel}</span>
              <span className="text-xs text-muted-foreground">
                {kdaRatio.toFixed(2)}:1 KDA
              </span>
            </div>

            {/* P/Kill + CS + Vision + Gold */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              <span>P/Kill: {pkill}%</span>
              {match.visionScore !== undefined && match.visionScore > 0 && (
                <>
                  <span>·</span>
                  <span>Vision: {match.visionScore}</span>
                </>
              )}
              {match.goldEarned !== undefined && match.goldEarned > 0 && (
                <>
                  <span>·</span>
                  <span>Or: {Math.round(match.goldEarned / 1000)}k</span>
                </>
              )}
            </div>

            {/* Items row */}
            <div className="flex items-center gap-1 mt-1">
              {Array.from({ length: 6 }, (_, index) => {
                const itemId = mainItems[index] ?? null;
                if (!itemId) {
                  return (
                    <div
                      key={index}
                      className="relative size-7 rounded border border-border/30 bg-background/30"
                    />
                  );
                }
                return (
                  <ItemIcon
                    key={index}
                    itemId={itemId}
                    alt={itemId ? `Item ${itemId}` : "Item"}
                    size={28}
                    shape="rounded"
                    showBorder
                    className="hover:border-primary/50 transition-colors"
                  />
                );
              })}
              {/* Trinket */}
              {trinket && (
                <ItemIcon
                  itemId={trinket}
                  alt="Trinket"
                  size={24}
                  shape="rounded"
                  showBorder
                  className="ml-0.5"
                />
              )}
              {/* Build Analysis Badge */}
              {mainItems.length > 0 && (
                <BuildAnalysisBadge
                  championId={match.championId}
                  items={mainItems.filter((i): i is number => i !== null)}
                  queueId={match.queueId ?? undefined}
                  className="ml-1"
                />
              )}
              {/* AI Analysis Button */}
              {puuid && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="ml-2 h-7 gap-1.5 text-xs"
                >
                  <Link href={`/ai-analysis/${match.matchId}?puuid=${puuid}`}>
                    <SparklesIcon className="size-3.5" />
                    Analyser
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* Match participants */}
      {match.participants &&
        match.participants.length > 0 &&
        match.teamId !== undefined && (
          <MatchParticipants
            participants={match.participants}
            teamId={match.teamId}
            championNameMap={championNameMap}
            championKeyToId={championKeyToId}
            resolveSlug={resolveSlug}
            puuid={puuid}
          />
        )}
    </div>
  );
};
