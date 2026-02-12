"use client";

import { useMemo } from "react";
import Image from "next/image";
import { DataState } from "@/components/ui/data-state";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import type { ItemWithStats } from "@/types";
import {
  computeItemScore,
  formatPercentage,
  resolveItemTier,
  TIER_ROW_CONFIG,
} from "../utils";
import { useI18n } from "@/lib/i18n-context";
import { DDRAGON_VERSION, getItemImageUrl } from "@/constants/ddragon";

const cleanItemName = (name: string) => name.replace(/<[^>]*>/g, "");

type ItemTierListGridProps = {
  items: ItemWithStats[];
  isLoading: boolean;
  error: unknown;
};

export const ItemTierListGrid = ({
  items,
  isLoading,
  error,
}: ItemTierListGridProps) => {
  const { t } = useI18n();

  const grouped = useMemo(() => {
    const map = new Map<string, ItemWithStats[]>();
    for (const config of TIER_ROW_CONFIG) {
      map.set(config.tier, []);
    }

    for (const item of items) {
      const tier = resolveItemTier(item.stats);
      const bucket = map.get(tier);
      if (bucket) {
        bucket.push(item);
      }
    }

    // Sort each bucket by score descending
    for (const [, bucket] of map) {
      bucket.sort(
        (a, b) =>
          (computeItemScore(b.stats) ?? 0) - (computeItemScore(a.stats) ?? 0)
      );
    }

    return map;
  }, [items]);

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
        title={t("tierList.items.loadingError")}
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
        title={t("tierList.items.noItemFound")}
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

            {/* Item icons */}
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 p-2 sm:p-3 min-h-[56px]">
              {bucket.map((item) => (
                <Tooltip key={item.itemId}>
                  <TooltipTrigger asChild>
                    <span className="inline-block">
                      {item.image ? (
                        <Image
                          src={getItemImageUrl(item.image, DDRAGON_VERSION)}
                          alt={cleanItemName(item.name)}
                          width={44}
                          height={44}
                          className="rounded border border-border/40 sm:w-[52px] sm:h-[52px] cursor-pointer transition-transform hover:scale-110"
                        />
                      ) : (
                        <div className="size-[44px] sm:size-[52px] rounded bg-muted border border-border/40" />
                      )}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-xs">
                    <p className="font-semibold">
                      {cleanItemName(item.name)}
                    </p>
                    <p className="text-muted-foreground">
                      {formatPercentage(item.stats?.winRate)} WR
                      {" · "}
                      {formatPercentage(item.stats?.pickRate)} Pick
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
