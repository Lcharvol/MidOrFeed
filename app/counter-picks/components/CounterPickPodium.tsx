"use client";

import { ChampionIcon } from "@/components/ChampionIcon";
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
    icon: <TrophyIcon className="size-3.5" />,
    iconBg: "bg-warning/10 text-warning",
    ring: "ring-1 ring-warning/40",
    label: "#1",
  },
  {
    icon: <MedalIcon className="size-3.5" />,
    iconBg: "bg-muted text-muted-foreground",
    ring: "ring-1 ring-muted-foreground/30",
    label: "#2",
  },
  {
    icon: <AwardIcon className="size-3.5" />,
    iconBg: "bg-amber-500/10 text-amber-700 dark:text-amber-500",
    ring: "ring-1 ring-amber-500/30",
    label: "#3",
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
    <div className="grid grid-cols-3 gap-2">
      {top3.map((pair, index) => {
        const config = PODIUM_CONFIG[index];
        const name = championNameMap.get(pair.enemyChampionId) ?? pair.enemyChampionId;

        return (
          <div
            key={pair.enemyChampionId}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border border-border/50 bg-card/50 p-2.5 sm:p-3 transition-shadow hover:shadow-sm",
              index === 0 && "bg-warning/[0.03]"
            )}
          >
            {/* Rank + Champion icon */}
            <div className="relative">
              <ChampionIcon
                championId={pair.enemyChampionId}
                size={44}
                shape="circle"
                className={cn("border sm:w-14 sm:h-14", config.ring)}
              />
              <div
                className={cn(
                  "absolute -top-1 -right-1 flex size-5 items-center justify-center rounded-full",
                  config.iconBg
                )}
              >
                {config.icon}
              </div>
            </div>

            {/* Name */}
            <p className="text-xs sm:text-sm font-semibold text-center truncate max-w-full">
              {name}
            </p>

            {/* Win rate */}
            <p className={cn("text-sm sm:text-base font-bold tabular-nums", getWinRateColor(pair.winRate))}>
              {formatPercent(pair.winRate)}
            </p>

            {/* Matches */}
            <p className="text-[10px] text-muted-foreground">
              {formatNumber(pair.games)} {t("counterPicks.matches").toLowerCase()}
            </p>
          </div>
        );
      })}
    </div>
  );
};
