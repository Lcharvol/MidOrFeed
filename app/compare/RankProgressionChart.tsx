"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { PlayerData } from "./types";

export const RankProgressionChart = ({
  player1,
  player2,
}: {
  player1: PlayerData;
  player2: PlayerData;
}) => {
  const tierToValue = (tier: string, rank: string, lp: number): number => {
    const tierValues: Record<string, number> = {
      IRON: 0, BRONZE: 400, SILVER: 800, GOLD: 1200,
      PLATINUM: 1600, EMERALD: 2000, DIAMOND: 2400,
      MASTER: 2800, GRANDMASTER: 3200, CHALLENGER: 3600,
    };
    const rankValues: Record<string, number> = { IV: 0, III: 100, II: 200, I: 300 };
    return (tierValues[tier] || 0) + (rankValues[rank] || 0) + lp;
  };

  const data = useMemo(() => {
    const allDates = new Set<string>();
    player1.rankProgression.forEach(r => allDates.add(r.date));
    player2.rankProgression.forEach(r => allDates.add(r.date));

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map(date => {
      const p1Entry = player1.rankProgression.find(r => r.date === date);
      const p2Entry = player2.rankProgression.find(r => r.date === date);

      return {
        date: new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
        p1: p1Entry ? tierToValue(p1Entry.tier, p1Entry.rank, p1Entry.lp) : null,
        p2: p2Entry ? tierToValue(p2Entry.tier, p2Entry.rank, p2Entry.lp) : null,
      };
    });
  }, [player1.rankProgression, player2.rankProgression]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        Pas de donnees de progression
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="p1"
            name={player1.gameName}
            stroke="hsl(221 83% 53%)"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="p2"
            name={player2.gameName}
            stroke="hsl(0 84% 60%)"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
