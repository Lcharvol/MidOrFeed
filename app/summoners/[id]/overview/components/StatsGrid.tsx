"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useI18n } from "@/lib/i18n-context";
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
  const { t } = useI18n();
  const winRatio = stats.totalWins / Math.max(stats.totalGames, 1);

  return (
    <div className="grid gap-3 sm:gap-6 grid-cols-2 md:grid-cols-4">
      <Card
        variant="gradient"
        className="border-blue-500/25 from-background to-blue-500/10 dark:border-blue-500/25 dark:from-background dark:to-blue-500/10"
      >
        <CardHeader>
          <CardTitle>{t("summoners.globalWinRate")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-lg font-semibold">{stats.winRate}</p>
          <Progress
            value={winRateValue}
            className="h-1 bg-blue-500/30"
            indicatorClassName="bg-blue-600 dark:bg-blue-400"
          />
          <p className="text-sm text-muted-foreground">
            {t("summoners.victoriesAndDefeats")
              .replace("{wins}", stats.totalWins.toString())
              .replace(
                "{losses}",
                (stats.totalGames - stats.totalWins).toString()
              )}
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
        <CardHeader>
          <CardTitle>{t("summoners.analyzedMatches")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-lg font-semibold">
            {stats.totalGames.toLocaleString("fr-FR")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("summoners.allQueues")}
          </p>
        </CardContent>
      </Card>

      <Card
        variant="gradient"
        className="border-amber-500/25 from-background to-amber-500/10 dark:border-amber-500/25 dark:from-background dark:to-amber-500/10"
      >
        <CardHeader>
          <CardTitle>{t("summoners.victoriesTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-lg font-semibold">
            {stats.totalWins.toLocaleString("fr-FR")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("summoners.winRatePercent").replace(
              "{percent}",
              (winRatio * 100).toFixed(1)
            )}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
