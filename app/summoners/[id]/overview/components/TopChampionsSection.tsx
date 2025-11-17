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
import { useI18n } from "@/lib/i18n-context";
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
  const { t } = useI18n();
  if (champions.length === 0) return null;

  return (
    <Card className="border-border/70 bg-background/90 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-foreground">
          {t("summoners.topChampionsTitle")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("summoners.topChampionsDescription").replace("{count}", champions.length.toString())}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-3">
        <div className="overflow-hidden rounded-lg border border-border/60">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-border/50">
                <TableHead className="w-[50px] text-[11px] uppercase text-muted-foreground">
                  {t("summoners.rank")}
                </TableHead>
                <TableHead className="text-[11px] uppercase text-muted-foreground">
                  {t("summoners.champion")}
                </TableHead>
                <TableHead className="text-right text-[11px] uppercase text-muted-foreground">
                  {t("summoners.matches")}
                </TableHead>
                <TableHead className="text-right text-[11px] uppercase text-muted-foreground">
                  {t("summoners.victories")}
                </TableHead>
                <TableHead className="text-right text-[11px] uppercase text-muted-foreground">
                  {t("summoners.winRate")}
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
                  <TableRow key={championId} className="border-border/50">
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      #{index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ChampionIcon
                          championId={resolveSlug(championId)}
                          championKey={championId}
                          championKeyToId={championKeyToId}
                          size={36}
                          shape="rounded"
                          className="rounded-lg border border-border/60"
                          clickable
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
