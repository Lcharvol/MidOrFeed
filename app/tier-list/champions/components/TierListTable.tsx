"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChampionIcon } from "@/components/ChampionIcon";
import { MATCHES_FETCH_LIMIT } from "@/constants/matches";
import type {
  TierListChampionWithStats,
  SortColumn,
  SortDirection,
} from "@/types";
import {
  computeChampionScore,
  formatKDA,
  formatNumber,
  formatPercentage,
  getRoleMeta,
  getScoreEmphasis,
  resolveTier,
} from "../utils";
import { SortIndicator } from "./SortIndicator";
import { Loader2Icon, TrendingUpIcon, TrendingDownIcon } from "lucide-react";
import { ColorBadge } from "@/components/ui/badge";
import { TierBadge } from "@/components/TierBadge";
import Link from "next/link";
import { WeakAgainst } from "./WeakAgainst";
import { useChampions } from "@/lib/hooks/use-champions";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import type { WinRateTrend } from "@/types";

const getWinRateColorClasses = (winRate?: number | null) => {
  if (winRate === undefined || winRate === null) return "text-muted-foreground";
  if (winRate >= 56) return "text-success font-semibold";
  if (winRate >= 52) return "text-info font-semibold";
  if (winRate >= 50) return "text-warning font-semibold";
  return "text-danger font-semibold";
};

const WinRateTrendIndicator = ({ trend }: { trend?: WinRateTrend | null }) => {
  // Ne rien afficher si pas de tendance ou si stable
  if (!trend || trend.trend === "stable" || trend.change === 0) {
    return null;
  }

  const isUp = trend.trend === "up";
  const Icon = isUp ? TrendingUpIcon : TrendingDownIcon;
  const colorClass = isUp ? "text-success" : "text-danger";

  return (
    <span
      className={cn("ml-1.5 inline-flex items-center", colorClass)}
      title={
        isUp
          ? `+${trend.change.toFixed(1)}% par rapport à la dernière analyse`
          : `-${trend.change.toFixed(1)}% par rapport à la dernière analyse`
      }
      aria-label={
        isUp
          ? `Hausse de ${trend.change.toFixed(
              1
            )}% par rapport à la dernière analyse`
          : `Baisse de ${trend.change.toFixed(
              1
            )}% par rapport à la dernière analyse`
      }
    >
      <Icon className="size-3.5" />
    </span>
  );
};

type TierListTableProps = {
  champions: TierListChampionWithStats[];
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  onSort: (column: SortColumn) => void;
  totalMatches: number;
  isLoading: boolean;
  error: unknown;
};

