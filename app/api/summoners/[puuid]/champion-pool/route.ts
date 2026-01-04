import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger("champion-pool");

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

interface PoolAnalysis {
  strengths: ChampionStats[];
  needsWork: ChampionStats[];
  recommended: ChampionStats[];
  roleDistribution: Record<string, number>;
  poolDiversity: number;
  totalGamesAnalyzed: number;
}

/**
 * GET /api/summoners/[puuid]/champion-pool
 * Analyzes player's champion pool and provides recommendations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ puuid: string }> }
) {
  try {
    const { puuid } = await params;

    if (!puuid) {
      return NextResponse.json(
        { success: false, error: "puuid parameter required" },
        { status: 400 }
      );
    }

    // Fetch player's match history with stats
    const participants = await prisma.matchParticipant.findMany({
      where: {
        participantPUuid: puuid,
      },
      select: {
        championId: true,
        kills: true,
        deaths: true,
        assists: true,
        win: true,
        role: true,
        lane: true,
        match: {
          select: {
            queueId: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100, // Last 100 games
    });

    if (participants.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          strengths: [],
          needsWork: [],
          recommended: [],
          roleDistribution: {},
          poolDiversity: 0,
          totalGamesAnalyzed: 0,
        },
      });
    }

    // Aggregate stats by champion
    const championStats = new Map<string, {
      games: number;
      wins: number;
      kills: number;
      deaths: number;
      assists: number;
      roles: Set<string>;
    }>();

    const roleCount: Record<string, number> = {};

    for (const p of participants) {
      const existing = championStats.get(p.championId) || {
        games: 0,
        wins: 0,
        kills: 0,
        deaths: 0,
        assists: 0,
        roles: new Set<string>(),
      };

      existing.games++;
      if (p.win) existing.wins++;
      existing.kills += p.kills;
      existing.deaths += p.deaths;
      existing.assists += p.assists;
      if (p.role) existing.roles.add(p.role);

      championStats.set(p.championId, existing);

      // Track role distribution
      const role = p.role || p.lane || "UNKNOWN";
      roleCount[role] = (roleCount[role] || 0) + 1;
    }

    // Convert to array with calculations
    const championsArray: ChampionStats[] = Array.from(championStats.entries())
      .map(([championId, stats]) => ({
        championId,
        games: stats.games,
        wins: stats.wins,
        winRate: Math.round((stats.wins / stats.games) * 100),
        kills: stats.kills,
        deaths: stats.deaths,
        assists: stats.assists,
        avgKDA: stats.deaths === 0
          ? stats.kills + stats.assists
          : Number(((stats.kills + stats.assists) / stats.deaths).toFixed(2)),
      }))
      .sort((a, b) => b.games - a.games);

    // Champions with at least 3 games for meaningful analysis
    const meaningfulChampions = championsArray.filter((c) => c.games >= 3);

    // Strengths: High win rate (>55%) with enough games
    const strengths = meaningfulChampions
      .filter((c) => c.winRate >= 55)
      .sort((a, b) => b.winRate - a.winRate)
      .slice(0, 5);

    // Needs work: Low win rate (<45%) with enough games
    const needsWork = meaningfulChampions
      .filter((c) => c.winRate < 45 && c.games >= 5)
      .sort((a, b) => a.winRate - b.winRate)
      .slice(0, 3);

    // Recommended: High KDA champions they don't play much yet
    // (1-2 games, but good performance)
    const recommended = championsArray
      .filter((c) => c.games >= 1 && c.games <= 3 && c.avgKDA >= 2.5)
      .sort((a, b) => b.avgKDA - a.avgKDA)
      .slice(0, 3);

    // Calculate pool diversity (unique champions / total games)
    const poolDiversity = Math.round(
      (championStats.size / participants.length) * 100
    );

    return NextResponse.json({
      success: true,
      data: {
        strengths,
        needsWork,
        recommended,
        roleDistribution: roleCount,
        poolDiversity,
        totalGamesAnalyzed: participants.length,
      },
    });
  } catch (error) {
    logger.error("Error analyzing champion pool", error as Error);
    return NextResponse.json(
      { success: false, error: "Failed to analyze champion pool" },
      { status: 500 }
    );
  }
}
