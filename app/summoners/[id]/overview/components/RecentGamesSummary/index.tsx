"use client";

import { CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SearchIcon } from "lucide-react";
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { LazyLoadingFallback } from "@/lib/lazy-components";
import { KDAStats } from "./KDAStats";
import { ChampionsPlayed } from "./ChampionsPlayed";
import { createWinRateChartConfig } from "./constants";
import {
  calculateSummaryStats,
  calculateChampionStats,
  calculateRoleData,
} from "./utils";
import type { RecentGamesSummaryProps } from "./types";

// Lazy load les composants de chart (bibliothèque recharts lourde)
const WinRateChart = dynamic(
  () => import("./WinRateChart").then((mod) => ({ default: mod.WinRateChart })),
  { loading: () => <div className="w-[150px] h-[150px]" />, ssr: false }
);

const PreferredRoleChart = dynamic(
  () =>
    import("./PreferredRoleChart").then((mod) => ({
      default: mod.PreferredRoleChart,
    })),
  { loading: () => <div className="w-full h-[80px]" />, ssr: false }
);

export const RecentGamesSummary = ({
  matches,
  championKeyToId,
  resolveSlug,
  rolePerformance = [],
}: RecentGamesSummaryProps) => {
  const winRateChartConfig = useMemo(() => {
    const winsColor = "var(--primary)";
    const lossesColor = "var(--destructive)";
    return createWinRateChartConfig(winsColor, lossesColor);
  }, []);

  const summaryStats = useMemo(() => calculateSummaryStats(matches), [matches]);

  const championStats = useMemo(
    () => calculateChampionStats(matches),
    [matches]
  );

  const roleData = useMemo(
    () => calculateRoleData(rolePerformance),
    [rolePerformance]
  );

  if (!summaryStats || matches.length === 0) {
    return null;
  }

  return (
    <Card className="bg-background/90">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Parties récentes</CardTitle>
        <div className="relative w-full sm:w-55">
          <SearchIcon className="absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher un champion"
            className="h-8 pl-8 text-xs"
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <WinRateChart stats={summaryStats} config={winRateChartConfig} />
            <KDAStats stats={summaryStats} />
          </div>
          <ChampionsPlayed
            champions={championStats}
            totalMatches={matches.length}
            championKeyToId={championKeyToId}
            resolveSlug={resolveSlug}
          />
          <PreferredRoleChart roleData={roleData} />
        </div>
      </CardContent>
    </Card>
  );
};
