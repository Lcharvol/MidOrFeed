"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import type { ItemWithStats, ItemSortColumn, SortDirection } from "@/types";
import {
  computeItemScore,
  formatKDA,
  formatNumber,
  formatPercentage,
  getScoreEmphasis,
  resolveItemTier,
  parseGoldTotal,
  ITEM_MIN_APPEARANCES,
} from "../utils";
import { ItemSortIndicator } from "./ItemSortIndicator";
import { DataState } from "@/components/ui/data-state";
import { ColorBadge } from "@/components/ui/badge";
import { TierBadge } from "@/components/TierBadge";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import { DDRAGON_VERSION, getItemImageUrl } from "@/constants/ddragon";

const getWinRateColorClasses = (winRate?: number | null) => {
  if (winRate === undefined || winRate === null) return "text-muted-foreground";
  if (winRate >= 56) return "text-success font-semibold";
  if (winRate >= 52) return "text-info font-semibold";
  if (winRate >= 50) return "text-warning font-semibold";
  return "text-danger font-semibold";
};

const cleanItemName = (name: string) => name.replace(/<[^>]*>/g, "");

type ItemTierListTableProps = {
  items: ItemWithStats[];
  sortColumn: ItemSortColumn | null;
  sortDirection: SortDirection;
  onSort: (column: ItemSortColumn) => void;
  totalMatches: number;
  isLoading: boolean;
  error: unknown;
};

export const ItemTierListTable = ({
  items,
  sortColumn,
  sortDirection,
  onSort,
  isLoading,
  error,
}: ItemTierListTableProps) => {
  const { t } = useI18n();

  if (isLoading) {
    return (
      <DataState
        isLoading
        variant="plain"
        title="Chargement de la tier list..."
        containerClassName="rounded-2xl border bg-background/80 py-12"
      />
    );
  }

  if (error) {
    return (
      <DataState
        tone="danger"
        title={t("tierList.items.loadingError")}
        containerClassName="rounded-2xl"
      />
    );
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border bg-background/80 p-8 text-center text-sm text-muted-foreground">
        {t("tierList.items.noItemFound")}
      </div>
    );
  }

  // We reuse the SortIndicator from champions; it uses SortColumn type.
  // We cast our ItemSortColumn to SortColumn for compatibility.
  const getAriaSortValue = (
    column: ItemSortColumn
  ): "ascending" | "descending" | "none" => {
    if (sortColumn !== column) return "none";
    return sortDirection === "asc" ? "ascending" : "descending";
  };

  return (
    <div className="rounded-2xl border bg-background/80 shadow-sm overflow-x-auto">
      <Table className="text-xs sm:text-sm">
        <TableHeader>
          <TableRow>
            <TableHead className="w-10 sm:w-16">
              {t("tierListItems.rank")}
            </TableHead>
            <TableHead>{t("tierList.items.name")}</TableHead>
            <TableHead>{t("tierListItems.tier")}</TableHead>
            <TableHead
              className="cursor-pointer select-none hidden sm:table-cell"
              onClick={() => onSort("score")}
              role="columnheader"
              aria-sort={getAriaSortValue("score")}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSort("score")}
            >
              <div className="flex items-center">
                {t("tierListItems.score")}
                <ItemSortIndicator
                  column="score"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => onSort("winRate")}
              role="columnheader"
              aria-sort={getAriaSortValue("winRate")}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSort("winRate")}
            >
              <div className="flex items-center">
                <span className="hidden sm:inline">
                  {t("tierListItems.winRate")}
                </span>
                <span className="sm:hidden">WR</span>
                <ItemSortIndicator
                  column="winRate"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hidden md:table-cell"
              onClick={() => onSort("pickRate")}
              role="columnheader"
              aria-sort={getAriaSortValue("pickRate")}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSort("pickRate")}
            >
              <div className="flex items-center">
                {t("tierListItems.pickRate")}
                <ItemSortIndicator
                  column="pickRate"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hidden md:table-cell"
              onClick={() => onSort("avgKDA")}
              role="columnheader"
              aria-sort={getAriaSortValue("avgKDA")}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSort("avgKDA")}
            >
              <div className="flex items-center">
                {t("tierListItems.avgKDA")}
                <ItemSortIndicator
                  column="avgKDA"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none hidden sm:table-cell"
              onClick={() => onSort("gold")}
              role="columnheader"
              aria-sort={getAriaSortValue("gold")}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && onSort("gold")}
            >
              <div className="flex items-center">
                {t("tierListItems.gold")}
                <ItemSortIndicator
                  column="gold"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>
            <TableHead className="text-right hidden sm:table-cell">
              {t("tierListItems.matches")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item, index) => {
            const stats = item.stats;
            const hasStats = Boolean(stats && stats.totalGames > 0);
            const reliableStats =
              hasStats && (stats?.totalGames ?? 0) >= ITEM_MIN_APPEARANCES;
            const tier = resolveItemTier(stats);
            const scoreValue = computeItemScore(stats);
            const formattedScore =
              typeof scoreValue === "number" && Number.isFinite(scoreValue)
                ? scoreValue.toFixed(1)
                : "—";
            const winRateValue = stats?.winRate ?? null;
            const goldTotal = parseGoldTotal(item.gold);

            return (
              <TableRow key={item.id}>
                <TableCell className="font-semibold py-2 sm:py-4">
                  {index + 1}
                </TableCell>
                <TableCell className="py-2 sm:py-4">
                  <div className="flex items-center gap-2 sm:gap-3">
                    {item.image ? (
                      <Image
                        src={getItemImageUrl(item.image, DDRAGON_VERSION)}
                        alt={cleanItemName(item.name)}
                        width={32}
                        height={32}
                        className="rounded sm:w-10 sm:h-10"
                      />
                    ) : (
                      <div className="size-8 sm:size-10 rounded bg-muted" />
                    )}
                    <p className="font-semibold leading-none text-xs sm:text-sm truncate max-w-[120px] sm:max-w-[200px]">
                      {cleanItemName(item.name)}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="py-2 sm:py-4">
                  <TierBadge
                    tier={tier}
                    className="text-[10px] sm:text-xs"
                  />
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
                    <span className="text-muted-foreground text-xs sm:text-sm">
                      —
                    </span>
                  )}
                </TableCell>
                <TableCell className="py-2 sm:py-4">
                  {hasStats ? (
                    <span
                      className={cn(
                        "text-xs sm:text-sm",
                        getWinRateColorClasses(winRateValue)
                      )}
                    >
                      {formatPercentage(winRateValue ?? undefined)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground text-xs sm:text-sm">
                      —
                    </span>
                  )}
                </TableCell>
                <TableCell className="hidden md:table-cell py-2 sm:py-4">
                  {hasStats
                    ? formatPercentage(stats?.pickRate)
                    : "—"}
                </TableCell>
                <TableCell className="hidden md:table-cell py-2 sm:py-4">
                  {formatKDA(stats?.avgKDA)}
                </TableCell>
                <TableCell className="hidden sm:table-cell py-2 sm:py-4">
                  {goldTotal > 0 ? (
                    <div className="flex items-center gap-1 text-xs sm:text-sm">
                      {formatNumber(goldTotal)}
                      <Image
                        src="/gold-piece.png"
                        alt="Gold"
                        width={14}
                        height={14}
                        className="sm:w-4 sm:h-4"
                      />
                    </div>
                  ) : (
                    "—"
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
