"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton, SkeletonAvatar } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ChampionIcon";
import { Badge } from "@/components/ui/badge";
import { TrophyIcon, GemIcon, LayersIcon, MedalIcon, AwardIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useApiSWR } from "@/lib/hooks/swr";
import { useChampions } from "@/lib/hooks/use-champions";
import { cn } from "@/lib/utils";
import { MASTERY_STYLES } from "@/lib/styles/game-colors";
import { useI18n } from "@/lib/i18n-context";

interface ChampionMasterySectionProps {
  puuid: string;
  region: string | null;
}

type MasteryEntry = {
  championId: number;
  level: number;
  points: number;
  lastPlayed: string;
  chestGranted: boolean;
  tokensEarned: number;
};

type PoolDepth = {
  totalChampions: number;
  byLevel: Record<number, number>;
  totalPoints: number;
};

type MasteryResponse = {
  success: boolean;
  data: {
    totalScore: number;
    topMasteries: MasteryEntry[];
    poolDepth?: PoolDepth;
  };
};

// Helper to get mastery badge style
const getMasteryBadgeStyle = (level: number) => {
  const style = MASTERY_STYLES[level] || MASTERY_STYLES[1];
  return cn(style.bg, style.text, style.border);
};

const formatPoints = (points: number): string => {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  }
  if (points >= 1000) {
    return `${Math.floor(points / 1000)}K`;
  }
  return points.toString();
};

