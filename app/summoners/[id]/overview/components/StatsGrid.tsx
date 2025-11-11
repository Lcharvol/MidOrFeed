"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { StatTile as SummaryStatTile } from "@/components/ui/stat-tile";
import type { SummonerOverviewAggregate } from "@/types";

interface StatsGridProps {
  stats: SummonerOverviewAggregate;
  winRateValue: number;
}

export const StatsGrid = ({ stats, winRateValue }: StatsGridProps) => {
  const avgKda = parseFloat(stats.avgKDA);
  const winRatio = stats.totalWins / Math.max(stats.totalGames, 1);

  return (
    <Card className="border-border/80 bg-background/95 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Vue d’ensemble
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-primary/30 bg-linear-to-br from-background to-primary/10 p-4 shadow-inner">
            <p className="text-xs font-medium uppercase text-muted-foreground">
              Win rate
            </p>
            <p className="mt-2 text-3xl font-semibold text-primary">
              {stats.winRate}
            </p>
            <Progress value={winRateValue} className="mt-3 h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {stats.totalWins} victoires •{" "}
              {stats.totalGames - stats.totalWins} défaites
            </p>
          </div>
          <SummaryStatTile
            label="KDA moyen"
            value={stats.avgKDA}
            hint="par partie"
            emphasis={
              avgKda >= 3 ? "positive" : avgKda >= 2.5 ? "info" : avgKda >= 2 ? "warning" : "danger"
            }
          />
          <SummaryStatTile
            label="Matchs analysés"
            value={stats.totalGames.toLocaleString("fr-FR")}
            hint="toutes files confondues"
            emphasis={
              stats.totalGames >= 200
                ? "positive"
                : stats.totalGames >= 100
                  ? "info"
                  : stats.totalGames >= 50
                    ? "neutral"
                    : "warning"
            }
          />
          <SummaryStatTile
            label="Victoires totales"
            value={stats.totalWins.toLocaleString("fr-FR")}
            hint={`${(winRatio * 100).toFixed(1)}% de win rate`}
            emphasis={
              winRatio >= 0.55
                ? "positive"
                : winRatio >= 0.5
                  ? "info"
                  : winRatio >= 0.45
                    ? "warning"
                    : "danger"
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};
