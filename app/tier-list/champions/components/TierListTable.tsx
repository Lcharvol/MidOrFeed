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
  getTierBadgeEmphasis,
  getWinRateEmphasis,
  resolveTier,
} from "../utils";
import { SortIndicator } from "./SortIndicator";
import { Loader2Icon } from "lucide-react";
import { ColorBadge } from "@/components/ui/color-badge";
import Link from "next/link";

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
          Erreur lors du chargement des champions
        </p>
      </div>
    );
  }

  if (champions.length === 0) {
    return (
      <div className="rounded-2xl border bg-background/80 p-8 text-center text-sm text-muted-foreground">
        Aucun champion trouvé
      </div>
    );
  }

  return (
    <div className="rounded-2xl border bg-background/80 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Rank</TableHead>
            <TableHead className="w-24">Rôle</TableHead>
            <TableHead>Champion</TableHead>
            <TableHead>Tier</TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => onSort("score")}
            >
              <div className="flex items-center">
                Score
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
                Win Rate
                <SortIndicator
                  column="winRate"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => onSort("totalGames")}
            >
              <div className="flex items-center">
                Pick Rate
                <SortIndicator
                  column="totalGames"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => onSort("avgKDA")}
            >
              <div className="flex items-center">
                KDA moyen
                <SortIndicator
                  column="avgKDA"
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                />
              </div>
            </TableHead>
            <TableHead className="text-right">Matches</TableHead>
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
                <TableCell className="font-semibold">#{index + 1}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <RoleIcon
                      className="size-5 text-primary"
                      aria-hidden="true"
                    />
                    <span className="sr-only">{roleMeta.label}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Link
                    href={`/champions/${encodeURIComponent(champion.championId)}`}
                    className="flex items-center gap-3 transition hover:text-primary"
                  >
                    <ChampionIcon
                      championId={champion.championId}
                      size={48}
                      alt={champion.name}
                    />
                    <div className="space-y-1">
                      <p className="font-semibold leading-none">
                        {champion.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {champion.title}
                      </p>
                    </div>
                  </Link>
                </TableCell>
                <TableCell>
                  <ColorBadge
                    emphasis={getTierBadgeEmphasis(tier)}
                    variant="subtle"
                    className="px-3 py-1 text-xs font-semibold uppercase tracking-wide"
                  >
                    {tier}
                  </ColorBadge>
                </TableCell>
                <TableCell>
                  {reliableStats ? (
                    <ColorBadge
                      emphasis={getScoreEmphasis(scoreValue)}
                      variant="subtle"
                      className="px-3 py-1 text-xs font-semibold"
                    >
                      {formattedScore}
                    </ColorBadge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>
                  {hasStats ? (
                    <ColorBadge
                      emphasis={getWinRateEmphasis(winRateValue ?? undefined)}
                      variant="subtle"
                      className="px-3 py-1 text-xs font-semibold"
                    >
                      {formatPercentage(winRateValue ?? undefined)}
                    </ColorBadge>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>{formatPercentage(pickRate)}</TableCell>
                <TableCell>{formatKDA(stats?.avgKDA)}</TableCell>
                <TableCell className="text-right">
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
