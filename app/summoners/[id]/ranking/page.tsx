"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2Icon, TrophyIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AIInsightCard, AIInsight } from "@/components/AIInsightCard";
import { useParams, useSearchParams } from "next/navigation";

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

const QUEUE_TYPES: Record<string, string> = {
  RANKED_SOLO_5x5: "Classé Solo/Duo",
  RANKED_FLEX_SR: "Classé Flex 5v5",
  RANKED_TFT: "TFT Classé",
};

const TIER_COLORS: Record<string, string> = {
  IRON: "bg-stone-500",
  BRONZE: "bg-orange-600",
  SILVER: "bg-gray-400",
  GOLD: "bg-yellow-500",
  PLATINUM: "bg-teal-400",
  EMERALD: "bg-emerald-500",
  DIAMOND: "bg-sky-400",
  MASTER: "bg-purple-500",
  GRANDMASTER: "bg-red-500",
  CHALLENGER: "bg-yellow-500",
};

const TIER_NAMES: Record<string, string> = {
  IRON: "Fer",
  BRONZE: "Bronze",
  SILVER: "Argent",
  GOLD: "Or",
  PLATINUM: "Platine",
  EMERALD: "Émeraude",
  DIAMOND: "Diamant",
  MASTER: "Maître",
  GRANDMASTER: "Grand Maître",
  CHALLENGER: "Challenger",
};

const RANK_ROMAN: Record<string, string> = {
  IV: "IV",
  III: "III",
  II: "II",
  I: "I",
};

export default function RankingByIdPage() {
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
        setError(
          "Non classé. Information de classement non disponible avec l'API Riot actuelle."
        );
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
          setError(
            result.error || "Erreur lors de la récupération du classement"
          );
          return;
        }
        setLeagueData(result.data || []);
      } catch (err) {
        console.error("Erreur:", err);
        setError("Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    };
    fetchLeagueData();
  }, [profileData, region]);

  const aiInsights = getRankingInsights(leagueData || []);

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
            <h3 className="text-xl font-semibold mb-2">Non classé</h3>
            <p className="text-muted-foreground">
              Vous n&apos;avez pas encore de classement actif
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
          const tierName = TIER_NAMES[league.tier] || league.tier;
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
                    <Badge className="bg-orange-500 hover:bg-orange-500">
                      🔥 Série chaude
                    </Badge>
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
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {league.wins}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Victoires
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {league.losses}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Défaites
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{winRate}%</div>
                    <div className="text-xs text-muted-foreground">
                      Win Rate
                    </div>
                  </div>
                </div>
                {league.freshBlood && (
                  <Badge
                    variant="outline"
                    className="mt-4 w-full justify-center"
                  >
                    🆕 Sang neuf
                  </Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function getRankingInsights(leagueData: LeagueEntry[]): AIInsight[] {
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
    if (currentTierIndex >= 3) {
      insights.push({
        type: "positive",
        title: "Rang élevé maintenu",
        description: `Vous êtes actuellement ${TIER_NAMES[soloQueue.tier]} ${
          soloQueue.rank || ""
        } dans le classé Solo/Duo. Excellente performance !`,
        confidence: 90,
        recommendation:
          "Continuez à jouer régulièrement pour maintenir votre rang et continuer à progresser.",
        data: {
          Rang: `${TIER_NAMES[soloQueue.tier]} ${soloQueue.rank || ""}`,
          LP: soloQueue.leaguePoints,
        },
      });
    }
    if (parseFloat(winRate) >= 55) {
      insights.push({
        type: "positive",
        title: "Win rate excellent",
        description: `Avec ${winRate}% de victoires en Solo/Duo, vous êtes sur la bonne voie pour grimper les rangs !`,
        confidence: 88,
        recommendation:
          "Maintenez ce niveau de performance pour continuer à progresser dans le classement.",
        data: { "Win rate": `${winRate}%`, LP: soloQueue.leaguePoints },
      });
    } else if (parseFloat(winRate) < 45) {
      insights.push({
        type: "negative",
        title: "Win rate en difficulté",
        description: `Votre win rate de ${winRate}% en Solo/Duo suggère que vous pourriez bénéficier d'un coaching.`,
        confidence: 85,
        recommendation:
          "Analysez vos matchs perdus et travaillez sur vos points faibles pour améliorer votre win rate.",
        data: {
          "Win rate": `${winRate}%`,
          Matchs: `${soloQueue.wins}W / ${soloQueue.losses}L`,
        },
      });
    }
    if (soloQueue.hotStreak) {
      insights.push({
        type: "positive",
        title: "🔥 Série de victoires !",
        description:
          "Vous êtes en pleine série de victoires ! C'est le moment idéal pour jouer plus.",
        confidence: 95,
        recommendation:
          "Profitez de cette dynamique positive mais n'oubliez pas de prendre des pauses régulières.",
      });
    }
  }
  const flexQueue = leagueData.find((l) => l.queueType === "RANKED_FLEX_SR");
  const soloQueue = leagueData.find((l) => l.queueType === "RANKED_SOLO_5x5");
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
      insights.push({
        type: "positive",
        title: "Performance Flex meilleure",
        description: `Vous performez mieux en Flex (${
          TIER_NAMES[flexQueue.tier]
        }) qu'en Solo/Duo (${
          TIER_NAMES[soloQueue.tier]
        }). Vous êtes un bon joueur d'équipe !`,
        confidence: 85,
        recommendation:
          "Considérez jouer plus en équipe pour maximiser vos performances.",
        data: {
          Flex: TIER_NAMES[flexQueue.tier],
          Solo: TIER_NAMES[soloQueue.tier],
        },
      });
    }
  }
  return insights;
}
