import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger("compare");

interface ChampionStat {
  championId: string;
  games: number;
  wins: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
}

interface RoleDistribution {
  role: string;
  games: number;
  percentage: number;
  winRate: number;
}

interface RankedInfo {
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  winRate: number;
  queueType: string;
}

interface PlaystyleAnalysis {
  aggressionScore: number; // Based on kills/deaths ratio
  visionScore: number; // Normalized vision score
  farmingScore: number; // Gold efficiency
  teamfightScore: number; // Damage dealt ratio
  survivabilityScore: number; // Deaths per game inverse
  earlyGameScore: number; // Based on average game duration wins
  objectiveScore: number; // Based on vision and damage
}

interface RankProgression {
  date: string;
  tier: string;
  rank: string;
  lp: number;
}

async function getPlayerStats(puuid: string, region: string) {
  // Get account info
  const account = await prisma.leagueOfLegendsAccount.findUnique({
    where: { puuid },
  });

  // Get match stats with match data for duration
  const participants = await prisma.matchParticipant.findMany({
    where: { participantPUuid: puuid },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      match: {
        select: {
          gameDuration: true,
          gameCreation: true,
          queueId: true,
        },
      },
    },
  });

  if (participants.length === 0) {
    return null;
  }

  const totalGames = participants.length;
  const wins = participants.filter((p) => p.win).length;
  const losses = totalGames - wins;

  // Basic stats
  const avgKills = participants.reduce((sum, p) => sum + p.kills, 0) / totalGames;
  const avgDeaths = participants.reduce((sum, p) => sum + p.deaths, 0) / totalGames;
  const avgAssists = participants.reduce((sum, p) => sum + p.assists, 0) / totalGames;
  const avgKDA = avgDeaths > 0 ? (avgKills + avgAssists) / avgDeaths : avgKills + avgAssists;
  const avgVisionScore = participants.reduce((sum, p) => sum + p.visionScore, 0) / totalGames;
  const avgDamageDealt =
    participants.reduce((sum, p) => sum + p.totalDamageDealtToChampions, 0) / totalGames;
  const avgDamageTaken =
    participants.reduce((sum, p) => sum + p.totalDamageTaken, 0) / totalGames;
  const avgGoldEarned =
    participants.reduce((sum, p) => sum + p.goldEarned, 0) / totalGames;

  // Economy stats (per minute)
  const avgGameDuration = participants.reduce((sum, p) => sum + (p.match?.gameDuration || 0), 0) / totalGames;
  const avgGameDurationMinutes = avgGameDuration / 60;
  const goldPerMin = avgGameDurationMinutes > 0 ? avgGoldEarned / avgGameDurationMinutes : 0;
  const damagePerMin = avgGameDurationMinutes > 0 ? avgDamageDealt / avgGameDurationMinutes : 0;

  // Champion stats with detailed KDA
  const championStats: Record<string, {
    games: number;
    wins: number;
    kills: number;
    deaths: number;
    assists: number;
  }> = {};

  for (const p of participants) {
    if (!championStats[p.championId]) {
      championStats[p.championId] = { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
    }
    championStats[p.championId].games++;
    if (p.win) championStats[p.championId].wins++;
    championStats[p.championId].kills += p.kills;
    championStats[p.championId].deaths += p.deaths;
    championStats[p.championId].assists += p.assists;
  }

  const topChampions: ChampionStat[] = Object.entries(championStats)
    .map(([championId, stats]) => {
      const avgDeathsChamp = stats.deaths / stats.games;
      return {
        championId,
        games: stats.games,
        wins: stats.wins,
        winRate: (stats.wins / stats.games) * 100,
        kills: stats.kills / stats.games,
        deaths: stats.deaths / stats.games,
        assists: stats.assists / stats.games,
        kda: avgDeathsChamp > 0
          ? (stats.kills + stats.assists) / stats.deaths
          : (stats.kills + stats.assists) / stats.games,
      };
    })
    .sort((a, b) => b.games - a.games)
    .slice(0, 10); // Get top 10 for common champion comparison

  // Role distribution
  const roleStats: Record<string, { games: number; wins: number }> = {};
  for (const p of participants) {
    const role = p.role || "UNKNOWN";
    if (!roleStats[role]) {
      roleStats[role] = { games: 0, wins: 0 };
    }
    roleStats[role].games++;
    if (p.win) roleStats[role].wins++;
  }

  const roleDistribution: RoleDistribution[] = Object.entries(roleStats)
    .map(([role, stats]) => ({
      role,
      games: stats.games,
      percentage: (stats.games / totalGames) * 100,
      winRate: (stats.wins / stats.games) * 100,
    }))
    .sort((a, b) => b.games - a.games);

  // Get ranked info from RankHistory
  const rankedHistory = await prisma.rankHistory.findMany({
    where: { puuid },
    orderBy: { recordedAt: "desc" },
    take: 30, // Last 30 entries for progression
  });

  let rankedInfo: RankedInfo | null = null;
  let rankProgression: RankProgression[] = [];

  if (rankedHistory.length > 0) {
    // Get most recent solo queue rank
    const soloRank = rankedHistory.find(r => r.queueType === "RANKED_SOLO_5x5");
    if (soloRank) {
      rankedInfo = {
        tier: soloRank.tier,
        rank: soloRank.rank,
        leaguePoints: soloRank.leaguePoints,
        wins: soloRank.wins,
        losses: soloRank.losses,
        winRate: soloRank.wins + soloRank.losses > 0
          ? (soloRank.wins / (soloRank.wins + soloRank.losses)) * 100
          : 0,
        queueType: soloRank.queueType,
      };
    }

    // Build rank progression (last 30 days, deduplicated by date)
    const progressionMap = new Map<string, RankProgression>();
    for (const r of rankedHistory.filter(r => r.queueType === "RANKED_SOLO_5x5")) {
      const dateKey = new Date(r.recordedAt).toISOString().split("T")[0];
      if (!progressionMap.has(dateKey)) {
        progressionMap.set(dateKey, {
          date: dateKey,
          tier: r.tier,
          rank: r.rank,
          lp: r.leaguePoints,
        });
      }
    }
    rankProgression = Array.from(progressionMap.values())
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Last 14 data points
  }

  // Calculate playstyle analysis (normalized 0-100)
  const maxKDA = 5; // Consider 5+ KDA as 100
  const maxVision = 50; // 50+ vision score as 100
  const maxGoldPerMin = 500; // 500+ gold/min as 100
  const maxDamagePerMin = 1500; // 1500+ damage/min as 100

  const playstyle: PlaystyleAnalysis = {
    aggressionScore: Math.min(100, ((avgKills / Math.max(avgDeaths, 1)) / 3) * 100),
    visionScore: Math.min(100, (avgVisionScore / maxVision) * 100),
    farmingScore: Math.min(100, (goldPerMin / maxGoldPerMin) * 100),
    teamfightScore: Math.min(100, (damagePerMin / maxDamagePerMin) * 100),
    survivabilityScore: Math.min(100, Math.max(0, (1 - (avgDeaths / 10)) * 100)),
    earlyGameScore: calculateEarlyGameScore(participants),
    objectiveScore: Math.min(100, ((avgVisionScore / 30) + (avgDamageDealt / 20000)) * 50),
  };

  // Get win/loss streaks
  let currentStreak = 0;
  let streakType: "win" | "loss" | null = null;
  for (const p of participants) {
    if (streakType === null) {
      streakType = p.win ? "win" : "loss";
      currentStreak = 1;
    } else if ((p.win && streakType === "win") || (!p.win && streakType === "loss")) {
      currentStreak++;
    } else {
      break;
    }
  }

  // Recent form (last 10 games)
  const last10 = participants.slice(0, 10);
  const recentWinRate = last10.length > 0
    ? (last10.filter(p => p.win).length / last10.length) * 100
    : 0;

  return {
    puuid,
    gameName: account?.riotGameName || "Unknown",
    tagLine: account?.riotTagLine || region.toUpperCase(),
    region,
    profileIconId: account?.profileIconId || undefined,
    summonerLevel: account?.summonerLevel || undefined,
    stats: {
      totalGames,
      wins,
      losses,
      winRate: (wins / totalGames) * 100,
      avgKills,
      avgDeaths,
      avgAssists,
      avgKDA,
      avgVisionScore,
      avgDamageDealt,
      avgDamageTaken,
      avgGoldEarned,
      goldPerMin,
      damagePerMin,
      avgGameDuration: avgGameDurationMinutes,
    },
    rankedInfo,
    rankProgression,
    topChampions,
    roleDistribution,
    playstyle,
    recentForm: {
      last10WinRate: recentWinRate,
      currentStreak,
      streakType,
    },
  };
}

