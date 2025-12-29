"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2Icon, TrophyIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ColorBadge } from "@/components/ui/badge";
import { AIInsightCard, AIInsight } from "@/components/AIInsightCard";
import { useParams, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";

interface LeagueEntry {
  leagueId: string;
  queueType: string;
  tier: string;
  rank: string;
  summonerId: string;
  summonerName: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

const TIER_COLORS: Record<string, string> = {
  IRON: "bg-tier-iron",
  BRONZE: "bg-tier-bronze",
  SILVER: "bg-tier-silver",
  GOLD: "bg-tier-gold",
  PLATINUM: "bg-tier-platinum",
  EMERALD: "bg-tier-emerald",
  DIAMOND: "bg-tier-diamond",
  MASTER: "bg-tier-master",
  GRANDMASTER: "bg-tier-grandmaster",
  CHALLENGER: "bg-tier-challenger",
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

export default function RankingByIdPage() {
  const { t } = useI18n();
  const params = useParams();
  const searchParams = useSearchParams();
  const puuid = typeof params?.id === "string" ? params.id : undefined;
  const region = searchParams.get("region") || undefined;

  const [leagueData, setLeagueData] = useState<LeagueEntry[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<{
    data?: { summonerId?: string };
  } | null>(null);

  const getTierName = (tier: string) => {
    const key = TIER_KEYS[tier];
    return key ? t(`ranking.${key}`) : tier;
  };

  const QUEUE_TYPES: Record<string, string> = useMemo(() => ({
    RANKED_SOLO_5x5: t("ranking.rankedSoloDuo"),
    RANKED_FLEX_SR: t("ranking.rankedFlex"),
    RANKED_TFT: t("ranking.rankedTFT"),
  }), [t]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!puuid || !region) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await fetch("/api/riot/get-account-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ puuid, region }),
        });
        const result = await response.json();
        if (response.ok && result.data) {
          setProfileData(result);
        }
      } catch (err) {
        console.error("Erreur lors du chargement du profil:", err);
      }
    };
    fetchProfileData();
  }, [puuid, region]);

  useEffect(() => {
    const fetchLeagueData = async () => {
      if (!profileData?.data?.summonerId || !region) {
        setError(t("ranking.unrankedMessage"));
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/riot/get-league", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            summonerId: profileData.data.summonerId,
            region,
          }),
        });
        const result = await response.json();
        if (!response.ok) {
          setError(result.error || t("ranking.errorFetchingRanking"));
          return;
        }
        setLeagueData(result.data || []);
      } catch (err) {
        console.error("Error:", err);
        setError(t("ranking.errorOccurred"));
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeagueData();
  }, [profileData, region]);

  const aiInsights = useMemo(() => getRankingInsights(leagueData || [], t, getTierName), [leagueData, t, getTierName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="size-12 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }
  if (!leagueData || leagueData.length === 0) {
    return (
      <Card>
        <CardContent className="py-20">
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
      {aiInsights.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {aiInsights.map((insight, index) => (
            <AIInsightCard key={index} insight={insight} size="compact" />
          ))}
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        {leagueData.map((league) => {
          const winRate = (
            (league.wins / (league.wins + league.losses)) *
            100
          ).toFixed(1);
          const tierColor = TIER_COLORS[league.tier] || "bg-gray-500";
          const tierName = getTierName(league.tier);
          const rankDisplay = league.rank
            ? `${tierName} ${RANK_ROMAN[league.rank] || league.rank}`
            : tierName;
          const queueName = QUEUE_TYPES[league.queueType] || league.queueType;
          return (
            <Card
              key={league.leagueId}
              className="border-2 border-primary/20 relative overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br from-${league.tier.toLowerCase()}-500/10 to-transparent`}
              />
              <CardHeader className="relative">
                <div className="flex items-center justify-between mb-4">
                  <CardTitle>{queueName}</CardTitle>
                  {league.hotStreak && (
                    <ColorBadge emphasis="positive" variant="solid">
                      🔥 {t("ranking.hotStreak")}
                    </ColorBadge>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div
                    className={`p-4 rounded-full ${tierColor} text-white text-center min-w-[80px]`}
                  >
                    <div className="font-bold text-sm">{tierName}</div>
                    {league.rank && (
                      <div className="text-xs">
                        {RANK_ROMAN[league.rank] || league.rank}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-3xl font-bold">{rankDisplay}</div>
                    <div className="text-sm text-muted-foreground">
                      {league.leaguePoints} LP
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="relative">
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success">
                      {league.wins}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("ranking.victories")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-danger">
                      {league.losses}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("ranking.defeats")}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{winRate}%</div>
                    <div className="text-xs text-muted-foreground">
                      {t("ranking.winRate")}
                    </div>
                  </div>
                </div>
                {league.freshBlood && (
                  <ColorBadge
                    emphasis="info"
                    variant="subtle"
                    className="mt-4 inline-flex w-full justify-center"
                  >
                    🆕 {t("ranking.freshBlood")}
                  </ColorBadge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function getRankingInsights(
  leagueData: LeagueEntry[],
  t: (key: string) => string,
  getTierName: (tier: string) => string
): AIInsight[] {
  const insights: AIInsight[] = [];
  if (leagueData.length === 0) return insights;
  const soloQueue = leagueData.find((l) => l.queueType === "RANKED_SOLO_5x5");
  if (soloQueue) {
    const winRate = (
      (soloQueue.wins / (soloQueue.wins + soloQueue.losses)) *
      100
    ).toFixed(1);
    const tierOrder = [
      "IRON",
      "BRONZE",
      "SILVER",
      "GOLD",
      "PLATINUM",
      "EMERALD",
      "DIAMOND",
      "MASTER",
      "GRANDMASTER",
      "CHALLENGER",
    ];
    const currentTierIndex = tierOrder.indexOf(soloQueue.tier);
    const tierName = getTierName(soloQueue.tier);
    if (currentTierIndex >= 3) {
      insights.push({
        type: "positive",
        title: t("ranking.highRankMaintained"),
        description: t("ranking.highRankDescription")
          .replace("{tier}", tierName)
          .replace("{rank}", soloQueue.rank || ""),
        confidence: 90,
        recommendation: t("ranking.highRankRecommendation"),
        data: {
          [t("ranking.rank")]: `${tierName} ${soloQueue.rank || ""}`,
          [t("ranking.lp")]: soloQueue.leaguePoints,
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
        data: { [t("ranking.winRate")]: `${winRate}%`, [t("ranking.lp")]: soloQueue.leaguePoints },
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
          Matchs: `${soloQueue.wins}W / ${soloQueue.losses}L`,
        },
      });
    }
    if (soloQueue.hotStreak) {
      insights.push({
        type: "positive",
        title: `🔥 ${t("ranking.winningStreak")}`,
        description: t("ranking.winningStreakDescription"),
        confidence: 95,
        recommendation: t("ranking.winningStreakRecommendation"),
      });
    }
  }
  const flexQueue = leagueData.find((l) => l.queueType === "RANKED_FLEX_SR");
  if (flexQueue && soloQueue) {
    const tierOrder = [
      "IRON",
      "BRONZE",
      "SILVER",
      "GOLD",
      "PLATINUM",
      "EMERALD",
      "DIAMOND",
      "MASTER",
      "GRANDMASTER",
      "CHALLENGER",
    ];
    const soloIndex = tierOrder.indexOf(soloQueue.tier);
    const flexIndex = tierOrder.indexOf(flexQueue.tier);
    if (flexIndex > soloIndex) {
      const flexTierName = getTierName(flexQueue.tier);
      const soloTierName = getTierName(soloQueue.tier);
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
