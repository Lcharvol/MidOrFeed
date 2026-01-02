"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChampionIcon } from "@/components/ChampionIcon";
import { Progress } from "@/components/ui/progress";
import {
  TrophyIcon,
  MedalIcon,
  AwardIcon,
  ChevronDownIcon,
  SwordsIcon,
} from "lucide-react";
import { formatDateTime, formatNumber, formatPercent } from "../utils";
import type { CounterPickPair, CounterPickMode } from "@/types";
import { cn } from "@/lib/utils";

type CounterPickTableProps = {
  championName: string;
  pairs: CounterPickPair[];
  championNameMap: Map<string, string>;
  mode: CounterPickMode;
};

const getRankIcon = (index: number) => {
  switch (index) {
    case 0:
      return <TrophyIcon className="size-4 text-warning" />;
    case 1:
      return <MedalIcon className="size-4 text-muted-foreground" />;
    case 2:
      return <AwardIcon className="size-4 text-amber-700" />;
    default:
      return null;
  }
};

const getRankBadge = (index: number) => {
  switch (index) {
    case 0:
      return "bg-warning/10 text-warning border-warning/30";
    case 1:
      return "bg-muted text-muted-foreground border-border";
    case 2:
      return "bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-500/30";
    default:
      return "";
  }
};

const getWinRateColor = (winRate: number) => {
  if (winRate >= 0.6) return "text-success-muted-foreground";
  if (winRate >= 0.55) return "text-success-muted-foreground/80";
  if (winRate >= 0.5) return "text-info-muted-foreground";
  if (winRate >= 0.45) return "text-warning-muted-foreground";
  return "text-danger-muted-foreground";
};

const getProgressColor = (winRate: number) => {
  if (winRate >= 0.6) return "bg-success";
  if (winRate >= 0.55) return "bg-success/80";
  if (winRate >= 0.5) return "bg-info";
  if (winRate >= 0.45) return "bg-warning";
  return "bg-danger";
};

const INITIAL_SHOW = 10;

export const CounterPickTable = ({
  championName,
  pairs,
  championNameMap,
  mode,
}: CounterPickTableProps) => {
  const [showAll, setShowAll] = useState(false);
  const displayedPairs = showAll ? pairs : pairs.slice(0, INITIAL_SHOW);
  const hasMore = pairs.length > INITIAL_SHOW;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <SwordsIcon className="size-5 text-muted-foreground" />
              Classement des counters
            </CardTitle>
            <CardDescription>
              {mode === "same_lane"
                ? `Champions en lane face à ${championName}`
                : `Tous les champions efficaces contre ${championName}`}
            </CardDescription>
          </div>
          <Badge variant="secondary" className="px-3">
            {pairs.length} matchups
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-2 border-b border-border/50 bg-muted/30 px-4 py-2.5 text-xs font-medium text-muted-foreground">
          <div className="col-span-1 text-center">#</div>
          <div className="col-span-4">Champion</div>
          <div className="col-span-4">Win rate counter</div>
          <div className="col-span-2 text-right">Matchs</div>
          <div className="col-span-1 text-right">Date</div>
        </div>

        {/* Rows */}
        <div className="divide-y divide-border/30">
          {displayedPairs.map((pair, index) => {
            const enemyName =
              championNameMap.get(pair.enemyChampionId) ?? pair.enemyChampionId;
            const isTopThree = index < 3;

            return (
              <div
                key={pair.enemyChampionId}
                className={cn(
                  "grid grid-cols-12 items-center gap-2 px-4 py-3 transition-colors hover:bg-muted/30",
                  isTopThree && "bg-muted/10"
                )}
              >
                {/* Rank */}
                <div className="col-span-1 flex justify-center">
                  {isTopThree ? (
                    <div
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full border",
                        getRankBadge(index)
                      )}
                    >
                      {getRankIcon(index)}
                    </div>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {index + 1}
                    </span>
                  )}
                </div>

                {/* Champion */}
                <div className="col-span-4">
                  <div className="flex items-center gap-3">
                    <ChampionIcon
                      championId={pair.enemyChampionId}
                      size={36}
                      shape="circle"
                      className={cn(
                        "border-2",
                        isTopThree ? "border-primary/30" : "border-border/50"
                      )}
                    />
                    <span
                      className={cn(
                        "font-medium",
                        isTopThree && "text-foreground"
                      )}
                    >
                      {enemyName}
                    </span>
                  </div>
                </div>

                {/* Win Rate with progress bar */}
                <div className="col-span-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <Progress
                        value={pair.winRate * 100}
                        className="h-2"
                        indicatorClassName={getProgressColor(pair.winRate)}
                      />
                    </div>
                    <span
                      className={cn(
                        "w-14 text-right text-sm font-semibold tabular-nums",
                        getWinRateColor(pair.winRate)
                      )}
                    >
                      {formatPercent(pair.winRate)}
                    </span>
                  </div>
                </div>

                {/* Games */}
                <div className="col-span-2 text-right">
                  <span className="text-sm text-muted-foreground">
                    {formatNumber(pair.games)}
                  </span>
                </div>

                {/* Last played */}
                <div className="col-span-1 text-right">
                  <span className="text-xs text-muted-foreground">
                    {formatDateTime(Number(pair.lastPlayedAt))}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show more button */}
        {hasMore && (
          <div className="border-t border-border/50 p-4">
            <Button
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => setShowAll(!showAll)}
            >
              <ChevronDownIcon
                className={cn(
                  "mr-2 size-4 transition-transform",
                  showAll && "rotate-180"
                )}
              />
              {showAll
                ? "Afficher moins"
                : `Afficher ${pairs.length - INITIAL_SHOW} de plus`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