function calculateEarlyGameScore(participants: Array<{ win: boolean; match: { gameDuration: number } | null }>): number {
  // Score based on win rate in shorter games (under 25 min)
  const shortGames = participants.filter(p => (p.match?.gameDuration || 0) < 1500);
  if (shortGames.length < 5) return 50; // Not enough data

  const shortGameWinRate = shortGames.filter(p => p.win).length / shortGames.length;
  return Math.min(100, shortGameWinRate * 100);
}

function findCommonChampions(
  champs1: ChampionStat[],
  champs2: ChampionStat[]
): Array<{ championId: string; player1: ChampionStat; player2: ChampionStat }> {
  const common: Array<{ championId: string; player1: ChampionStat; player2: ChampionStat }> = [];

  for (const c1 of champs1) {
    const c2 = champs2.find(c => c.championId === c1.championId);
    if (c2 && c1.games >= 3 && c2.games >= 3) { // At least 3 games each
      common.push({ championId: c1.championId, player1: c1, player2: c2 });
    }
  }

  return common.sort((a, b) => (b.player1.games + b.player2.games) - (a.player1.games + a.player2.games));
}

function calculateDuoSynergy(player1: Awaited<ReturnType<typeof getPlayerStats>>, player2: Awaited<ReturnType<typeof getPlayerStats>>): {
  roleCompatibility: number;
  playstyleCompatibility: number;
  recommendations: string[];
} {
  if (!player1 || !player2) return { roleCompatibility: 0, playstyleCompatibility: 0, recommendations: [] };

  const recommendations: string[] = [];

  // Check if they play complementary roles
  const p1MainRole = player1.roleDistribution[0]?.role;
  const p2MainRole = player2.roleDistribution[0]?.role;

  const complementaryRoles: Record<string, string[]> = {
    "BOTTOM": ["UTILITY"],
    "UTILITY": ["BOTTOM"],
    "JUNGLE": ["MIDDLE", "TOP"],
    "MIDDLE": ["JUNGLE"],
    "TOP": ["JUNGLE"],
  };

  let roleCompatibility = 50; // Base
  if (p1MainRole && p2MainRole && p1MainRole !== p2MainRole) {
    roleCompatibility = 70;
    if (complementaryRoles[p1MainRole]?.includes(p2MainRole)) {
      roleCompatibility = 95;
      recommendations.push(`${p1MainRole} et ${p2MainRole} forment une excellente synergie de rôles`);
    }
  } else if (p1MainRole === p2MainRole) {
    roleCompatibility = 30;
    recommendations.push(`Les deux joueurs préfèrent le même rôle (${p1MainRole})`);
  }

  // Playstyle compatibility
  const p1Style = player1.playstyle;
  const p2Style = player2.playstyle;

  // Complementary styles work well (aggressive + defensive)
  const aggressionDiff = Math.abs(p1Style.aggressionScore - p2Style.aggressionScore);
  const playstyleCompatibility = 50 + (aggressionDiff > 30 ? 20 : -10) +
    (Math.min(p1Style.visionScore, p2Style.visionScore) > 50 ? 15 : 0) +
    ((p1Style.teamfightScore + p2Style.teamfightScore) / 2 > 60 ? 15 : 0);

  if (p1Style.visionScore > 60 && p2Style.visionScore > 60) {
    recommendations.push("Excellente vision de map combinée");
  }
  if (p1Style.aggressionScore > 70 && p2Style.survivabilityScore > 70) {
    recommendations.push("Bonne complémentarité agressif/défensif");
  }

  return {
    roleCompatibility: Math.min(100, Math.max(0, roleCompatibility)),
    playstyleCompatibility: Math.min(100, Math.max(0, playstyleCompatibility)),
    recommendations,
  };
}

