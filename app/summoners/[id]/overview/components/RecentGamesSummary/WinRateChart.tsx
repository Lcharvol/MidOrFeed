"use client";

import { RadialBarChart, RadialBar, PolarRadiusAxis, Label } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import type { SummaryStats } from "./types";

interface WinRateChartProps {
  stats: SummaryStats;
  config: ChartConfig;
}

interface RadialChartData {
  wins: number;
  losses: number;
}

const calculateRadialData = (stats: SummaryStats): RadialChartData => {
  const total = stats.total;
  const winsPercent = (stats.wins / total) * 100;
  const lossesPercent = (stats.losses / total) * 100;

  return {
    wins: winsPercent,
    losses: lossesPercent,
  };
};

export const WinRateChart = ({ stats, config }: WinRateChartProps) => {
  const radialChartData = calculateRadialData(stats);

  return (
    <div className="shrink-0 flex flex-col items-center">
      <div className="text-xs text-muted-foreground mb-2">
        {stats.total}P {stats.wins}V {stats.losses}D
      </div>
      <ChartContainer
        config={config}
        className="mx-auto aspect-square max-w-[250px] w-[150px]"
      >
        <RadialBarChart
          data={[
            { wins: radialChartData.wins, losses: radialChartData.losses },
          ]}
          innerRadius={40}
          outerRadius={60}
        >
          <PolarRadiusAxis tick={false} tickLine={false} axisLine={false}>
            <Label
              content={({ viewBox }) => {
                if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                  return (
                    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle">
                      <tspan
                        x={viewBox.cx}
                        y={(viewBox.cy || 0) + 4}
                        className="fill-foreground text-xl font-bold"
                      >
                        {radialChartData.wins}%
                      </tspan>
                    </text>
                  );
                }
              }}
            />
          </PolarRadiusAxis>
          <RadialBar dataKey="wins" stackId="a" fill="var(--color-wins)" />
          <RadialBar dataKey="losses" fill="var(--color-losses)" stackId="a" />
        </RadialBarChart>
      </ChartContainer>
    </div>
  );
};
