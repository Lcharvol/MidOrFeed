"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { SkeletonAvatar } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  SwordsIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { TrendIcon } from "./TrendIcon";
import { formatNumber } from "./types";
import type { TierListChampionStats } from "@/types";

type TopChampionsSectionProps = {
  topChampions: TierListChampionStats[];
  championsLoading: boolean;
  totalUniqueMatches: number | undefined;
};

export const TopChampionsSection = ({
  topChampions,
  championsLoading,
  totalUniqueMatches,
}: TopChampionsSectionProps) => {
  const { t } = useI18n();

  return (
    <section className="py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
              <SwordsIcon className="size-6 text-muted-foreground" />
              {t("homeStats.topChampions") ?? "Top Champions"}
            </h2>
            {totalUniqueMatches && (
              <p className="text-sm text-muted-foreground mt-1">
                {t("homeStats.basedOnMatches").replace("{count}", formatNumber(totalUniqueMatches))}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tier-list/champions" className="flex items-center gap-1">
              {t("common.viewAll") ?? "Voir tout"}
              <ChevronRightIcon className="size-4" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {championsLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center gap-3">
                      <SkeletonAvatar size="lg" className="size-16 rounded-xl" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-5 w-14 rounded-full" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </CardContent>
                </Card>
              ))
            : topChampions.map((champion, index) => (
                <Tooltip key={champion.championId}>
                  <TooltipTrigger asChild>
                    <Link
                      href={`/champions/${champion.championId}`}
                      className="block"
                    >
                      <Card variant="interactive" className="overflow-hidden group">
                        <CardContent className="p-4">
                          <div className="flex flex-col items-center gap-3">
                            <div className="relative">
                              {index < 3 && (
                                <div className="absolute -top-1 -right-1 z-10 size-5 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                                  {index + 1}
                                </div>
                              )}
                              <ChampionIcon
                                championId={champion.championId}
                                size={64}
                                className="group-hover:scale-105 transition-transform"
                              />
                            </div>
                            <div className="text-center">
                              <div className="font-medium text-sm truncate max-w-full">
                                {champion.championId}
                              </div>
                              <div className="flex items-center justify-center gap-1 mt-1">
                                <Badge
                                  emphasis={
                                    champion.winRate >= 52
                                      ? "positive"
                                      : champion.winRate >= 48
                                        ? "neutral"
                                        : "danger"
                                  }
                                  emphasisVariant="subtle"
                                  rounded="full"
                                  className="text-xs"
                                >
                                  {champion.winRate.toFixed(1)}%
                                </Badge>
                                <TrendIcon trend={champion.winRateTrend?.trend} />
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatNumber(champion.totalGames)} {t("common.games") ?? "parties"}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent sideOffset={4}>
                    <div className="text-xs space-y-0.5">
                      <div className="font-medium">{champion.championId}</div>
                      <div>KDA: {champion.avgKDA.toFixed(2)} ({champion.avgKills.toFixed(1)}/{champion.avgDeaths.toFixed(1)}/{champion.avgAssists.toFixed(1)})</div>
                      <div>Win Rate: {champion.winRate.toFixed(1)}% sur {champion.totalGames} parties</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
        </div>
      </div>
    </section>
  );
};