function suggestBans(
  player: Awaited<ReturnType<typeof getPlayerStats>>
): Array<{ championId: string; reason: string; priority: number }> {
  if (!player) return [];

  const bans: Array<{ championId: string; reason: string; priority: number }> = [];

  // Ban their best champions (high winrate + many games)
  for (const champ of player.topChampions.slice(0, 5)) {
    if (champ.winRate > 55 && champ.games >= 5) {
      bans.push({
        championId: champ.championId,
        reason: `${champ.winRate.toFixed(0)}% WR sur ${champ.games} parties`,
        priority: champ.winRate * Math.log(champ.games + 1),
      });
    }
  }

  return bans.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const puuid1 = searchParams.get("puuid1");
    const puuid2 = searchParams.get("puuid2");
    const region1 = searchParams.get("region1") || "euw1";
    const region2 = searchParams.get("region2") || "euw1";

    if (!puuid1 || !puuid2) {
      return NextResponse.json(
        { success: false, error: "puuid1 et puuid2 requis" },
        { status: 400 }
      );
    }

    const [player1, player2] = await Promise.all([
      getPlayerStats(puuid1, region1),
      getPlayerStats(puuid2, region2),
    ]);

    if (!player1) {
      return NextResponse.json(
        { success: false, error: "Joueur 1 non trouve ou sans parties" },
        { status: 404 }
      );
    }

    if (!player2) {
      return NextResponse.json(
        { success: false, error: "Joueur 2 non trouve ou sans parties" },
        { status: 404 }
      );
    }

    // Find common champions
    const commonChampions = findCommonChampions(player1.topChampions, player2.topChampions);

    // Calculate duo synergy
    const duoSynergy = calculateDuoSynergy(player1, player2);

    // Suggest bans for each player
    const bansAgainstPlayer1 = suggestBans(player1);
    const bansAgainstPlayer2 = suggestBans(player2);

    return NextResponse.json({
      success: true,
      data: {
        player1,
        player2,
        comparison: {
          commonChampions,
          duoSynergy,
          bansAgainstPlayer1,
          bansAgainstPlayer2,
        },
      },
    });
  } catch (error) {
    logger.error("Error:", error as Error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
