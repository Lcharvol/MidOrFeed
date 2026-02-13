import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import {
  normalizeLane,
  resolveChampionRole,
} from "@/lib/compositions/roles";
import { getTiersForBracket, RANK_BRACKETS } from "@/constants/ranks";

const logger = createLogger("champion-stats");

// Calculer la tendance du win rate en comparant avec l'historique récent (7 jours)
const calculateWinRateTrend = (
  currentWinRate: number,
  previousWinRate: number | null
): { trend: "up" | "down" | "stable"; change: number } | null => {
  if (previousWinRate === null) return null;

  const change = currentWinRate - previousWinRate;
  const threshold = 0.5; // Seuil de 0.5% pour considérer une tendance

  if (Math.abs(change) < threshold) {
    return { trend: "stable", change: 0 };
  }

  return {
    trend: change > 0 ? "up" : "down",
    change: Math.abs(change),
  };
};

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const rank = searchParams.get("rank");

  // Validate rank bracket if provided
  const validRank = rank && RANK_BRACKETS.some((b) => b.key === rank) ? rank : null;
  const tierFilter = validRank && validRank !== "ALL" ? getTiersForBracket(validRank) : null;

  try {
    // If rank filter is active, compute stats on-demand from participants
    if (tierFilter) {
      return await computeFilteredStats(tierFilter);
    }

    // Default: use pre-calculated ChampionStats table
    const stats = await prisma.championStats.findMany({
      orderBy: [{ score: "desc" }, { totalGames: "desc" }],
    });

    // Compter le nombre total de matchs uniques dans la base de données
    // Compter tous les matchs qui ont été analysés (qui ont des participants)
    const totalUniqueMatches = await prisma.match.count({
      where: {
        participants: {
          some: {},
        },
      },
    });

    if (stats.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
          count: 0,
          totalUniqueMatches,
        },
        {
          status: 200,
          headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
        }
      );
    }

    const championIds = stats.map((stat) => stat.championId);

    // Pour chaque champion, récupérer le deuxième enregistrement le plus récent
    // Le premier est probablement l'actuel, donc on prend le deuxième pour la comparaison
    const historyMap = new Map<string, number>();

    // Fetch the 2 most recent history records per champion for trend calculation.
    // We fetch all records (bounded by analysis frequency, not user data) and
    // filter in JS because Prisma doesn't support per-group LIMIT.
    const allHistory = await prisma.championWinRateHistory.findMany({
      where: {
        championId: { in: championIds },
      },
      select: {
        championId: true,
        winRate: true,
        recordedAt: true,
      },
      orderBy: [
        { championId: "asc" },
        { recordedAt: "desc" },
      ],
    });

    // Pour chaque champion, prendre le deuxième enregistrement le plus récent
    // (le premier est probablement l'enregistrement de la dernière analyse)
    let currentChampionId: string | null = null;
    let recordCount = 0;

    for (const record of allHistory) {
      if (currentChampionId !== record.championId) {
        // Nouveau champion, réinitialiser le compteur
        currentChampionId = record.championId;
        recordCount = 1;
      } else {
        recordCount++;
      }

      // Prendre le deuxième enregistrement (recordCount === 2)
      if (recordCount === 2 && !historyMap.has(record.championId)) {
        historyMap.set(record.championId, record.winRate);
      }
    }

    // Calculer la tendance pour chaque champion
    const statsWithTrend = stats.map((stat) => {
      const previousWinRate = historyMap.get(stat.championId) ?? null;
      const trend = calculateWinRateTrend(stat.winRate, previousWinRate);

      return {
        ...stat,
        winRateTrend: trend,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: statsWithTrend,
        count: stats.length,
        totalUniqueMatches,
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      }
    );
  } catch (error) {
    logger.error("Erreur lors de la récupération des stats", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des statistiques",
      },
      { status: 500 }
    );
  }
}

/**
 * Compute champion stats on-demand filtered by participant tier.
 * Only considers Ranked Solo/Duo matches (queueId = 420).
 */
