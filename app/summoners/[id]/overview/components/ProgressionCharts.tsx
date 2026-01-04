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
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUpIcon, TargetIcon, UsersIcon } from "lucide-react";
import { useApiSWR } from "@/lib/hooks/swr";

interface ProgressionChartsProps {
  puuid: string;
}

type DailyData = {
  date: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  dailyWinRate: number;
  kda: number;
  cumulativeGames: number;
};

type RoleData = {
  role: string;
  games: number;
  wins: number;
  winRate: number;
};

type HistoryResponse = {
  success: boolean;
  data: {
    daily: DailyData[];
    roles: RoleData[];
    summary: {
      totalGames: number;
      totalWins: number;
      winRate: number;
      period: number;
    };
  };
};

const ROLE_LABELS: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  MID: "Mid",
  BOTTOM: "ADC",
  BOT: "ADC",
  UTILITY: "Support",
  SUPPORT: "Support",
  NONE: "Fill",
  UNKNOWN: "Autre",
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

export function ProgressionCharts({ puuid }: ProgressionChartsProps) {
  const { data, isLoading } = useApiSWR<HistoryResponse>(
    `/api/summoners/${puuid}/history?days=30`,
    { revalidateOnFocus: false }
  );

  const chartData = useMemo(() => {
    if (!data?.data?.daily) return [];
    return data.data.daily.map((d) => ({
      ...d,
      dateLabel: formatDate(d.date),
    }));
  }, [data]);

  const roleData = useMemo(() => {
    if (!data?.data?.roles) return [];
    return data.data.roles
      .map((r) => ({
        ...r,
        roleLabel: ROLE_LABELS[r.role] || r.role,
        fullMark: 100,
      }))
      .filter((r) => r.games >= 1)
      .sort((a, b) => b.games - a.games)
      .slice(0, 5);
  }, [data]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.data || chartData.length === 0) {
    return null;
  }

  const { summary } = data.data;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TrendingUpIcon className="size-4 text-primary" />
          Progression (30 jours)
        </CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{summary.totalGames} parties</span>
          <span>{summary.totalWins} victoires</span>
          <span className={summary.winRate >= 50 ? "text-win" : "text-loss"}>
            {summary.winRate}% WR
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="winrate" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="winrate" className="text-xs">
              <TargetIcon className="size-3 mr-1" />
              Win Rate
            </TabsTrigger>
            <TabsTrigger value="games" className="text-xs">
              <TrendingUpIcon className="size-3 mr-1" />
              Parties
            </TabsTrigger>
            <TabsTrigger value="roles" className="text-xs">
              <UsersIcon className="size-3 mr-1" />
              Roles
            </TabsTrigger>
          </TabsList>

          <TabsContent value="winrate" className="mt-0">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`${value}%`, "Win Rate"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="winRate"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="games" className="mt-0">
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="dateLabel"
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={30}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--background))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="wins"
                    stackId="1"
                    stroke="hsl(142 76% 36%)"
                    fill="hsl(142 76% 36% / 0.5)"
                    name="Victoires"
                  />
                  <Area
                    type="monotone"
                    dataKey="losses"
                    stackId="1"
                    stroke="hsl(0 84% 60%)"
                    fill="hsl(0 84% 60% / 0.5)"
                    name="Defaites"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </TabsContent>

          <TabsContent value="roles" className="mt-0">
            <div className="h-[200px] w-full">
              {roleData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={roleData} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid className="stroke-muted" />
                    <PolarAngleAxis dataKey="roleLabel" tick={{ fontSize: 10 }} />
                    <PolarRadiusAxis tick={{ fontSize: 8 }} domain={[0, 100]} />
                    <Radar
                      name="Win Rate"
                      dataKey="winRate"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.3}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--background))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [`${value}%`, "Win Rate"]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                  Pas assez de donnees
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
