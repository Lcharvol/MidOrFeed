"use client";

import { useMemo } from "react";
import { ChampionIcon } from "@/components/ChampionIcon";
import { DataState } from "@/components/ui/data-state";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { TierListChampionWithStats } from "@/types";
import {
  computeChampionScore,
  formatPercentage,
  resolveTier,
  TIER_ROW_CONFIG,
} from "../utils";
import { useI18n } from "@/lib/i18n-context";

type TierListGridProps = {
  champions: TierListChampionWithStats[];
  isLoading: boolean;
  error: unknown;
};

export const TierListGrid = ({
  champions,
  isLoading,
  error,
}: TierListGridProps) => {
  const { t } = useI18n();

  const grouped = useMemo(() => {
    const map = new Map<string, TierListChampionWithStats[]>();
    for (const config of TIER_ROW_CONFIG) {
      map.set(config.tier, []);
    }

    for (const champion of champions) {
      const tier = resolveTier(champion.stats);
      const bucket = map.get(tier);
      if (bucket) {
        bucket.push(champion);
      }
    }

    // Sort each bucket by score descending
    for (const [, bucket] of map) {
      bucket.sort(
        (a, b) =>
          (computeChampionScore(b.stats) ?? 0) -
          (computeChampionScore(a.stats) ?? 0)
      );
    }

    return map;
  }, [champions]);

  if (isLoading) {
    return (
      <DataState
        tone="neutral"
        title={t("common.loading")}
        description=""
      />
    );
  }

  if (error) {
    return (
      <DataState
        tone="danger"
        title={t("tierListChampions.loadingError")}
        description=""
      />
    );
  }

  const visibleRows = TIER_ROW_CONFIG.filter(
    (config) => (grouped.get(config.tier)?.length ?? 0) > 0
  );

  if (visibleRows.length === 0) {
    return (
      <DataState
        tone="neutral"
        title={t("tierListChampions.noChampionFound")}
        description=""
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border/60">
      {visibleRows.map((config, index) => {
        const bucket = grouped.get(config.tier) ?? [];
        return (
          <div
            key={config.tier}
            className={`flex ${index > 0 ? "border-t border-border/40" : ""}`}
          >
            {/* Tier label */}
            <div
              className={`flex w-14 sm:w-18 shrink-0 items-center justify-center ${config.bgClass} ${config.borderClass} border-r`}
            >
              <span
                className={`text-lg sm:text-xl font-bold ${config.textClass}`}
              >
                {config.label}
              </span>
            </div>

            {/* Champion icons */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 p-2 sm:p-3 min-h-[56px]">
              {bucket.map((champion) => (
                <Tooltip key={champion.championId}>
                  <TooltipTrigger asChild>
                    <span>
                      <ChampionIcon
                        championId={champion.championId}
                        alt={champion.name}
                        size={44}
                        clickable
                        className="sm:!w-[52px] sm:!h-[52px]"
                      />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-semibold">{champion.name}</p>
                    <p className="text-muted-foreground">
                      {formatPercentage(champion.stats?.winRate)} WR
                      {" · "}
                      {champion.stats?.totalGames ?? 0}{" "}
                      {t("common.games")}
                    </p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
