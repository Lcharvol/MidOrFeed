"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ChampionIcon";
import { Badge } from "@/components/ui/badge";
import { TrophyIcon, SparklesIcon } from "lucide-react";
import { useApiSWR } from "@/lib/hooks/swr";
import { useChampions } from "@/lib/hooks/use-champions";
import { cn } from "@/lib/utils";

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

const MASTERY_COLORS: Record<number, string> = {
  7: "from-amber-400 to-amber-600",
  6: "from-fuchsia-400 to-fuchsia-600",
  5: "from-red-400 to-red-600",
  4: "from-gray-400 to-gray-600",
  3: "from-emerald-400 to-emerald-600",
  2: "from-sky-400 to-sky-600",
  1: "from-slate-400 to-slate-600",
};

const formatPoints = (points: number): string => {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(0)}K`;
  }
  return points.toString();
};

export function ChampionMasterySection({ puuid, region }: ChampionMasterySectionProps) {
  const { resolveSlug, resolveName, championKeyToIdMap } = useChampions();

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
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!masteries.length) {
    return null;
  }

  const totalScore = data?.data?.totalScore || 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrophyIcon className="size-4 text-amber-500" />
            Maitrises
          </span>
          <Badge variant="secondary" className="font-normal">
            {totalScore.toLocaleString()} pts
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {masteries.map((mastery, index) => {
            const championSlug = championKeyToIdMap.get(String(mastery.championId)) || String(mastery.championId);
            const championName = resolveName(String(mastery.championId));
            const gradientClass = MASTERY_COLORS[mastery.level] || MASTERY_COLORS[1];

            return (
              <div
                key={mastery.championId}
                className={cn(
                  "relative rounded-lg overflow-hidden border transition-all hover:scale-105",
                  index < 3 ? "ring-1 ring-primary/20" : ""
                )}
              >
                <ChampionIcon
                  championId={championSlug}
                  size={64}
                  className="w-full aspect-square"
                />

                {/* Mastery level badge */}
                <div
                  className={cn(
                    "absolute top-0.5 right-0.5 size-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br shadow-sm",
                    gradientClass
                  )}
                >
                  {mastery.level}
                </div>

                {/* Chest indicator */}
                {mastery.chestGranted && (
                  <div className="absolute top-0.5 left-0.5">
                    <SparklesIcon className="size-3 text-amber-400" />
                  </div>
                )}

                {/* Points overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                  <div className="text-[9px] text-white text-center font-medium">
                    {formatPoints(mastery.points)}
                  </div>
                </div>

                {/* Tokens for level 5-6 */}
                {mastery.tokensEarned > 0 && mastery.level >= 5 && mastery.level < 7 && (
                  <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {Array.from({ length: mastery.tokensEarned }).map((_, i) => (
                      <div
                        key={i}
                        className={cn(
                          "size-1.5 rounded-full",
                          mastery.level === 5 ? "bg-fuchsia-400" : "bg-amber-400"
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-3 flex items-center justify-center gap-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="size-3 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
            <span>M7</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="size-3 rounded-full bg-gradient-to-br from-fuchsia-400 to-fuchsia-600" />
            <span>M6</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="size-3 rounded-full bg-gradient-to-br from-red-400 to-red-600" />
            <span>M5</span>
          </div>
          <div className="flex items-center gap-1">
            <SparklesIcon className="size-3 text-amber-400" />
            <span>Coffre</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
