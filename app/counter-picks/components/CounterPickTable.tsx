"use client";

import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChampionIcon } from "@/components/ChampionIcon";
import { Progress } from "@/components/ui/progress";
import {
  TrophyIcon,
  MedalIcon,
  AwardIcon,
  ChevronDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ChevronsUpDownIcon,
  SwordsIcon,
} from "lucide-react";
import { formatNumber, formatPercent } from "../utils";
import { useI18n } from "@/lib/i18n-context";
import type { CounterPickPair, CounterPickMode } from "@/types";
import { cn } from "@/lib/utils";
import Link from "next/link";

type CounterPickTableProps = {
  championName: string;
  pairs: CounterPickPair[];
  championNameMap: Map<string, string>;
  mode: CounterPickMode;
};

type SortKey = "winRate" | "games";
type SortDir = "asc" | "desc" | null;

const getRankIcon = (index: number) => {
  switch (index) {
    case 0:
      return <TrophyIcon className="size-3.5 text-warning" />;
    case 1:
      return <MedalIcon className="size-3.5 text-muted-foreground" />;
    case 2:
      return <AwardIcon className="size-3.5 text-amber-700 dark:text-amber-500" />;
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

const SortIcon = ({ column, sortKey, sortDir }: { column: SortKey; sortKey: SortKey; sortDir: SortDir }) => {
  if (sortKey !== column || sortDir === null) {
    return <ChevronsUpDownIcon className="ml-1 size-3 opacity-50" />;
  }
  return sortDir === "asc"
    ? <ArrowUpIcon className="ml-1 size-3" />
    : <ArrowDownIcon className="ml-1 size-3" />;
};

const INITIAL_SHOW = 10;

export const CounterPickTable = ({
  championName,
  pairs,
  championNameMap,
  mode,
}: CounterPickTableProps) => {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("winRate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const sortedPairs = useMemo(() => {
    if (sortDir === null) return pairs;
    const sorted = [...pairs].sort((a, b) => {
      const diff = sortKey === "winRate" ? a.winRate - b.winRate : a.games - b.games;
      return sortDir === "asc" ? diff : -diff;
    });
    return sorted;
  }, [pairs, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "desc" ? "asc" : "desc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const initialPairs = sortedPairs.slice(0, INITIAL_SHOW);
  const remainingPairs = sortedPairs.slice(INITIAL_SHOW);
  const hasMore = remainingPairs.length > 0;

  const renderRow = (pair: CounterPickPair, index: number) => {
    const enemyName = championNameMap.get(pair.enemyChampionId) ?? pair.enemyChampionId;
    const isTopThree = index < 3;

    return (
      <TableRow key={pair.enemyChampionId} className={cn(isTopThree && "bg-muted/10")}>
        {/* Rank */}
        <TableCell className="w-10 text-center py-1.5">
          {isTopThree ? (
            <div
              className={cn(
                "mx-auto flex size-6 items-center justify-center rounded-full border",
                getRankBadge(index)
              )}
            >
              {getRankIcon(index)}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground">{index + 1}</span>
          )}
        </TableCell>

        {/* Champion */}
        <TableCell className="py-1.5">
          <Link
            href={`/champions/${encodeURIComponent(pair.enemyChampionId)}`}
            className="flex items-center gap-2 hover:underline"
          >
            <ChampionIcon
              championId={pair.enemyChampionId}
              size={28}
              shape="circle"
              className={cn(
                "border shrink-0",
                isTopThree ? "border-primary/30" : "border-border/50"
              )}
            />
            <span className={cn("text-sm font-medium", isTopThree && "text-foreground")}>
              {enemyName}
            </span>
          </Link>
        </TableCell>

        {/* Win Rate */}
        <TableCell className="py-1.5">
          <div className="flex items-center gap-2">
            <div className="hidden sm:block flex-1 max-w-20">
              <Progress
                value={pair.winRate * 100}
                className="h-1.5"
                indicatorClassName={getProgressColor(pair.winRate)}
              />
            </div>
            <span
              className={cn(
                "w-12 text-right text-xs font-semibold tabular-nums",
                getWinRateColor(pair.winRate)
              )}
            >
              {formatPercent(pair.winRate)}
            </span>
          </div>
        </TableCell>

        {/* Matches */}
        <TableCell className="text-right py-1.5">
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatNumber(pair.games)}
          </span>
        </TableCell>

        {/* W / L */}
        <TableCell className="text-right hidden sm:table-cell py-1.5">
          <span className="text-xs tabular-nums">
            <span className="text-success-muted-foreground">{formatNumber(pair.wins)}</span>
            {" / "}
            <span className="text-danger-muted-foreground">{formatNumber(pair.losses)}</span>
          </span>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <SwordsIcon className="size-4 text-muted-foreground" />
              {t("counterPicks.counterRanking")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {mode === "same_lane"
                ? t("counterPicks.counterRankingDescSameLane").replace("{championName}", championName)
                : t("counterPicks.counterRankingDescGlobal").replace("{championName}", championName)}
            </p>
          </div>
          <Badge emphasis="info" emphasisVariant="subtle" className="px-2 text-[10px]">
            {t("counterPicks.matchupsCount").replace("{count}", String(pairs.length))}
          </Badge>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-border/50">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-10 text-center text-[10px]">
                  {t("counterPicks.rank")}
                </TableHead>
                <TableHead className="text-[10px]">
                  {t("counterPicks.champion")}
                </TableHead>
                <TableHead className="text-[10px]">
                  <button
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort("winRate")}
                  >
                    {t("counterPicks.winRate")}
                    <SortIcon column="winRate" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="text-right text-[10px]">
                  <button
                    className="ml-auto flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort("games")}
                  >
                    {t("counterPicks.matches")}
                    <SortIcon column="games" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="text-right text-[10px] hidden sm:table-cell">
                  {t("counterPicks.winsLosses")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {initialPairs.map((pair, index) => renderRow(pair, index))}
            </TableBody>
          </Table>

          {/* Remaining rows (collapsible) */}
          {hasMore && (
            <>
              <CollapsibleContent>
                <Table>
                  <TableBody>
                    {remainingPairs.map((pair, index) =>
                      renderRow(pair, index + INITIAL_SHOW)
                    )}
                  </TableBody>
                </Table>
              </CollapsibleContent>

              <div className="border-t border-border/50 p-2">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full h-7 text-xs">
                    <ChevronDownIcon
                      className={cn(
                        "mr-1.5 size-3.5 transition-transform",
                        open && "rotate-180"
                      )}
                    />
                    {open
                      ? t("counterPicks.showLess")
                      : t("counterPicks.showMore").replace("{count}", String(remainingPairs.length))}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </>
          )}
        </div>
      </div>
    </Collapsible>
  );
};
