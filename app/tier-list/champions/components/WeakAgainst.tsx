"use client";

import { ChampionIcon } from "@/components/ChampionIcon";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useI18n } from "@/lib/i18n-context";
import type { WeakAgainstItem } from "@/types";

type WeakAgainstProps = {
  weakAgainst: WeakAgainstItem[] | null | undefined;
  championNameMap: Map<string, string>;
};

export const WeakAgainst = ({
  weakAgainst,
  championNameMap,
}: WeakAgainstProps) => {
  const { t } = useI18n();
  // Les weakAgainst sont déjà triés par winRate décroissant
  // Donc les 3 premiers sont les ennemis contre lesquels le champion est le plus faible
  const weakAgainstList = weakAgainst?.slice(0, 3) ?? [];

  if (weakAgainstList.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">—</span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      {weakAgainstList.map((pair) => {
        const enemyName = championNameMap.get(pair.enemyChampionId) ?? pair.enemyChampionId;
        const winRate = (pair.winRate * 100).toFixed(1);

        return (
          <Tooltip key={pair.enemyChampionId}>
            <TooltipTrigger asChild>
              <div>
                <ChampionIcon
                  championId={pair.enemyChampionId}
                  size={32}
                  alt={enemyName}
                  className="rounded-full border border-border/50"
                  clickable
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <div className="space-y-1">
                <p className="font-medium">{enemyName}</p>
                <p className="text-xs text-muted-foreground">
                  {t("tierListChampions.winRateTooltip").replace("{winRate}", winRate).replace("{games}", pair.games.toString())}
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </div>
  );
};