export const TierListTable = ({
  champions,
  sortColumn,
  sortDirection,
  onSort,
  totalMatches,
  isLoading,
  error,
}: TierListTableProps) => {
  const { t } = useI18n();
  const { championNameMap } = useChampions();
  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border bg-background/80 py-12">
        <Loader2Icon className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive bg-destructive/10 p-6 text-center">
        <p className="font-medium text-destructive">
          {t("tierListChampions.loadingError")}
        </p>
      </div>
    );
  }

  if (champions.length === 0) {
    return (
      <div className="rounded-2xl border bg-background/80 p-8 text-center text-sm text-muted-foreground">
        {t("tierListChampions.noChampionFound")}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-background/80 shadow-sm overflow-x-auto">
      <Table className="text-xs sm:text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 sm:w-16">{t("tierListChampions.rank")}</TableHead>
            <TableHead className="w-10 sm:w-24 hidden sm:table-cell">{t("tierListChampions.role")}</TableHead>
            <TableHead>{t("tierListChampions.champion")}</TableHead>
            <TableHead>{t("tierListChampions.tier")}</TableHead>
            <TableHead
              className="cursor-pointer select-none hidden sm:table-cell"
              onClick={() => onSort("score")}
            >
              <div className="flex items-center">
                {t("tierListChampions.score")}
                <SortIndicator
                  column="score"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => onSort("winRate")}
            >
              <div className="flex items-center">
                <span className="hidden sm:inline">{t("tierListChampions.winRate")}</span>
                <span className="sm:hidden">WR</span>
                <SortIndicator
                  column="winRate"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hidden md:table-cell"
              onClick={() => onSort("totalGames")}
            >
              <div className="flex items-center">
                {t("tierListChampions.pickRate")}
                <SortIndicator
                  column="totalGames"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hidden md:table-cell"
              onClick={() => onSort("avgKDA")}
            >
              <div className="flex items-center">
                {t("tierListChampions.avgKDA")}
                <SortIndicator
                  column="avgKDA"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>
            <TableHead className="hidden lg:table-cell">{t("tierListChampions.weakAgainst")}</TableHead>
            <TableHead className="text-right hidden sm:table-cell">{t("tierListChampions.matches")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {champions.map((champion, index) => {
            const stats = champion.stats;
            const hasStats = Boolean(stats && stats.totalGames > 0);
            const reliableStats =
              hasStats && (stats?.totalGames ?? 0) >= MATCHES_FETCH_LIMIT;
            const tier = resolveTier(stats);
            const roleMeta = getRoleMeta(
              stats?.topRole ?? stats?.topLane ?? undefined
            );
            const { Icon: RoleIcon } = roleMeta;
            const pickRate =
              hasStats && totalMatches > 0
                ? (Number(stats?.totalGames) / totalMatches) * 100
                : 0;
            const scoreValue = computeChampionScore(stats);
            const formattedScore =
              typeof scoreValue === "number" && Number.isFinite(scoreValue)
                ? scoreValue.toFixed(1)
                : "—";
            const winRateValue = stats?.winRate ?? null;

            return (
              <TableRow key={champion.id}>
                <TableCell className="font-semibold py-2 sm:py-4">{index + 1}</TableCell>
                <TableCell className="hidden sm:table-cell py-2 sm:py-4">
                  <div className="flex items-center">
                    <RoleIcon
                      className="size-4 sm:size-5 text-primary"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{roleMeta.label}</span>
                  </div>
                </TableCell>
                <TableCell className="py-2 sm:py-4">
                  <Link
                    href={`/champions/${encodeURIComponent(
                      champion.championId
                    )}`}
                    className="flex items-center gap-2 sm:gap-3 transition hover:text-primary"
                  >
                    <ChampionIcon
                      championId={champion.championId}
                      size={32}
                      className="sm:w-12 sm:h-12"
                      alt={champion.name}
                    />
                    <div className="space-y-0.5 sm:space-y-1 min-w-0">
                      <p className="font-semibold leading-none text-xs sm:text-sm truncate">
                        {champion.name}
                      </p>
                      <p className="text-[10px] sm:text-xs text-muted-foreground truncate hidden sm:block">
                        {champion.title}
                      </p>
                      {/* Mobile: show role icon inline */}
                      <div className="flex items-center gap-1 sm:hidden">
                        <RoleIcon className="size-3 text-primary" />
                        <span className="text-[10px] text-muted-foreground">{roleMeta.label}</span>
                      </div>
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="py-2 sm:py-4">
                  <TierBadge tier={tier} className="text-[10px] sm:text-xs" />
                </TableCell>
                <TableCell className="hidden sm:table-cell py-2 sm:py-4">
                  {reliableStats ? (
                    <ColorBadge
                      emphasis={getScoreEmphasis(scoreValue)}
                      variant="subtle"
                      className="px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs font-semibold"
                    >
                      {formattedScore}
                    </ColorBadge>
                  ) : (
                    <span className="text-muted-foreground text-xs sm:text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="py-2 sm:py-4">
                  {hasStats ? (
                    <span
                      className={cn(
                        "text-xs sm:text-sm inline-flex items-center",
                        getWinRateColorClasses(winRateValue)
                      )}
                    >
                      {formatPercentage(winRateValue ?? undefined)}
                      <WinRateTrendIndicator trend={stats?.winRateTrend} />
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs sm:text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell py-2 sm:py-4">{formatPercentage(pickRate)}</TableCell>
                <TableCell className="hidden md:table-cell py-2 sm:py-4">{formatKDA(stats?.avgKDA)}</TableCell>
                <TableCell className="hidden lg:table-cell py-2 sm:py-4">
                  {reliableStats ? (
                    <WeakAgainst
                      weakAgainst={stats?.weakAgainst ?? null}
                      championNameMap={championNameMap}
                    />
                  ) : (
                    <span className="text-muted-foreground text-xs sm:text-sm">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right hidden sm:table-cell py-2 sm:py-4">
                  {hasStats ? formatNumber(stats?.totalGames) : "—"}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
