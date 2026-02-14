"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUpIcon } from "lucide-react";
import { useApiSWR } from "@/lib/hooks/swr";
import { apiKeys } from "@/lib/api/keys";
import type { DraftHistoryResponse } from "@/types/draft";
import { useI18n } from "@/lib/i18n-context";

const TOOLTIP_STYLE: React.CSSProperties = {
  backgroundColor: "hsl(var(--background))",
  border: "1px solid hsl(var(--border))",
  borderRadius: "8px",
  fontSize: "12px",
};

export function DraftHistoryChart() {
  const { t } = useI18n();
  const { data, isLoading } = useApiSWR<DraftHistoryResponse>(
    apiKeys.draftHistory(30),
    { revalidateOnFocus: false }
  );

  const chartData = useMemo(() => {
    if (!data?.data?.history) return [];
    // Reverse so oldest is first (left side of chart)
    return [...data.data.history].reverse().map((entry, index) => ({
      draft: index + 1,
      winProbability: Math.round(entry.blueWinProbability * 1000) / 10,
    }));
  }, [data]);

  if (isLoading || !data?.data || chartData.length === 0) {
    return null;
  }

  const { stats } = data.data;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TrendingUpIcon className="size-4 text-primary" />
          {t("draft.history")}
        </CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{stats.totalDrafts} drafts</span>
          <span className={stats.avgBlueWinRate >= 0.5 ? "text-win" : "text-loss"}>
            {(stats.avgBlueWinRate * 100).toFixed(1)}% {t("draft.avgWinProb")}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="draft"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                label={{ value: "#", position: "insideBottomRight", offset: -5, fontSize: 10 }}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={30}
              />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(value: number) => [`${value}%`, t("draft.avgWinProb")]}
              />
              <Line
                type="monotone"
                dataKey="winProbability"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
