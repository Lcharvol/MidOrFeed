import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

async function getPlayerStats(puuid: string, region: string) {
  // Get account info
  const account = await prisma.leagueOfLegendsAccount.findUnique({
    where: { puuid },
  });

  // Get match stats
  const participants = await prisma.matchParticipant.findMany({
    where: { participantPUuid: puuid },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  if (participants.length === 0) {
    return null;
  }

  const totalGames = participants.length;
  const wins = participants.filter((p) => p.win).length;
  const losses = totalGames - wins;

  const avgKills = participants.reduce((sum, p) => sum + p.kills, 0) / totalGames;
  const avgDeaths = participants.reduce((sum, p) => sum + p.deaths, 0) / totalGames;
  const avgAssists = participants.reduce((sum, p) => sum + p.assists, 0) / totalGames;
  const avgKDA = avgDeaths > 0 ? (avgKills + avgAssists) / avgDeaths : avgKills + avgAssists;
  const avgVisionScore = participants.reduce((sum, p) => sum + p.visionScore, 0) / totalGames;
  const avgDamageDealt =
    participants.reduce((sum, p) => sum + p.totalDamageDealtToChampions, 0) / totalGames;

  // Get top champions
  const championStats: Record<string, { games: number; wins: number }> = {};
  for (const p of participants) {
    if (!championStats[p.championId]) {
      championStats[p.championId] = { games: 0, wins: 0 };
    }
    championStats[p.championId].games++;
    if (p.win) championStats[p.championId].wins++;
  }

  const topChampions = Object.entries(championStats)
    .map(([championId, stats]) => ({
      championId,
      games: stats.games,
      wins: stats.wins,
      winRate: (stats.wins / stats.games) * 100,
    }))
    .sort((a, b) => b.games - a.games)
    .slice(0, 5);

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
    },
    topChampions,
  };
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

    return NextResponse.json({
      success: true,
      data: { player1, player2 },
    });
  } catch (error) {
    console.error("[COMPARE] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
