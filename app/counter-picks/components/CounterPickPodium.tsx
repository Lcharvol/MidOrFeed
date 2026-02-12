"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ChampionIcon } from "@/components/ChampionIcon";
import { Progress } from "@/components/ui/progress";
import { TrophyIcon, MedalIcon, AwardIcon } from "lucide-react";
import { formatPercent, formatNumber } from "../utils";
import { useI18n } from "@/lib/i18n-context";
import type { CounterPickPair } from "@/types";
import { cn } from "@/lib/utils";

type CounterPickPodiumProps = {
  pairs: CounterPickPair[];
  championNameMap: Map<string, string>;
};

const PODIUM_CONFIG = [
  {
    order: "order-2 md:order-1",
    icon: <MedalIcon className="size-5" />,
    ring: "ring-2 ring-muted-foreground/40",
    iconBg: "bg-muted text-muted-foreground",
    label: "2",
    height: "md:pt-6",
    progressColor: "bg-muted-foreground/60",
  },
  {
    order: "order-1 md:order-2",
    icon: <TrophyIcon className="size-5" />,
    ring: "ring-2 ring-warning/50",
    iconBg: "bg-warning/10 text-warning",
    label: "1",
    height: "md:pt-0",
    progressColor: "bg-warning",
  },
  {
    order: "order-3",
    icon: <AwardIcon className="size-5" />,
    ring: "ring-2 ring-amber-700/40 dark:ring-amber-500/40",
    iconBg: "bg-amber-500/10 text-amber-700 dark:text-amber-500",
    label: "3",
    height: "md:pt-8",
    progressColor: "bg-amber-600",
  },
] as const;

const getWinRateColor = (winRate: number) => {
  if (winRate >= 0.6) return "text-success-muted-foreground";
  if (winRate >= 0.55) return "text-success-muted-foreground/80";
  if (winRate >= 0.5) return "text-info-muted-foreground";
  if (winRate >= 0.45) return "text-warning-muted-foreground";
  return "text-danger-muted-foreground";
};

export const CounterPickPodium = ({
  pairs,
  championNameMap,
}: CounterPickPodiumProps) => {
  const { t } = useI18n();
  const top3 = pairs.slice(0, 3);

  if (top3.length < 3) return null;

  return (
    <div>
      <h2 className="mb-3 sm:mb-4 text-base sm:text-lg font-semibold flex items-center gap-2">
        <TrophyIcon className="size-4 sm:size-5 text-warning" />
        {t("counterPicks.podiumTitle")}
      </h2>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 md:items-end">
        {top3.map((pair, index) => {
          const config = PODIUM_CONFIG[index];
          const name = championNameMap.get(pair.enemyChampionId) ?? pair.enemyChampionId;

          return (
            <Card
              key={pair.enemyChampionId}
              className={cn(
                "border-border/50 overflow-hidden transition-shadow hover:shadow-glow",
                config.order,
                config.height
              )}
            >
              <CardContent className="flex flex-col items-center gap-3 p-4 sm:p-5">
                {/* Rank badge */}
                <div
                  className={cn(
                    "flex size-8 items-center justify-center rounded-full",
                    config.iconBg
                  )}
                >
                  {config.icon}
                </div>

                {/* Champion icon */}
                <ChampionIcon
                  championId={pair.enemyChampionId}
                  size={index === 1 ? 72 : 56}
                  shape="circle"
                  className={cn(
                    "border-2 transition-transform hover:scale-105",
                    index === 1 ? "border-warning/40" : "border-border/50"
                  )}
                />

                {/* Name */}
                <p className="text-sm sm:text-base font-semibold text-center">
                  {name}
                </p>

                {/* Win rate */}
                <div className="w-full space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {t("counterPicks.winRate")}
                    </span>
                    <span
                      className={cn(
                        "text-sm font-bold tabular-nums",
                        getWinRateColor(pair.winRate)
                      )}
                    >
                      {formatPercent(pair.winRate)}
                    </span>
                  </div>
                  <Progress
                    value={pair.winRate * 100}
                    className="h-2"
                    indicatorClassName={config.progressColor}
                  />
                </div>

                {/* Matches */}
                <p className="text-xs text-muted-foreground">
                  {t("counterPicks.onMatches").replace("{count}", formatNumber(pair.games))}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
