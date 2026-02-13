"use client";

import { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import type { PlayerData } from "./types";

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

export const PlaystyleRadar = ({
  player1,
  player2,
}: {
  player1: PlayerData;
  player2: PlayerData;
}) => {
  const data = useMemo(() => [
    { metric: "Agressivite", p1: player1.playstyle.aggressionScore, p2: player2.playstyle.aggressionScore },
    { metric: "Vision", p1: player1.playstyle.visionScore, p2: player2.playstyle.visionScore },
    { metric: "Farm", p1: player1.playstyle.farmingScore, p2: player2.playstyle.farmingScore },
    { metric: "Teamfight", p1: player1.playstyle.teamfightScore, p2: player2.playstyle.teamfightScore },
    { metric: "Survie", p1: player1.playstyle.survivabilityScore, p2: player2.playstyle.survivabilityScore },
    { metric: "Early Game", p1: player1.playstyle.earlyGameScore, p2: player2.playstyle.earlyGameScore },
    { metric: "Objectifs", p1: player1.playstyle.objectiveScore, p2: player2.playstyle.objectiveScore },
  ], [player1.playstyle, player2.playstyle]);

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid className="stroke-muted" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
          <Radar
            name={player1.gameName}
            dataKey="p1"
            stroke="hsl(221 83% 53%)"
            fill="hsl(221 83% 53%)"
            fillOpacity={0.3}
          />
          <Radar
            name={player2.gameName}
            dataKey="p2"
            stroke="hsl(0 84% 60%)"
            fill="hsl(0 84% 60%)"
            fillOpacity={0.3}
          />
          <Legend />
          <Tooltip contentStyle={TOOLTIP_STYLE} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};