export function ChampionMasterySection({ puuid, region }: ChampionMasterySectionProps) {
  const { t } = useI18n();
  const { resolveName, championKeyToIdMap } = useChampions();

  const { data, isLoading } = useApiSWR<MasteryResponse>(
    puuid && region ? `/api/summoners/${puuid}/mastery?region=${region}&all=true` : null,
    { revalidateOnFocus: false }
  );

  const masteries = useMemo(() => {
    if (!data?.data?.topMasteries) return [];
    return data.data.topMasteries;
  }, [data]);

  if (isLoading) {
    return (
      <Card className="border-border/70 bg-background/90 shadow-sm">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2 rounded-lg border border-border/50 p-3">
                <SkeletonAvatar size="lg" />
                <Skeleton className="h-3.5 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
          <Skeleton className="h-16 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!masteries.length) {
    return null;
  }

  const totalScore = data?.data?.totalScore || 0;
  const poolDepth = data?.data?.poolDepth;
  const topThree = masteries.slice(0, 3);
  const others = masteries.slice(3, 6);

  return (
    <Card className="border-border/70 bg-background/90 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <TrophyIcon className="size-4 text-warning-muted-foreground" />
            {t("summoners.mastery.title")}
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {totalScore.toLocaleString()} pts
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Podium — top 3 champions */}
        {topThree.length >= 3 ? (
          <div className="grid grid-cols-3 items-end gap-2">
            {[1, 0, 2].map((podiumIndex) => {
              const mastery = topThree[podiumIndex];
              const championSlug = championKeyToIdMap.get(String(mastery.championId)) || String(mastery.championId);
              const championName = resolveName(String(mastery.championId));
              const badgeStyle = getMasteryBadgeStyle(mastery.level);
              const isFirst = podiumIndex === 0;
              const isSecond = podiumIndex === 1;

              const podiumIcon = isFirst
                ? <TrophyIcon className="size-4" />
                : isSecond
                  ? <MedalIcon className="size-3.5" />
                  : <AwardIcon className="size-3.5" />;

              const podiumIconBg = isFirst
                ? "bg-warning/15 text-warning"
                : isSecond
                  ? "bg-muted text-muted-foreground"
                  : "bg-amber-500/10 text-amber-700 dark:text-amber-500";

              const ringClass = isFirst
                ? "ring-2 ring-warning/40"
                : isSecond
                  ? "ring-1 ring-muted-foreground/30"
                  : "ring-1 ring-amber-600/30";

              const iconSize = isFirst ? 56 : 44;

              return (
                <div
                  key={mastery.championId}
                  className={cn(
                    "relative flex flex-col items-center rounded-xl border border-border/60 bg-muted/20 p-2.5",
                    isFirst && "pt-3 pb-3 border-warning/30 bg-warning/[0.04]",
                    isSecond && "mb-2",
                    !isFirst && !isSecond && "mb-2"
                  )}
                >
                  {/* Rank icon */}
                  <div className={cn("mb-2 flex size-6 items-center justify-center rounded-full", podiumIconBg)}>
                    {podiumIcon}
                  </div>

                  {/* Champion icon */}
                  <div className="relative">
                    <ChampionIcon
                      championId={championSlug}
                      size={iconSize}
                      className={cn("rounded-xl border border-border/40", ringClass)}
                    />
                    {mastery.chestGranted && (
                      <div className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-warning">
                        <GemIcon className="size-2.5 text-warning-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <span className={cn(
                    "mt-2 text-center font-medium text-foreground line-clamp-1",
                    isFirst ? "text-xs" : "text-[11px]"
                  )}>
                    {championName}
                  </span>

                  {/* Mastery badge + points */}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Badge
                      variant="outline"
                      className={cn("h-4 px-1.5 text-[9px] font-semibold", badgeStyle)}
                    >
                      M{mastery.level}
                    </Badge>
                    <span className={cn("text-muted-foreground", isFirst ? "text-[11px] font-medium" : "text-[10px]")}>
                      {formatPoints(mastery.points)}
                    </span>
                  </div>

                  {/* Tokens indicator */}
                  {mastery.tokensEarned > 0 && mastery.level >= 5 && mastery.level < 7 && (
                    <div className="mt-1 flex gap-0.5">
                      {Array.from({ length: mastery.level === 5 ? 2 : 3 }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "size-1.5 rounded-full",
                            i < mastery.tokensEarned
                              ? mastery.level === 5 ? "bg-danger" : "bg-warning"
                              : "bg-muted-foreground/30"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* Fallback for < 3 champions */
          <div className="grid grid-cols-3 gap-2">
            {topThree.map((mastery) => {
              const championSlug = championKeyToIdMap.get(String(mastery.championId)) || String(mastery.championId);
              const championName = resolveName(String(mastery.championId));
              const badgeStyle = getMasteryBadgeStyle(mastery.level);
              return (
                <div
                  key={mastery.championId}
                  className="relative flex flex-col items-center rounded-lg border border-border/60 bg-muted/20 p-2"
                >
                  <ChampionIcon championId={championSlug} size={48} className="rounded-lg border border-border/40" />
                  <span className="mt-1.5 text-center text-[11px] font-medium text-foreground line-clamp-1">{championName}</span>
                  <div className="mt-1 flex items-center gap-1.5">
                    <Badge variant="outline" className={cn("h-4 px-1.5 text-[9px] font-semibold", badgeStyle)}>M{mastery.level}</Badge>
                    <span className="text-[10px] text-muted-foreground">{formatPoints(mastery.points)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Other champions - compact list */}
        {others.length > 0 && (
          <div className="rounded-lg border border-border/60 bg-muted/10">
            <div className="divide-y divide-border/40">
              {others.map((mastery) => {
                const championSlug = championKeyToIdMap.get(String(mastery.championId)) || String(mastery.championId);
                const championName = resolveName(String(mastery.championId));
                const badgeStyle = getMasteryBadgeStyle(mastery.level);

                return (
                  <div
                    key={mastery.championId}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <div className="relative">
                      <ChampionIcon
                        championId={championSlug}
                        size={32}
                        className="rounded-md border border-border/40"
                      />
                      {mastery.chestGranted && (
                        <div className="absolute -bottom-0.5 -right-0.5 flex size-3 items-center justify-center rounded-full bg-warning">
                          <GemIcon className="size-2 text-warning-foreground" />
                        </div>
                      )}
                    </div>

                    <span className="flex-1 text-xs font-medium text-foreground">
                      {championName}
                    </span>

                    <Badge
                      variant="outline"
                      className={cn("h-4 px-1.5 text-[9px] font-semibold", badgeStyle)}
                    >
                      M{mastery.level}
                    </Badge>

                    <span className="w-12 text-right text-[11px] text-muted-foreground">
                      {formatPoints(mastery.points)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Pool Depth */}
        {poolDepth && (
          <div className="rounded-lg border border-border/60 bg-muted/10 p-3 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <LayersIcon className="size-3.5 text-muted-foreground" />
              {t("summoners.mastery.championPool")}
            </div>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div>
                <p className="text-lg font-bold text-foreground">{poolDepth.totalChampions}</p>
                <p className="text-[10px] text-muted-foreground">{t("summoners.mastery.championsPlayed")}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">{formatPoints(poolDepth.totalPoints)}</p>
                <p className="text-[10px] text-muted-foreground">{t("summoners.mastery.totalPoints")}</p>
              </div>
            </div>
            <div className="space-y-1.5">
              {[7, 6, 5, 4].map((level) => {
                const count = poolDepth.byLevel[level] || 0;
                if (count === 0) return null;
                const pct = Math.round((count / poolDepth.totalChampions) * 100);
                return (
                  <div key={level} className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn(
                        "h-4 w-8 justify-center px-1 text-[9px] font-semibold shrink-0",
                        getMasteryBadgeStyle(level)
                      )}
                    >
                      M{level}+
                    </Badge>
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground w-6 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
