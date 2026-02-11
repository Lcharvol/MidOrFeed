"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { useApiSWR } from "@/lib/hooks/swr";
import { Skeleton } from "@/components/ui/skeleton";
import { TEAM_STYLES } from "@/lib/styles/game-colors";

interface GoldFrame {
  minute: number;
  blueGold: number;
  redGold: number;
  goldDiff: number;
}

interface GoldTimelineResponse {
  success: boolean;
  data?: {
    matchId: string;
    frames: GoldFrame[];
  };
}

interface GoldDifferenceChartProps {
  matchId: string;
  enabled: boolean;
}

const formatGold = (value: number) => {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return String(value);
};

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: GoldFrame }>;
}) => {
  if (!active || !payload?.[0]) return null;
  const frame = payload[0].payload;
  const diff = frame.goldDiff;
  const leader = diff > 0 ? "Blue" : diff < 0 ? "Red" : null;

  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium mb-1">{frame.minute} min</p>
      <p className="text-blue-500">Blue: {formatGold(frame.blueGold)}</p>
      <p className="text-red-500">Red: {formatGold(frame.redGold)}</p>
      {leader && (
        <p className="mt-1 font-semibold">
          {leader} +{formatGold(Math.abs(diff))}
        </p>
      )}
    </div>
  );
};

export function GoldDifferenceChart({ matchId, enabled }: GoldDifferenceChartProps) {
  const { data, isLoading } = useApiSWR<GoldTimelineResponse>(
    enabled ? `/api/matches/${matchId}/gold-timeline` : null,
    { revalidateOnFocus: false }
  );

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  const frames = data?.data?.frames;
  if (!frames || frames.length === 0) {
    return null;
  }

  return (
    <div className="h-52">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={frames} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <defs>
            <linearGradient id="goldDiffPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="goldDiffNegative" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
          <XAxis
            dataKey="minute"
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
            tickFormatter={(v) => `${v}'`}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            className="fill-muted-foreground"
            tickFormatter={formatGold}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} className="stroke-border" strokeDasharray="3 3" />
          <Area
            type="monotone"
            dataKey="goldDiff"
            stroke="#3b82f6"
            fill="url(#goldDiffPositive)"
            fillOpacity={1}
            strokeWidth={2}
            isAnimationActive={false}
          />
          {/* Second area for negative values */}
          <Area
            type="monotone"
            dataKey={(d: GoldFrame) => (d.goldDiff < 0 ? d.goldDiff : 0)}
            stroke="#ef4444"
            fill="url(#goldDiffNegative)"
            fillOpacity={1}
            strokeWidth={0}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
