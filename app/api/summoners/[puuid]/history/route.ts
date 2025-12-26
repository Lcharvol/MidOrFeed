import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type HistoryParams = { params: Promise<{ puuid: string }> };

// GET /api/summoners/[puuid]/history - Get performance history for charts
export async function GET(request: NextRequest, { params }: HistoryParams) {
  try {
    const { puuid } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30", 10);

    if (!puuid) {
      return NextResponse.json(
        { success: false, error: "puuid requis" },
        { status: 400 }
      );
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get match history with daily aggregation
    const matches = await prisma.matchParticipant.findMany({
      where: {
        participantPUuid: puuid,
        match: {
          gameCreation: {
            gte: BigInt(startDate.getTime()),
          },
        },
      },
      include: {
        match: {
          select: {
            gameCreation: true,
            queueId: true,
          },
        },
      },
      orderBy: {
        match: {
          gameCreation: "asc",
        },
      },
    });

    // Aggregate by day
    const dailyStats: Record<string, {
      date: string;
      games: number;
      wins: number;
      kills: number;
      deaths: number;
      assists: number;
    }> = {};

    for (const match of matches) {
      const date = new Date(Number(match.match.gameCreation)).toISOString().split("T")[0];

      if (!dailyStats[date]) {
        dailyStats[date] = { date, games: 0, wins: 0, kills: 0, deaths: 0, assists: 0 };
      }

      dailyStats[date].games++;
      if (match.win) dailyStats[date].wins++;
      dailyStats[date].kills += match.kills;
      dailyStats[date].deaths += match.deaths;
      dailyStats[date].assists += match.assists;
    }

    // Convert to array and calculate cumulative stats
    const dailyArray = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));

    let cumulativeGames = 0;
    let cumulativeWins = 0;

    const chartData = dailyArray.map((day) => {
      cumulativeGames += day.games;
      cumulativeWins += day.wins;
      const winRate = cumulativeGames > 0 ? (cumulativeWins / cumulativeGames) * 100 : 0;
      const kda = day.deaths > 0 ? (day.kills + day.assists) / day.deaths : day.kills + day.assists;

      return {
        date: day.date,
        games: day.games,
        wins: day.wins,
        losses: day.games - day.wins,
        winRate: Math.round(winRate * 10) / 10,
        dailyWinRate: day.games > 0 ? Math.round((day.wins / day.games) * 1000) / 10 : 0,
        kda: Math.round(kda * 100) / 100,
        kills: day.kills,
        deaths: day.deaths,
        assists: day.assists,
        cumulativeGames,
        cumulativeWins,
      };
    });

    // Get role performance
    const roleStats: Record<string, { games: number; wins: number }> = {};
    for (const match of matches) {
      const role = match.role || match.lane || "UNKNOWN";
      if (!roleStats[role]) {
        roleStats[role] = { games: 0, wins: 0 };
      }
      roleStats[role].games++;
      if (match.win) roleStats[role].wins++;
    }

    const roleData = Object.entries(roleStats).map(([role, stats]) => ({
      role,
      games: stats.games,
      wins: stats.wins,
      winRate: stats.games > 0 ? Math.round((stats.wins / stats.games) * 1000) / 10 : 0,
    }));

    return NextResponse.json({
      success: true,
      data: {
        daily: chartData,
        roles: roleData,
        summary: {
          totalGames: matches.length,
          totalWins: matches.filter((m) => m.win).length,
          winRate: matches.length > 0
            ? Math.round((matches.filter((m) => m.win).length / matches.length) * 1000) / 10
            : 0,
          period: days,
        },
      },
    });
  } catch (error) {
    console.error("[HISTORY] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
