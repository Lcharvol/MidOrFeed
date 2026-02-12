"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
      return <TrophyIcon className="size-4 text-warning" />;
    case 1:
      return <MedalIcon className="size-4 text-muted-foreground" />;
    case 2:
      return <AwardIcon className="size-4 text-amber-700 dark:text-amber-500" />;
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
    return <ChevronsUpDownIcon className="ml-1 size-3.5 opacity-50" />;
  }
  return sortDir === "asc"
    ? <ArrowUpIcon className="ml-1 size-3.5" />
    : <ArrowDownIcon className="ml-1 size-3.5" />;
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
        <TableCell className="w-12 text-center">
          {isTopThree ? (
            <div
              className={cn(
                "mx-auto flex size-7 items-center justify-center rounded-full border",
                getRankBadge(index)
              )}
            >
              {getRankIcon(index)}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground">{index + 1}</span>
          )}
        </TableCell>

        {/* Champion */}
        <TableCell>
          <Link
            href={`/champions/${encodeURIComponent(pair.enemyChampionId)}`}
            className="flex items-center gap-3 hover:underline"
          >
            <ChampionIcon
              championId={pair.enemyChampionId}
              size={36}
              shape="circle"
              className={cn(
                "border-2 shrink-0",
                isTopThree ? "border-primary/30" : "border-border/50"
              )}
            />
            <span className={cn("font-medium", isTopThree && "text-foreground")}>
              {enemyName}
            </span>
          </Link>
        </TableCell>

        {/* Win Rate */}
        <TableCell>
          <div className="flex items-center gap-3">
            <div className="hidden sm:block flex-1 max-w-24">
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
        </TableCell>

        {/* Matches */}
        <TableCell className="text-right">
          <span className="text-sm text-muted-foreground tabular-nums">
            {formatNumber(pair.games)}
          </span>
        </TableCell>

        {/* W / L */}
        <TableCell className="text-right hidden sm:table-cell">
          <span className="text-sm tabular-nums">
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
      <Card className="border-border/50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <SwordsIcon className="size-5 text-muted-foreground" />
                {t("counterPicks.counterRanking")}
              </CardTitle>
              <CardDescription>
                {mode === "same_lane"
                  ? t("counterPicks.counterRankingDescSameLane").replace("{championName}", championName)
                  : t("counterPicks.counterRankingDescGlobal").replace("{championName}", championName)}
              </CardDescription>
            </div>
            <Badge emphasis="info" emphasisVariant="subtle" className="px-3">
              {t("counterPicks.matchupsCount").replace("{count}", String(pairs.length))}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="w-12 text-center text-xs">
                  {t("counterPicks.rank")}
                </TableHead>
                <TableHead className="text-xs">
                  {t("counterPicks.champion")}
                </TableHead>
                <TableHead className="text-xs">
                  <button
                    className="flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort("winRate")}
                  >
                    {t("counterPicks.winRate")}
                    <SortIcon column="winRate" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="text-right text-xs">
                  <button
                    className="ml-auto flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort("games")}
                  >
                    {t("counterPicks.matches")}
                    <SortIcon column="games" sortKey={sortKey} sortDir={sortDir} />
                  </button>
                </TableHead>
                <TableHead className="text-right text-xs hidden sm:table-cell">
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

              <div className="border-t border-border/50 p-4">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full">
                    <ChevronDownIcon
                      className={cn(
                        "mr-2 size-4 transition-transform",
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
        </CardContent>
      </Card>
    </Collapsible>
  );
};
