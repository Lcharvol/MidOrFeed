"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis } from "recharts";
import type { ChartConfig } from "@/components/ui/chart";
import { RolePerformanceEntry } from "@/lib/summoners/overview";

interface RolePerformanceRadarProps {
  entries: RolePerformanceEntry[];
}

const roleChartConfig = {
  winRate: {
    label: "Win rate",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

export const RolePerformanceRadar = ({
  entries,
}: RolePerformanceRadarProps) => {
  const chartData = useMemo(
    () =>
      entries.map((entry) => ({
        role: entry.role,
        winRate: Number(entry.winRate.toFixed(1)),
        matches: entry.stats.played,
      })),
    [entries]
  );

  if (chartData.length === 0) return null;

  return (
    <Card className="border-border/70 bg-background/90 shadow-sm">
      <CardHeader className="pb-1.5 pt-2.5">
        <CardTitle className="text-sm font-semibold text-foreground">
          Performance par rôle
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2.5 pt-0">
        <ChartContainer
          config={roleChartConfig}
          className="mx-auto aspect-square max-h-[180px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, key, item) => {
                    if (key === "winRate") {
                      return `${value}%`;
                    }
                    const matches =
                      item && "payload" in item && item.payload
                        ? (item.payload as { matches?: number }).matches ?? 0
                        : 0;
                    return `${matches} parties`;
                  }}
                />
              }
            />
            <PolarGrid
              className="fill-(--color-winRate) opacity-20"
              gridType="circle"
            />
            <PolarAngleAxis 
              dataKey="role" 
              tick={{ fontSize: 10, fill: "currentColor" }} 
            />
            <Radar
              dataKey="winRate"
              fill="var(--color-winRate)"
              fillOpacity={0.5}
              dot={{ fill: "var(--color-winRate)", r: 3 }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