async function computeFilteredStats(tierFilter: string[]) {
  // Only ranked solo/duo matches — limit to most recent 10k to avoid memory issues
  const matchIds = await prisma.match.findMany({
    where: { queueId: 420 },
    select: { id: true },
    orderBy: { gameCreation: "desc" },
    take: 10000,
  });

  const matchIdList = matchIds.map((m) => m.id);

  if (matchIdList.length === 0) {
    return NextResponse.json(
      { success: true, data: [], count: 0, totalUniqueMatches: 0 },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
      }
    );
  }

  const participants = await prisma.matchParticipant.findMany({
    where: {
      matchId: { in: matchIdList },
      participantTier: { in: tierFilter },
    },
    select: {
      championId: true,
      win: true,
      kills: true,
      deaths: true,
      assists: true,
      goldEarned: true,
      goldSpent: true,
      totalDamageDealtToChampions: true,
      totalDamageTaken: true,
      visionScore: true,
      role: true,
      lane: true,
    },
  });

  // Group by champion
  const statsByChampion = new Map<
    string,
    {
      games: number;
      wins: number;
      kills: number;
      deaths: number;
      assists: number;
      goldEarned: number;
      goldSpent: number;
      damageDealt: number;
      damageTaken: number;
      visionScore: number;
      roles: Map<string, number>;
      lanes: Map<string, number>;
    }
  >();

  for (const p of participants) {
    const existing = statsByChampion.get(p.championId) ?? {
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      goldEarned: 0,
      goldSpent: 0,
      damageDealt: 0,
      damageTaken: 0,
      visionScore: 0,
      roles: new Map<string, number>(),
      lanes: new Map<string, number>(),
    };

    existing.games++;
    if (p.win) existing.wins++;
    existing.kills += p.kills;
    existing.deaths += p.deaths;
    existing.assists += p.assists;
    existing.goldEarned += p.goldEarned;
    existing.goldSpent += p.goldSpent;
    existing.damageDealt += p.totalDamageDealtToChampions;
    existing.damageTaken += p.totalDamageTaken;
    existing.visionScore += p.visionScore;

    if (p.role) {
      existing.roles.set(p.role, (existing.roles.get(p.role) ?? 0) + 1);
    }
    if (p.lane) {
      existing.lanes.set(p.lane, (existing.lanes.get(p.lane) ?? 0) + 1);
    }

    statsByChampion.set(p.championId, existing);
  }

  // Calculate averages and normalization ranges
  const allStats = Array.from(statsByChampion.entries()).map(
    ([championId, stats]) => {
      const games = stats.games;
      const winRate = games > 0 ? (stats.wins / games) * 100 : 0;
      const avgKDA =
        stats.deaths > 0
          ? (stats.kills + stats.assists) / stats.deaths
          : stats.kills + stats.assists;
      const avgDamageDealt = games > 0 ? stats.damageDealt / games : 0;
      const avgVisionScore = games > 0 ? stats.visionScore / games : 0;

      return { championId, stats, winRate, avgKDA, avgDamageDealt, avgVisionScore };
    }
  );

  // Normalization ranges (only champions with >= 10 games)
  const reliable = allStats.filter((s) => s.stats.games >= 10);

  const maxWinRate = Math.max(...reliable.map((s) => s.winRate), 100);
  const minWinRate = Math.min(...reliable.map((s) => s.winRate), 0);
  const maxKDA = Math.max(...reliable.map((s) => s.avgKDA), 5);
  const minKDA = Math.min(...reliable.map((s) => s.avgKDA), 0);
  const maxDamage = Math.max(...reliable.map((s) => s.avgDamageDealt), 50000);
  const minDamage = Math.min(...reliable.map((s) => s.avgDamageDealt), 0);
  const maxVision = Math.max(...reliable.map((s) => s.avgVisionScore), 100);
  const minVision = Math.min(...reliable.map((s) => s.avgVisionScore), 0);

  const normalize = (value: number, min: number, max: number): number => {
    if (max === min) return 50;
    return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  };

  const now = new Date().toISOString();
  const data = allStats.map(({ championId, stats, winRate, avgKDA, avgDamageDealt, avgVisionScore }) => {
    let score = 0;
    if (stats.games >= 10) {
      score =
        normalize(winRate, minWinRate, maxWinRate) * 0.4 +
        normalize(avgKDA, minKDA, maxKDA) * 0.3 +
        normalize(avgDamageDealt, minDamage, maxDamage) * 0.2 +
        normalize(avgVisionScore, minVision, maxVision) * 0.1;
    }

    // Determine top role/lane
    let topRole: string | null = null;
    let topLane: string | null = null;
    let maxRoleCount = 0;
    let maxLaneCount = 0;

    for (const [role, count] of stats.roles.entries()) {
      if (count > maxRoleCount) {
        maxRoleCount = count;
        topRole = role;
      }
    }
    for (const [lane, count] of stats.lanes.entries()) {
      if (count > maxLaneCount) {
        maxLaneCount = count;
        topLane = lane;
      }
    }

    const normalizedLane = normalizeLane(topLane)?.toString() ?? topLane;
    const resolvedRole = resolveChampionRole(topRole, topLane);
    const normalizedRole = resolvedRole ?? topRole;

    return {
      id: championId,
      championId,
      totalGames: stats.games,
      totalWins: stats.wins,
      totalLosses: stats.games - stats.wins,
      winRate,
      avgKills: stats.kills / stats.games,
      avgDeaths: stats.deaths / stats.games,
      avgAssists: stats.assists / stats.games,
      avgKDA,
      avgGoldEarned: stats.goldEarned / stats.games,
      avgGoldSpent: stats.goldSpent / stats.games,
      avgDamageDealt: stats.damageDealt / stats.games,
      avgDamageTaken: stats.damageTaken / stats.games,
      avgVisionScore: stats.visionScore / stats.games,
      topRole: normalizedRole,
      topLane: normalizedLane,
      weakAgainst: null,
      winRateTrend: null,
      score,
      lastAnalyzedAt: now,
    };
  });

  // Sort by score desc
  data.sort((a, b) => b.score - a.score);

  return NextResponse.json(
    {
      success: true,
      data,
      count: data.length,
      totalUniqueMatches: matchIdList.length,
    },
    {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    }
  );
}
