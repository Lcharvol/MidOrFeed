"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChampionIcon } from "@/components/ChampionIcon";
import { Progress } from "@/components/ui/progress";
import {
  TrophyIcon,
  SwordsIcon,
  BarChart3Icon,
  ClockIcon,
} from "lucide-react";
import { formatDateTime, formatNumber, formatPercent } from "../utils";
import type { CounterPickSummary } from "@/lib/hooks/use-counter-picks";
import { cn } from "@/lib/utils";

type CounterPickSummaryCardProps = {
  championId: string;
  championName: string;
  championNameMap: Map<string, string>;
  summary: CounterPickSummary;
};

const getWinRateColor = (winRate: number) => {
  if (winRate >= 0.55) return "text-success-muted-foreground";
  if (winRate >= 0.50) return "text-info-muted-foreground";
  if (winRate >= 0.45) return "text-warning-muted-foreground";
  return "text-danger-muted-foreground";
};

const getWinRateBg = (winRate: number) => {
  if (winRate >= 0.55) return "bg-success";
  if (winRate >= 0.50) return "bg-info";
  if (winRate >= 0.45) return "bg-warning";
  return "bg-danger";
};

export const CounterPickSummaryCard = ({
  championId,
  championName,
  championNameMap,
  summary,
}: CounterPickSummaryCardProps) => {
  const bestCounterName = summary.bestCounterId
    ? championNameMap.get(summary.bestCounterId) ?? summary.bestCounterId
    : null;

  return (
    <Card className="overflow-hidden border-border/50">
      <CardContent className="p-0">
        {/* Stats grid */}
        <div className="grid grid-cols-2 divide-x divide-border/50 md:grid-cols-4">
          {/* Win Rate */}
          <div className="p-4 md:p-5">
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <BarChart3Icon className="size-3.5" />
              Win rate observé
            </div>
            <div className="mb-2 flex items-baseline gap-2">
              <span className={cn("text-2xl font-bold", getWinRateColor(summary.overallWinRate))}>
                {formatPercent(summary.overallWinRate)}
              </span>
            </div>
            <Progress
              value={summary.overallWinRate * 100}
              className="h-1.5"
              indicatorClassName={getWinRateBg(summary.overallWinRate)}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {formatNumber(summary.championWins)} V / {formatNumber(summary.championLosses)} D
            </p>
          </div>

          {/* Best Counter */}
          <div className="p-4 md:p-5">
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <TrophyIcon className="size-3.5" />
              Meilleur counter
            </div>
            {bestCounterName ? (
              <div className="flex items-center gap-3">
                <ChampionIcon
                  championId={summary.bestCounterId!}
                  size={40}
                  shape="circle"
                  className="border-2 border-success/30"
                />
                <div>
                  <p className="font-semibold">{bestCounterName}</p>
                  <p className="text-xs text-muted-foreground">
                    <span className="text-success-muted-foreground font-medium">
                      {formatPercent(summary.bestCounterWinRate)}
                    </span>
                    {" "}sur {formatNumber(summary.bestCounterGames)} matchs
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">—</p>
            )}
          </div>

          {/* Matchups */}
          <div className="p-4 md:p-5">
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <SwordsIcon className="size-3.5" />
              Matchups fiables
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{summary.reliableMatchups}</span>
              <Badge variant="outline" className="text-xs">
                {formatNumber(summary.gamesAnalysed)} matchs
              </Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Champions avec données suffisantes
            </p>
          </div>

          {/* Last Updated */}
          <div className="p-4 md:p-5">
            <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
              <ClockIcon className="size-3.5" />
              Dernière donnée
            </div>
            <p className="text-lg font-semibold">
              {summary.lastPlayed
                ? formatDateTime(summary.lastPlayed)
                : "Inconnue"}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              {formatNumber(summary.totalMatches)} matchs au total
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
