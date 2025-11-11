"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChampionIcon } from "@/components/ChampionIcon";
import { StatChip } from "./StatChip";
import { formatDateTime, formatNumber, formatPercent } from "../utils";
import type { CounterPickPair } from "@/types";

type CounterPickTableProps = {
  championName: string;
  pairs: CounterPickPair[];
  championNameMap: Map<string, string>;
};

export const CounterPickTable = ({
  championName,
  pairs,
  championNameMap,
}: CounterPickTableProps) => (
  <Card className="border-border/80 bg-background/95 shadow-sm">
    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <CardTitle className="text-xl font-semibold text-foreground">
          Tableau des counter picks
        </CardTitle>
        <CardDescription>
          Champions les plus efficaces pour faire tomber {championName}.
        </CardDescription>
      </div>
      <Badge
        variant="outline"
        className="border-border/60 px-3 py-1 text-xs text-muted-foreground"
      >
        {pairs.length} matchups
      </Badge>
    </CardHeader>
    <CardContent>
      <div className="overflow-hidden rounded-lg border border-border/70">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border/60">
              <TableHead className="w-[60px] text-xs uppercase text-muted-foreground">
                Rang
              </TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">
                Champion
              </TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground text-right">
                Win rate couter
              </TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground text-right">
                Win rate {championName}
              </TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground text-right">
                Matchs
              </TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground text-right">
                Dernier match
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pairs.map((pair, index) => {
              const enemyName =
                championNameMap.get(pair.enemyChampionId) ?? pair.enemyChampionId;
              const championWinRate = pair.games > 0 ? 1 - pair.winRate : 0;

              return (
                <TableRow
                  key={pair.enemyChampionId}
                  className="border-border/70 transition hover:bg-muted/40"
                >
                  <TableCell className="text-sm font-medium text-muted-foreground">
                    #{index + 1}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ChampionIcon
                        championId={pair.enemyChampionId}
                        size={40}
                        shape="rounded"
                        className="rounded-xl border border-border/60"
                      />
                      <span className="text-sm font-semibold text-foreground">
                        {enemyName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium text-foreground">
                    {formatPercent(pair.winRate)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatPercent(championWinRate)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatNumber(pair.games)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatDateTime(Number(pair.lastPlayedAt))}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-sm">
        <StatChip
          label="Top couter"
          value={
            pairs[0]
              ? championNameMap.get(pairs[0].enemyChampionId) ??
                pairs[0].enemyChampionId
              : "—"
          }
        />
        <StatChip
          label="Win rate moyen"
          value={
            pairs.length > 0
              ? formatPercent(
                  pairs.reduce((acc, pair) => acc + pair.winRate, 0) /
                    pairs.length
                )
              : "0.0%"
          }
        />
      </div>
    </CardContent>
  </Card>
);


