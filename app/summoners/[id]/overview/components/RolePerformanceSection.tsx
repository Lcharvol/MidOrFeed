"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { RolePerformanceEntry } from "@/lib/summoners/overview";

interface RolePerformanceSectionProps {
  entries: RolePerformanceEntry[];
}

const formatPercent = (value: number) =>
  `${(Number.isFinite(value) ? value : 0).toFixed(1)}%`;

export const RolePerformanceSection = ({
  entries,
}: RolePerformanceSectionProps) => {
  if (entries.length === 0) return null;

  return (
    <Card className="border-border/80 bg-background/95 shadow-sm">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-foreground">
          Performance par rôle
        </CardTitle>
        <CardDescription>
          Comparaison de vos statistiques selon la position jouée.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-lg border border-border/70">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="border-border/60">
                <TableHead className="text-xs uppercase text-muted-foreground">
                  Rôle
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
              {entries.map(({ role, stats, winRate }) => (
                <TableRow key={role} className="border-border/60">
                  <TableCell className="text-sm font-medium text-foreground">
                    {role}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {stats.played}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {stats.wins}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "text-right text-sm font-medium",
                      winRate >= 50
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    )}
                  >
                    {formatPercent(winRate)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
