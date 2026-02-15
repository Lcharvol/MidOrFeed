"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrophyIcon, InfoIcon, UsersIcon, FlameIcon, SparklesIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { DataState } from "@/components/ui/data-state";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { AIInsightCard, AIInsight } from "@/components/AIInsightCard";
import { useParams, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { useApiSWR } from "@/lib/hooks/swr";
import { getTierIconUrl } from "@/constants/ddragon";
import { cn } from "@/lib/utils";
import type { RankedQueueData } from "@/types/api";

const TIER_TEXT_COLOR: Record<string, string> = {
  IRON: "text-tier-iron",
  BRONZE: "text-tier-bronze",
  SILVER: "text-tier-silver",
  GOLD: "text-tier-gold",
  PLATINUM: "text-tier-platinum",
  EMERALD: "text-tier-emerald",
  DIAMOND: "text-tier-diamond",
  MASTER: "text-tier-master",
  GRANDMASTER: "text-tier-grandmaster",
  CHALLENGER: "text-tier-challenger",
};

const TIER_BORDER_COLOR: Record<string, string> = {
  IRON: "border-tier-iron/30",
  BRONZE: "border-tier-bronze/30",
  SILVER: "border-tier-silver/30",
  GOLD: "border-tier-gold/30",
  PLATINUM: "border-tier-platinum/30",
  EMERALD: "border-tier-emerald/30",
  DIAMOND: "border-tier-diamond/30",
  MASTER: "border-tier-master/30",
  GRANDMASTER: "border-tier-grandmaster/30",
  CHALLENGER: "border-tier-challenger/30",
};

const TIER_KEYS: Record<string, string> = {
  IRON: "tierIron",
  BRONZE: "tierBronze",
  SILVER: "tierSilver",
  GOLD: "tierGold",
  PLATINUM: "tierPlatinum",
  EMERALD: "tierEmerald",
  DIAMOND: "tierDiamond",
  MASTER: "tierMaster",
  GRANDMASTER: "tierGrandmaster",
  CHALLENGER: "tierChallenger",
};

const RANK_ROMAN: Record<string, string> = {
  IV: "IV",
  III: "III",
  II: "II",
  I: "I",
};

interface DivisionStandingsData {
  success: boolean;
  data: {
    tier: string;
    division: string;
    totalPlayers: number;
    playerRank: number | null;
    topPlayers: Array<{ leaguePoints: number; wins: number; losses: number }>;
  };
}

function DivisionStanding({
  tier,
  rank,
  lp,
  region,
  queueType,
}: {
  tier: string;
  rank: string;
  lp: number;
  region: string;
  queueType: string;
}) {
  const { t } = useI18n();
  const HIGH_TIERS = ["MASTER", "GRANDMASTER", "CHALLENGER"];
  const { data, isLoading } = useApiSWR<DivisionStandingsData>(
    !HIGH_TIERS.includes(tier) && region
      ? `/api/riot/division-standings?region=${region}&tier=${tier}&division=${rank}&queue=${queueType}&lp=${lp}`
      : null,
    { revalidateOnFocus: false }
  );

  if (isLoading || !data?.data || data.data.totalPlayers === 0) return null;

  const { totalPlayers, playerRank } = data.data;
  const percentile = playerRank ? Math.round((playerRank / totalPlayers) * 100) : null;

  return (
    <div className="mt-4 rounded-lg border border-border/60 bg-muted/20 p-3 space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold">
        <UsersIcon className="size-3.5 text-muted-foreground" />
        {t("summoners.ranking.divisionPosition")}
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {totalPlayers} {t("summoners.ranking.playersInDivision")}
        </span>
        {percentile !== null && (
          <Badge emphasis={percentile <= 25 ? "positive" : percentile <= 50 ? "info" : "neutral"} emphasisVariant="subtle" className="text-[10px]">
            Top {percentile}%
          </Badge>
        )}
      </div>
      {percentile !== null && (
        <Progress value={100 - percentile} className="h-1.5" />
      )}
    </div>
  );
}

interface RankedApiResponse {
  success: boolean;
  data: {
    solo: RankedQueueData | null;
    flex: RankedQueueData | null;
  };
  source?: string;
}

function QueueCard({
  queueData,
  queueLabel,
  queueType,
  region,
  getTierName,
  t,
}: {
  queueData: RankedQueueData;
  queueLabel: string;
  queueType: string;
  region?: string;
  getTierName: (tier: string) => string;
  t: (key: string) => string;
}) {
  const { current, best, seasonHistory } = queueData;
  const winRate = current.winRate.toFixed(1);
  const tierName = getTierName(current.tier);
  const rankDisplay = current.rank
    ? `${tierName} ${RANK_ROMAN[current.rank] || current.rank}`
    : tierName;

  const bestTierName = getTierName(best.tier);
  const bestRankDisplay = best.rank
    ? `${bestTierName.toLowerCase()} ${RANK_ROMAN[best.rank] || best.rank}`
    : bestTierName.toLowerCase();

  const winRateNum = parseFloat(winRate);
  const wrEmphasis: "positive" | "danger" | "neutral" =
    winRateNum >= 55 ? "positive" : winRateNum < 45 ? "danger" : "neutral";

  return (
    <Card className={cn("relative overflow-hidden border-l-4", TIER_BORDER_COLOR[current.tier] || "border-border")}>
      <CardHeader className="relative pb-3">
        <div className="flex items-center justify-between mb-3">
          <CardTitle className="text-base">{queueLabel}</CardTitle>
          <div className="flex items-center gap-1.5">
            {current.hotStreak && (
              <Badge emphasis="warning" emphasisVariant="subtle">
                <FlameIcon className="size-3 mr-1" />
                {t("ranking.hotStreak")}
              </Badge>
            )}
            {current.freshBlood && (
              <Badge emphasis="info" emphasisVariant="subtle">
                <SparklesIcon className="size-3 mr-1" />
                {t("ranking.freshBlood")}
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Image
            src={getTierIconUrl(current.tier, current.rank, "medals")}
            alt={`${tierName} ${current.rank || ""}`}
            width={64}
            height={64}
            className="shrink-0"
            unoptimized
          />
          <div className="flex-1">
            <div className={cn("text-2xl font-bold", TIER_TEXT_COLOR[current.tier] || "text-foreground")}>
              {rankDisplay}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-sm text-muted-foreground cursor-help">
                  {current.lp} LP
                </div>
              </TooltipTrigger>
              <TooltipContent>{t("summoners.ranking.lpTooltip")}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-success">
              {current.wins}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("ranking.victories")}
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-danger">
              {current.losses}
            </div>
            <div className="text-xs text-muted-foreground">
              {t("ranking.defeats")}
            </div>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="text-center cursor-help">
                <div className="text-2xl font-bold">
                  <Badge emphasis={wrEmphasis} emphasisVariant="subtle" className="text-lg px-2 py-0.5">
                    {winRate}%
                  </Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("ranking.winRate")}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>{t("summoners.ranking.winRateTooltip")}</TooltipContent>
          </Tooltip>
        </div>

        {/* Best rank */}
        {best.tier && (
          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <div className="flex items-center gap-2">
              <Image
                src={getTierIconUrl(best.tier, best.rank, "medals_mini")}
                alt={`${bestTierName} ${best.rank || ""}`}
                width={40}
                height={40}
                className="shrink-0"
                unoptimized
              />
              <div>
                <div className="text-sm font-bold lowercase text-foreground">
                  {bestRankDisplay}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  {best.lp} LP
                </div>
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("summoners.ranking.bestRank")}
            </div>
          </div>
        )}

        {region && (
          <DivisionStanding
            tier={current.tier}
            rank={current.rank}
            lp={current.lp}
            region={region}
            queueType={queueType}
          />
        )}

        {/* Season history */}
        {seasonHistory.length > 0 && (
          <div className="space-y-2 border-t border-border/50 pt-3">
            <div className="text-xs font-semibold text-foreground">
              {t("summoners.ranking.seasonHistory")}
            </div>
            <div className="overflow-hidden rounded border border-border/60">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50">
                    <TableHead className="h-8 text-[10px] uppercase text-muted-foreground">
                      {t("summoners.season")}
                    </TableHead>
                    <TableHead className="h-8 text-[10px] uppercase text-muted-foreground">
                      {t("summoners.tier")}
                    </TableHead>
                    <TableHead className="h-8 text-right text-[10px] uppercase text-muted-foreground">
                      {t("summoners.lp")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {seasonHistory.map((history) => {
                    const historyTierName = getTierName(history.tier);
                    return (
                      <TableRow
                        key={history.season}
                        className="border-border/50"
                      >
                        <TableCell className="h-8 text-xs font-semibold text-foreground">
                          {history.season}
                        </TableCell>
                        <TableCell className="h-8">
                          <div className="flex items-center gap-1.5">
                            <Image
                              src={getTierIconUrl(
                                history.tier,
                                history.rank,
                                "medals_mini"
                              )}
                              alt={`${historyTierName} ${history.rank || ""}`}
                              width={40}
                              height={40}
                              className="shrink-0"
                              unoptimized
                            />
                            <span className="text-xs text-foreground lowercase">
                              {historyTierName.toLowerCase()}{" "}
                              {RANK_ROMAN[history.rank] || history.rank}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="h-8 text-right text-xs text-foreground">
                          {history.lp}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function RankingByIdPage() {
  const { t } = useI18n();
  const params = useParams();
  const searchParams = useSearchParams();
  const puuid = typeof params?.id === "string" ? params.id : undefined;
  const region = searchParams.get("region") || undefined;

  const getTierName = (tier: string) => {
    const key = TIER_KEYS[tier];
    return key ? t(`ranking.${key}`) : tier;
  };

  const QUEUE_LABELS = useMemo(() => ({
    solo: t("ranking.rankedSoloDuo"),
    flex: t("ranking.rankedFlex"),
  }), [t]);

  const { data, isLoading, error } = useApiSWR<RankedApiResponse>(
    puuid && region
      ? `/api/summoners/${puuid}/ranked?region=${region}`
      : null,
    { revalidateOnFocus: false }
  );

  const soloData = data?.data?.solo ?? null;
  const flexData = data?.data?.flex ?? null;
  const hasData = soloData || flexData;

  const aiInsights = useMemo(
    () => getRankingInsights(soloData, flexData, t, getTierName),
    [soloData, flexData, t, getTierName]
  );

  if (isLoading) {
    return (
      <DataState
        isLoading
        variant="plain"
        title={t("summoners.ranking.loading")}
        containerClassName="py-20"
      />
    );
  }

  if (error || (!puuid || !region)) {
    return (
      <DataState
        tone="warning"
        variant="plain"
        title={error ? t("ranking.errorFetchingRanking") : t("ranking.unrankedMessage")}
        containerClassName="py-20"
      />
    );
  }

  if (!hasData) {
    return (
      <Card>
        <CardContent>
          <div className="text-center">
            <TrophyIcon className="size-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t("ranking.unranked")}</h3>
            <p className="text-muted-foreground">
              {t("ranking.noActiveRanking")}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {soloData && (
          <QueueCard
            queueData={soloData}
            queueLabel={QUEUE_LABELS.solo}
            queueType="RANKED_SOLO_5x5"
            region={region}
            getTierName={getTierName}
            t={t}
          />
        )}
        {flexData && (
          <QueueCard
            queueData={flexData}
            queueLabel={QUEUE_LABELS.flex}
            queueType="RANKED_FLEX_SR"
            region={region}
            getTierName={getTierName}
            t={t}
          />
        )}
      </div>
      {aiInsights.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {aiInsights.slice(0, 2).map((insight, index) => (
            <AIInsightCard key={index} insight={insight} size="compact" />
          ))}
        </div>
      )}
    </div>
  );
}

function getRankingInsights(
  soloData: RankedQueueData | null,
  flexData: RankedQueueData | null,
  t: (key: string) => string,
  getTierName: (tier: string) => string
): AIInsight[] {
  const insights: AIInsight[] = [];

  if (soloData) {
    const { current } = soloData;
    const winRate = current.winRate.toFixed(1);
    const tierOrder = [
      "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM",
      "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER",
    ];
    const currentTierIndex = tierOrder.indexOf(current.tier);
    const tierName = getTierName(current.tier);

    if (currentTierIndex >= 3) {
      insights.push({
        type: "positive",
        title: t("ranking.highRankMaintained"),
        description: t("ranking.highRankDescription")
          .replace("{tier}", tierName)
          .replace("{rank}", current.rank || ""),
        confidence: 90,
        recommendation: t("ranking.highRankRecommendation"),
        data: {
          [t("ranking.rank")]: `${tierName} ${current.rank || ""}`,
          [t("ranking.lp")]: current.lp,
        },
      });
    }
    if (parseFloat(winRate) >= 55) {
      insights.push({
        type: "positive",
        title: t("ranking.excellentWinRate"),
        description: t("ranking.excellentWinRateDescription").replace("{winRate}", winRate),
        confidence: 88,
        recommendation: t("ranking.excellentWinRateRecommendation"),
        data: { [t("ranking.winRate")]: `${winRate}%`, [t("ranking.lp")]: current.lp },
      });
    } else if (parseFloat(winRate) < 45) {
      insights.push({
        type: "negative",
        title: t("ranking.winRateDifficulty"),
        description: t("ranking.winRateDifficultyDescription").replace("{winRate}", winRate),
        confidence: 85,
        recommendation: t("ranking.winRateDifficultyRecommendation"),
        data: {
          [t("ranking.winRate")]: `${winRate}%`,
          Matchs: `${current.wins}W / ${current.losses}L`,
        },
      });
    }
    if (current.hotStreak) {
      insights.push({
        type: "positive",
        title: t("ranking.winningStreak"),
        description: t("ranking.winningStreakDescription"),
        confidence: 95,
        recommendation: t("ranking.winningStreakRecommendation"),
      });
    }
  }

  if (flexData && soloData) {
    const tierOrder = [
      "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM",
      "EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER",
    ];
    const soloIndex = tierOrder.indexOf(soloData.current.tier);
    const flexIndex = tierOrder.indexOf(flexData.current.tier);
    if (flexIndex > soloIndex) {
      const flexTierName = getTierName(flexData.current.tier);
      const soloTierName = getTierName(soloData.current.tier);
      insights.push({
        type: "positive",
        title: t("ranking.flexBetterPerformance"),
        description: t("ranking.flexBetterDescription")
          .replace("{flexTier}", flexTierName)
          .replace("{soloTier}", soloTierName),
        confidence: 85,
        recommendation: t("ranking.flexBetterRecommendation"),
        data: {
          [t("ranking.flex")]: flexTierName,
          [t("ranking.solo")]: soloTierName,
        },
      });
    }
  }

  return insights;
}
