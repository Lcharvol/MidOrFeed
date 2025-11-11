import { AIInsight } from "@/components/AIInsightCard";
import type {
  SummonerChampionStats,
  RoleIdToStats,
  SummonerOverviewMatchData,
} from "@/types";

export interface TopChampionEntry {
  championId: string;
  stats: SummonerChampionStats;
}

export interface RolePerformanceEntry {
  role: string;
  stats: RoleIdToStats[string];
  winRate: number;
}

export const resolveChampionSlug = (
  idOrKey: string,
  championKeyToId: Map<string, string>
): string => {
  if (/^\d+$/.test(idOrKey)) {
    return championKeyToId.get(idOrKey) ?? idOrKey;
  }
  return idOrKey;
};

export const computeTopChampions = (
  matchData: SummonerOverviewMatchData | null,
  limit = 3
): TopChampionEntry[] => {
  if (!matchData) return [];

  return Object.entries(matchData.championStats)
    .map(([championId, stats]) => ({ championId, stats }))
    .sort((a, b) => b.stats.played - a.stats.played)
    .slice(0, limit);
};

export const computeRolePerformance = (
  matchData: SummonerOverviewMatchData | null
): RolePerformanceEntry[] => {
  if (!matchData) return [];

  return Object.entries(matchData.roleStats)
    .map(([role, stats]) => ({
      role,
      stats,
      winRate: stats.played === 0 ? 0 : (stats.wins / stats.played) * 100,
    }))
    .sort((a, b) => b.stats.played - a.stats.played);
};

export const computeAiInsights = (
  matchData: SummonerOverviewMatchData | null,
  topChampions: TopChampionEntry[],
  championIdToName: Map<string, string>
): AIInsight[] => {
  if (!matchData || topChampions.length === 0) return [];

  const insights: AIInsight[] = [];
  const winRate = parseFloat(matchData.stats.winRate);
  const avgKda = parseFloat(matchData.stats.avgKDA);

  if (winRate >= 55) {
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
  } else if (winRate < 50) {
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

  if (avgKda >= 2.5) {
    insights.push({
      type: "positive",
      title: "Impact de combat élevé",
      description: `Votre KDA de ${matchData.stats.avgKDA} montre que vous contribuez significativement aux combats.`,
      confidence: 88,
      data: { KDA: matchData.stats.avgKDA },
    });
  }

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

  const signatureChampion = topChampions[0];
  if (signatureChampion) {
    const { championId, stats } = signatureChampion;
    const winRateTop =
      stats.played === 0
        ? 0
        : parseFloat(((stats.wins / stats.played) * 100).toFixed(1));
    if (winRateTop >= 60 && stats.played >= 5) {
      const championName = championIdToName.get(championId) ?? championId;
      insights.push({
        type: "positive",
        title: "Champion signature identifié",
        description: `${championName} est votre meilleur champion avec ${winRateTop}% de victoires.`,
        confidence: 90,
        recommendation: `Priorisez ${championName} lorsque c'est possible pour maximiser vos chances de victoire.`,
        data: {
          Champion: championName,
          "Win rate": `${winRateTop}%`,
        },
      });
    }
  }

  return insights;
};

