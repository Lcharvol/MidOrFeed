"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { SummonerOverviewAggregate, ChampionIdToStats } from "@/types";
import { BestChampionCard } from "./BestChampionCard";

interface StatsGridProps {
  stats: SummonerOverviewAggregate;
  winRateValue: number;
  championStats: ChampionIdToStats;
  championNameMap: Map<string, string>;
  championKeyToId: Map<string, string>;
  resolveSlug: (idOrKey: string) => string;
}

export const StatsGrid = ({
  stats,
  winRateValue,
  championStats,
  championNameMap,
  championKeyToId,
  resolveSlug,
}: StatsGridProps) => {
  const winRatio = stats.totalWins / Math.max(stats.totalGames, 1);

  return (
    <div className="grid gap-2 md:grid-cols-4">
      <Card
        variant="gradient"
        className="border-blue-500/25 from-background to-blue-500/10 dark:border-blue-500/25 dark:from-background dark:to-blue-500/10"
      >
        <CardHeader className="pb-1.5 pt-2">
          <CardTitle className="text-xs font-semibold text-blue-700 dark:text-blue-100">
            Win rate global
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pb-2.5 pt-0">
          <p className="text-lg font-semibold text-foreground">
            {stats.winRate}
          </p>
          <Progress
            value={winRateValue}
            className="h-1 bg-blue-500/30"
            indicatorClassName="bg-blue-600 dark:bg-blue-400"
          />
          <p className="text-[10px] text-muted-foreground">
            {stats.totalWins} victoires · {stats.totalGames - stats.totalWins}{" "}
            défaites
          </p>
        </CardContent>
      </Card>

      <BestChampionCard
        championStats={championStats}
        championNameMap={championNameMap}
        championKeyToId={championKeyToId}
        resolveSlug={resolveSlug}
      />

      <Card
        variant="gradient"
        className="border-purple-500/25 from-background to-purple-500/10 dark:border-purple-500/25 dark:from-background dark:to-purple-500/10"
      >
        <CardHeader className="pb-1.5 pt-2">
          <CardTitle className="text-xs font-semibold text-purple-700 dark:text-purple-100">
            Matchs analysés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pb-2.5 pt-0">
          <p className="text-lg font-semibold text-foreground">
            {stats.totalGames.toLocaleString("fr-FR")}
          </p>
          <p className="text-[10px] text-muted-foreground">
            Toutes files confondues
          </p>
        </CardContent>
      </Card>

      <Card
        variant="gradient"
        className="border-amber-500/25 from-background to-amber-500/10 dark:border-amber-500/25 dark:from-background dark:to-amber-500/10"
      >
        <CardHeader className="pb-1.5 pt-2">
          <CardTitle className="text-xs font-semibold text-amber-700 dark:text-amber-100">
            Victoires
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pb-2.5 pt-0">
          <p className="text-lg font-semibold text-foreground">
            {stats.totalWins.toLocaleString("fr-FR")}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {(winRatio * 100).toFixed(1)}% de win rate
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
