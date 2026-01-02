"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ChampionIcon";
import { Badge } from "@/components/ui/badge";
import { TrophyIcon, GemIcon } from "lucide-react";
import { useApiSWR } from "@/lib/hooks/swr";
import { useChampions } from "@/lib/hooks/use-champions";
import { cn } from "@/lib/utils";
import { MASTERY_STYLES } from "@/lib/styles/game-colors";

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

type MasteryResponse = {
  success: boolean;
  data: {
    totalScore: number;
    topMasteries: MasteryEntry[];
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
  const { resolveName, championKeyToIdMap } = useChampions();

  const { data, isLoading } = useApiSWR<MasteryResponse>(
    puuid && region ? `/api/summoners/${puuid}/mastery?region=${region}&count=6` : null,
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
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 flex-1 rounded-lg" />
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
  const topThree = masteries.slice(0, 3);
  const others = masteries.slice(3);

  return (
    <Card className="border-border/70 bg-background/90 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <TrophyIcon className="size-4 text-warning-muted-foreground" />
            Maitrises
          </CardTitle>
          <span className="text-xs text-muted-foreground">
            {totalScore.toLocaleString()} pts
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Top 3 champions */}
        <div className="grid grid-cols-3 gap-2">
          {topThree.map((mastery, index) => {
            const championSlug = championKeyToIdMap.get(String(mastery.championId)) || String(mastery.championId);
            const championName = resolveName(String(mastery.championId));
            const badgeStyle = getMasteryBadgeStyle(mastery.level);

            return (
              <div
                key={mastery.championId}
                className="relative flex flex-col items-center rounded-lg border border-border/60 bg-muted/20 p-2"
              >
                {/* Rank indicator */}
                {index === 0 && (
                  <div className="absolute -top-1.5 -left-1.5 flex size-5 items-center justify-center rounded-full bg-warning text-[10px] font-bold text-warning-foreground shadow-sm">
                    1
                  </div>
                )}

                <div className="relative">
                  <ChampionIcon
                    championId={championSlug}
                    size={48}
                    className="rounded-lg border border-border/40"
                  />
                  {mastery.chestGranted && (
                    <div className="absolute -bottom-1 -right-1 flex size-4 items-center justify-center rounded-full bg-warning">
                      <GemIcon className="size-2.5 text-warning-foreground" />
                    </div>
                  )}
                </div>

                <span className="mt-1.5 text-center text-[11px] font-medium text-foreground line-clamp-1">
                  {championName}
                </span>

                <div className="mt-1 flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={cn("h-4 px-1.5 text-[9px] font-semibold", badgeStyle)}
                  >
                    M{mastery.level}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
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
      </CardContent>
    </Card>
  );
}
