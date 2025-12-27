"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ChampionIcon } from "@/components/ChampionIcon";
import { useApiSWR } from "@/lib/hooks/swr";
import { useChampions } from "@/lib/hooks/use-champions";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";
import {
  TrendingUpIcon,
  TrendingDownIcon,
  SparklesIcon,
  TargetIcon,
  ShieldIcon,
  SwordIcon,
} from "lucide-react";

interface ChampionPoolAdvisorProps {
  puuid: string;
}

interface ChampionStats {
  championId: string;
  games: number;
  wins: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  avgKDA: number;
}

interface PoolAnalysisResponse {
  success: boolean;
  data: {
    strengths: ChampionStats[];
    needsWork: ChampionStats[];
    recommended: ChampionStats[];
    roleDistribution: Record<string, number>;
    poolDiversity: number;
    totalGamesAnalyzed: number;
  };
}

const ROLE_ICONS: Record<string, typeof SwordIcon> = {
  TOP: ShieldIcon,
  JUNGLE: TargetIcon,
  MIDDLE: SparklesIcon,
  BOTTOM: SwordIcon,
  UTILITY: ShieldIcon,
  SUPPORT: ShieldIcon,
};

const ROLE_LABELS: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
  SUPPORT: "Support",
};

export function ChampionPoolAdvisor({ puuid }: ChampionPoolAdvisorProps) {
  const { t } = useI18n();
  const { resolveName, resolveSlug, championKeyToIdMap } = useChampions();

  const { data, isLoading } = useApiSWR<PoolAnalysisResponse>(
    puuid ? `/api/summoners/${puuid}/champion-pool` : null,
    { revalidateOnFocus: false }
  );

  const analysis = useMemo(() => data?.data, [data]);

  // Calculate main role from distribution
  const mainRole = useMemo(() => {
    if (!analysis?.roleDistribution) return null;
    const entries = Object.entries(analysis.roleDistribution);
    if (entries.length === 0) return null;
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return sorted[0][0];
  }, [analysis]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analysis || analysis.totalGamesAnalyzed === 0) {
    return null;
  }

  const { strengths, needsWork, recommended, poolDiversity, totalGamesAnalyzed } =
    analysis;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <TargetIcon className="size-4 text-primary" />
          {t("championPool.title")}
        </CardTitle>
        <CardDescription className="text-xs">
          {t("championPool.description").replace(
            "{count}",
            totalGamesAnalyzed.toString()
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Pool Stats */}
        <div className="flex items-center gap-3 text-xs">
          <Badge variant="outline" className="gap-1">
            <span className="text-muted-foreground">
              {t("championPool.diversity")}:
            </span>
            <span
              className={cn(
                "font-semibold",
                poolDiversity > 50
                  ? "text-yellow-500"
                  : poolDiversity > 30
                  ? "text-blue-500"
                  : "text-emerald-500"
              )}
            >
              {poolDiversity}%
            </span>
          </Badge>
          {mainRole && (
            <Badge variant="secondary" className="gap-1">
              <span className="text-muted-foreground">
                {t("championPool.mainRole")}:
              </span>
              <span className="font-semibold">
                {ROLE_LABELS[mainRole] || mainRole}
              </span>
            </Badge>
          )}
        </div>

        {/* Strengths */}
        {strengths.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium flex items-center gap-1.5 text-emerald-500">
              <TrendingUpIcon className="size-3.5" />
              {t("championPool.strengths")}
            </h4>
            <div className="flex gap-2 flex-wrap">
              {strengths.map((champ) => {
                const slug = resolveSlug(champ.championId);
                const name = resolveName(champ.championId);
                return (
                  <div
                    key={champ.championId}
                    className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-2 py-1.5"
                  >
                    <ChampionIcon
                      championId={slug}
                      championKey={champ.championId}
                      championKeyToId={championKeyToIdMap}
                      size={28}
                      shape="circle"
                      className="border border-emerald-500/40"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {champ.winRate}% WR · {champ.games} {t("championPool.games")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Needs Work */}
        {needsWork.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium flex items-center gap-1.5 text-orange-500">
              <TrendingDownIcon className="size-3.5" />
              {t("championPool.needsWork")}
            </h4>
            <div className="flex gap-2 flex-wrap">
              {needsWork.map((champ) => {
                const slug = resolveSlug(champ.championId);
                const name = resolveName(champ.championId);
                return (
                  <div
                    key={champ.championId}
                    className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-2 py-1.5"
                  >
                    <ChampionIcon
                      championId={slug}
                      championKey={champ.championId}
                      championKeyToId={championKeyToIdMap}
                      size={28}
                      shape="circle"
                      className="border border-orange-500/40"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {champ.winRate}% WR · {champ.games} {t("championPool.games")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {t("championPool.needsWorkTip")}
            </p>
          </div>
        )}

        {/* Recommended */}
        {recommended.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium flex items-center gap-1.5 text-blue-500">
              <SparklesIcon className="size-3.5" />
              {t("championPool.recommended")}
            </h4>
            <div className="flex gap-2 flex-wrap">
              {recommended.map((champ) => {
                const slug = resolveSlug(champ.championId);
                const name = resolveName(champ.championId);
                return (
                  <div
                    key={champ.championId}
                    className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-2 py-1.5"
                  >
                    <ChampionIcon
                      championId={slug}
                      championKey={champ.championId}
                      championKeyToId={championKeyToIdMap}
                      size={28}
                      shape="circle"
                      className="border border-blue-500/40"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {champ.avgKDA} KDA · {champ.games} {t("championPool.games")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {t("championPool.recommendedTip")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
