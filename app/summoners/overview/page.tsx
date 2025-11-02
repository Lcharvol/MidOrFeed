"use client";

import { useMemo } from "react";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Loader2Icon,
  MedalIcon,
  TrophyIcon,
  ZapIcon,
  TrendingUpIcon,
  TargetIcon,
  SwordsIcon,
  UsersIcon,
  Gamepad2Icon,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import { Progress } from "@/components/ui/progress";
import { AIInsightCard, AIInsight } from "@/components/AIInsightCard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const getChampionImageUrl = (championId: string): string => {
  const version = "15.21.1";
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`;
};

interface MatchData {
  matches: any[];
  stats: {
    totalGames: number;
    totalWins: number;
    winRate: string;
    avgKDA: string;
    totalKills: number;
    totalDeaths: number;
    totalAssists: number;
  };
  championStats: Record<
    string,
    {
      played: number;
      wins: number;
      kills: number;
      deaths: number;
      assists: number;
    }
  >;
  roleStats: Record<
    string,
    {
      played: number;
      wins: number;
    }
  >;
}

export default function OverviewPage() {
  const { user } = useAuth();
  const matchesUrl = user?.riotPuuid
    ? `/api/matches/list?puuid=${user.riotPuuid}`
    : "/api/matches/list";
  const { data, error, isLoading } = useSWR(matchesUrl, fetcher);
  const { data: championsData } = useSWR("/api/champions/list", fetcher);

  const championMap = useMemo(
    () =>
      championsData?.data
        ? new Map(
            championsData.data.map(
              (champion: { championId: string; name: string }) => [
                champion.championId,
                champion.name,
              ]
            )
          )
        : new Map(),
    [championsData]
  );

  const matchData: MatchData | null = data?.data || null;

  const topChampions = useMemo(() => {
    if (!matchData) return [];
    return Object.entries(matchData.championStats)
      .sort((a, b) => b[1].played - a[1].played)
      .slice(0, 3);
  }, [matchData]);

  const roleStatsSorted = useMemo(() => {
    if (!matchData) return [];
    return Object.entries(matchData.roleStats).sort(
      (a, b) => b[1].played - a[1].played
    );
  }, [matchData]);

  const winRateNumber = useMemo(() => {
    if (!matchData) return 0;
    return parseFloat(matchData.stats.winRate);
  }, [matchData]);

  // Générer des insights IA basés sur les données
  const aiInsights = useMemo<AIInsight[]>(() => {
    if (!matchData || topChampions.length === 0) return [];
    const insights: AIInsight[] = [];

    // Insight 1: Win Rate
    if (winRateNumber >= 55) {
      insights.push({
        type: "positive",
        title: "Performance exceptionnelle",
        description: `Avec un win rate de ${matchData.stats.winRate}, vous êtes nettement au-dessus de la moyenne !`,
        confidence: 92,
        recommendation:
          "Continuez sur cette lancée et maintenez votre niveau de jeu constant.",
        data: {
          "Win rate": matchData.stats.winRate,
          Parties: matchData.stats.totalGames,
        },
      });
    } else if (winRateNumber < 50) {
      insights.push({
        type: "negative",
        title: "Win rate en dessous de 50%",
        description: `Votre win rate de ${matchData.stats.winRate} suggère qu'il y a des axes d'amélioration.`,
        confidence: 85,
        recommendation:
          "Analysez vos matchs perdus pour identifier vos points faibles récurrents.",
        data: {
          "Win rate": matchData.stats.winRate,
          Défaites: matchData.stats.totalGames - matchData.stats.totalWins,
        },
      });
    }

    // Insight 2: KDA
    const kdaNumber = parseFloat(matchData.stats.avgKDA);
    if (kdaNumber >= 2.5) {
      insights.push({
        type: "positive",
        title: "Impact de combat élevé",
        description: `Votre KDA de ${matchData.stats.avgKDA} montre que vous contribuez significativement aux combats.`,
        confidence: 88,
        data: { KDA: matchData.stats.avgKDA },
      });
    }

    // Insight 3: Volume de jeu
    if (matchData.stats.totalGames < 10) {
      insights.push({
        type: "warning",
        title: "Échantillon limité",
        description: `Avec seulement ${matchData.stats.totalGames} parties, les statistiques ne sont pas encore significatives.`,
        confidence: 75,
        recommendation:
          "Jouez au moins 20 matchs pour obtenir des insights plus précis.",
        data: { Parties: matchData.stats.totalGames },
      });
    }

    // Insight 4: Top champion
    if (topChampions.length > 0) {
      const [championId, topStats] = topChampions[0];
      const topWinRate = ((topStats.wins / topStats.played) * 100).toFixed(1);
      if (parseFloat(topWinRate) >= 60 && topStats.played >= 5) {
        insights.push({
          type: "positive",
          title: "Champion signature identifié",
          description: `${
            championMap.get(championId) || championId
          } est votre meilleur champion avec ${topWinRate}% de victoires.`,
          confidence: 90,
          recommendation: `Priorisez ${
            championMap.get(championId) || championId
          } lorsque c'est possible pour maximiser vos chances de victoire.`,
          data: {
            Champion: championMap.get(championId) || championId,
            "Win rate": `${topWinRate}%`,
          },
        });
      }
    }

    return insights;
  }, [matchData, topChampions, championMap, winRateNumber]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="size-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">
          Erreur lors du chargement des données
        </p>
      </div>
    );
  }

  if (!matchData || matchData.stats.totalGames === 0) {
    return (
      <Card>
        <CardContent className="py-20">
          <div className="text-center">
            <Gamepad2Icon className="size-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucune donnée</h3>
            <p className="text-muted-foreground">
              Les statistiques apparaîtront après avoir collecté des matchs
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <TrophyIcon className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchData.stats.winRate}</div>
            <Progress
              value={winRateNumber}
              className="mt-2 h-2"
              role="progressbar"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {matchData.stats.totalWins}W /{" "}
              {matchData.stats.totalGames - matchData.stats.totalWins}L
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-background to-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KDA</CardTitle>
            <TargetIcon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchData.stats.avgKDA}</div>
            <p className="text-xs text-muted-foreground mt-2">
              KDA moyen par partie
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Parties</CardTitle>
            <UsersIcon className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matchData.stats.totalGames}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Matchs au total
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-green-500/20 bg-gradient-to-br from-background to-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Victoires</CardTitle>
            <Gamepad2Icon className="size-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matchData.stats.totalWins}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Victoires totales
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights IA */}
      {aiInsights.length > 0 && (
        <div className="space-y-4">
          {aiInsights.map((insight, index) => (
            <AIInsightCard key={index} insight={insight} size="compact" />
          ))}
        </div>
      )}

      {/* Top Champions */}
      {topChampions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Champions</CardTitle>
            <CardDescription>Vos champions les plus joués</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {topChampions.map(([championId, stats], index) => {
                const winRate = ((stats.wins / stats.played) * 100).toFixed(0);
                return (
                  <div
                    key={championId}
                    className="flex items-center gap-4 p-4 rounded-lg border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <div className="relative">
                      <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {index + 1}
                      </div>
                      <Image
                        src={getChampionImageUrl(championId)}
                        alt={championId}
                        width={64}
                        height={64}
                        className="rounded-lg border-2 border-primary/30"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">
                        {championMap.get(championId) || championId}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {stats.played} parties • {winRate}% WR
                      </p>
                      <Progress
                        value={parseFloat(winRate)}
                        className="mt-2 h-1.5"
                        role="progressbar"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance par rôle */}
      {roleStatsSorted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Performance par Rôle</CardTitle>
            <CardDescription>
              Vos statistiques par position jouée
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
              {roleStatsSorted.map(([role, stats]) => {
                const winRate = ((stats.wins / stats.played) * 100).toFixed(1);
                return (
                  <div
                    key={role}
                    className="flex flex-col items-center p-4 rounded-lg border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5 hover:border-primary/40 transition-all"
                  >
                    <SwordsIcon className="size-8 text-primary mb-2" />
                    <p className="font-bold text-lg mb-1">{role}</p>
                    <p className="text-sm text-muted-foreground mb-3">
                      {stats.played} parties
                    </p>
                    <div className="text-center">
                      <p
                        className={`text-2xl font-bold ${
                          parseFloat(winRate) >= 50
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {winRate}%
                      </p>
                      <p className="text-xs text-muted-foreground">Win Rate</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Statistiques détaillées */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-2 border-orange-500/20 bg-gradient-to-br from-background to-orange-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kills</CardTitle>
            <SwordsIcon className="size-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matchData.stats.totalKills}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {(
                matchData.stats.totalKills / matchData.stats.totalGames
              ).toFixed(1)}{" "}
              par partie
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-red-500/20 bg-gradient-to-br from-background to-red-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deaths</CardTitle>
            <TargetIcon className="size-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matchData.stats.totalDeaths}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {(
                matchData.stats.totalDeaths / matchData.stats.totalGames
              ).toFixed(1)}{" "}
              par partie
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-background to-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assists</CardTitle>
            <UsersIcon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {matchData.stats.totalAssists}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {(
                matchData.stats.totalAssists / matchData.stats.totalGames
              ).toFixed(1)}{" "}
              par partie
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
