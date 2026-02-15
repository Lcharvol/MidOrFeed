"use client";

import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import type { SummaryStats } from "./types";

interface KDAStatsProps {
  stats: SummaryStats;
}

const safe = (n: number, decimals: number = 1): string =>
  Number.isFinite(n) ? n.toFixed(decimals) : "0";

export const KDAStats = ({ stats }: KDAStatsProps) => {
  return (
    <div className="flex-1 space-y-1">
      <div className="flex items-baseline gap-2 text-xs">
        <span className="text-muted-foreground">KDA</span>
        <span className="font-semibold text-foreground">
          {safe(stats.kills)} /{" "}
          <span className="text-destructive">{safe(stats.deaths)}</span> /{" "}
          {safe(stats.assists)}
        </span>
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-lg font-bold text-foreground cursor-help">
            {safe(stats.kdaRatio, 2)}:1
          </div>
        </TooltipTrigger>
        <TooltipContent>(Kills + Assists) / Deaths — Plus le ratio est élevé, meilleur est le joueur</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="text-xs text-muted-foreground cursor-help w-fit">
            P/Kill {safe(stats.pKill, 0)}%
          </div>
        </TooltipTrigger>
        <TooltipContent>Participation aux kills : pourcentage de kills de l'équipe auxquels vous avez contribué</TooltipContent>
      </Tooltip>
    </div>
  );
};

