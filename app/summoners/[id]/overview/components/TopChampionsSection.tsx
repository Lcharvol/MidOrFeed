"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChampionIcon } from "@/components/ChampionIcon";
import { TopChampionEntry } from "@/lib/summoners/overview";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
const formatPercent = (value: number) =>
  `${(Number.isFinite(value) ? value * 100 : 0).toFixed(1)}%`;

interface TopChampionsSectionProps {
  champions: TopChampionEntry[];
  championIdToName: Map<string, string>;
  championKeyToId: Map<string, string>;
  resolveSlug: (idOrKey: string) => string;
}

export const TopChampionsSection = ({
  champions,
  championIdToName,
  championKeyToId,
  resolveSlug,
}: TopChampionsSectionProps) => {
  if (champions.length === 0) return null;

  return (
    <Card className="border-border/80 bg-background/95 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Top champions
        </CardTitle>
        <CardDescription>
          Vos meilleurs champions sur les {champions.length} dernières sélections.
        </CardDescription>
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
                  Matchs
                </TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground text-right">
                  Victoires
                </TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground text-right">
                  Win rate
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {champions.map(({ championId, stats }, index) => {
                const winRate =
                  stats.played === 0
                    ? 0
                    : stats.wins / Math.max(stats.played, 1);
                const championName =
                  championIdToName.get(championId) ?? championId;

                return (
                  <TableRow key={championId} className="border-border/60">
                    <TableCell className="text-sm font-medium text-muted-foreground">
                      #{index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ChampionIcon
                          championId={resolveSlug(championId)}
                          championKey={championId}
                          championKeyToId={championKeyToId}
                          size={40}
                          shape="rounded"
                          className="rounded-xl border border-border/60"
                        />
                        <span className="text-sm font-semibold text-foreground">
                          {championName}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {stats.played}
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {stats.wins}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium text-foreground">
                      {formatPercent(winRate)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
