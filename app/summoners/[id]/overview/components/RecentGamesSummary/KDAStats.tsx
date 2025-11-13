"use client";

import type { SummaryStats } from "./types";

interface KDAStatsProps {
  stats: SummaryStats;
}

export const KDAStats = ({ stats }: KDAStatsProps) => {
  return (
    <div className="flex-1 space-y-1">
      <div className="flex items-baseline gap-2 text-xs">
        <span className="text-muted-foreground">KDA</span>
        <span className="font-semibold text-foreground">
          {stats.kills.toFixed(1)} /{" "}
          <span className="text-destructive">{stats.deaths.toFixed(1)}</span> /{" "}
          {stats.assists.toFixed(1)}
        </span>
      </div>
      <div className="text-lg font-bold text-foreground">
        {stats.kdaRatio.toFixed(2)}:1
      </div>
      <div className="text-xs text-muted-foreground">
        P/Kill {stats.pKill.toFixed(0)}%
      </div>
    </div>
  );
};

