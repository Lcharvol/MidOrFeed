"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ChampionIcon } from "@/components/ChampionIcon";
import { StatTile } from "@/components/ui/stat-tile";
import { formatDateTime, formatNumber, formatPercent } from "../utils";
import type { CounterPickSummary } from "@/lib/hooks/use-counter-picks";

type CounterPickSummaryCardProps = {
  championId: string;
  championName: string;
  championNameMap: Map<string, string>;
  summary: CounterPickSummary;
};

export const CounterPickSummaryCard = ({
  championId,
  championName,
  championNameMap,
  summary,
}: CounterPickSummaryCardProps) => (
  <Card className="relative overflow-hidden border border-border/80 bg-linear-to-br from-background to-muted/20 shadow-lg">
    <div className="pointer-events-none absolute inset-0 rounded-xl border border-white/5 opacity-80 [box-shadow:0_25px_60px_-35px_rgba(15,23,42,0.45)]" />
    <CardHeader className="relative flex flex-col gap-6">
      <div className="flex items-center gap-5">
        <ChampionIcon
          championId={championId}
          size={72}
          shape="rounded"
          className="rounded-3xl border border-white/10 shadow-inner shadow-black/40"
        />
        <div className="space-y-1">
          <CardTitle className="text-3xl font-semibold tracking-tight text-foreground">
            {championName}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground/90">
            <span className="font-medium text-foreground">
              {formatNumber(summary.totalMatches)} matchs analysés
            </span>{" "}
            •{" "}
            {summary.lastPlayed
              ? `Dernière donnée ${formatDateTime(summary.lastPlayed)}`
              : "Dernière donnée inconnue"}
          </CardDescription>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Win rate observé"
          value={formatPercent(summary.overallWinRate)}
          hint={`${formatNumber(
            summary.championWins
          )} victoires · ${formatNumber(summary.championLosses)} défaites`}
          emphasis={
            summary.overallWinRate >= 0.55
              ? "positive"
              : summary.overallWinRate >= 0.5
              ? "info"
              : summary.overallWinRate >= 0.45
              ? "warning"
              : "danger"
          }
        />
        <StatTile
          label="Meilleur couter pick"
          value={
            summary.bestCounterId
              ? championNameMap.get(summary.bestCounterId) ??
                summary.bestCounterId
              : "—"
          }
          hint={
            summary.bestCounterId
              ? `${formatPercent(
                  summary.bestCounterWinRate
                )} sur ${formatNumber(summary.bestCounterGames)} matchs`
              : undefined
          }
          emphasis={
            summary.bestCounterId
              ? summary.bestCounterWinRate >= 0.6
                ? "positive"
                : summary.bestCounterWinRate >= 0.5
                ? "info"
                : "warning"
              : "neutral"
          }
        />
        <StatTile
          label="Matchups fiables"
          value={String(summary.reliableMatchups)}
          hint={`${formatNumber(summary.gamesAnalysed)} matchs pris en compte`}
          emphasis={
            summary.reliableMatchups >= 10
              ? "positive"
              : summary.reliableMatchups >= 5
              ? "info"
              : summary.reliableMatchups > 0
              ? "warning"
              : "danger"
          }
        />
      </div>
    </CardHeader>
  </Card>
);
