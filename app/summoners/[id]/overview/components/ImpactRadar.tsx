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

interface ImpactRadarProps {
  averages?: {
    kills: number;
    deaths: number;
    assists: number;
  };
}

const impactChartConfig = {
  impact: {
    label: "Impact",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

// Valeurs de référence pour normaliser les métriques KDA (percentile 75 environ)
const REFERENCE_VALUES = {
  kills: 6,
  deaths: 5,
  assists: 8,
};

export const ImpactRadar = ({ averages }: ImpactRadarProps) => {
  const chartData = useMemo(() => {
    if (!averages) return [];

    // Pour les morts : on normalise en inversant (moins de morts = meilleur score)
    const maxDeaths = Math.max(REFERENCE_VALUES.deaths, averages.deaths);
    const deathsScore =
      averages.deaths === 0
        ? 100
        : Math.max(0, ((maxDeaths - averages.deaths) / maxDeaths) * 100);

    return [
      {
        métrique: "Éliminations",
        value: Math.min(
          100,
          Math.max(0, (averages.kills / REFERENCE_VALUES.kills) * 100)
        ),
        raw: averages.kills,
      },
      {
        métrique: "Assistances",
        value: Math.min(
          100,
          Math.max(0, (averages.assists / REFERENCE_VALUES.assists) * 100)
        ),
        raw: averages.assists,
      },
      {
        métrique: "Morts",
        value: deathsScore,
        raw: averages.deaths,
      },
    ];
  }, [averages]);

  if (chartData.length === 0) return null;

  return (
    <Card className="border-border/70 bg-background/90 shadow-sm">
      <CardHeader className="pb-1.5 pt-2.5">
        <CardTitle className="text-sm font-semibold text-foreground">
          Impact KDA
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-2.5 pt-0">
        <ChartContainer
          config={impactChartConfig}
          className="mx-auto aspect-square max-h-[180px]"
        >
          <RadarChart
            data={chartData}
            margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          >
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value, key, item) => {
                    if (key === "value") {
                      const raw =
                        item && "payload" in item && item.payload
                          ? (item.payload as { raw?: number }).raw ?? 0
                          : 0;
                      return `${raw.toFixed(1)}`;
                    }
                    return null;
                  }}
                />
              }
            />
            <PolarGrid
              className="fill-(--color-impact) opacity-20"
              gridType="circle"
            />
            <PolarAngleAxis
              dataKey="métrique"
              tick={{ fontSize: 10, fill: "currentColor" }}
              className="text-xs"
            />
            <Radar
              dataKey="value"
              fill="var(--color-impact)"
              fillOpacity={0.5}
              dot={{ fill: "var(--color-impact)", r: 3 }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};

