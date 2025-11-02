import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Route API pour obtenir la liste des matchs avec leurs statistiques
 * GET /api/matches/list?puuid={puuid}
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const puuid = searchParams.get("puuid");

    const matches = await prisma.match.findMany({
      include: {
        participants: true,
      },
      orderBy: {
        gameCreation: "desc",
      },
      take: 100, // Limiter à 100 matchs les plus récents
    });

    // Si un PUUID est fourni, ne garder que les participants correspondants
    if (puuid) {
      matches.forEach((match) => {
        match.participants = match.participants.filter(
          (p) => p.participantPUuid === puuid
        );
      });
    }

    // Calculer les statistiques agrégées
    let totalMatches = 0;
    let totalWins = 0;
    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;

    // Statistiques par champion
    const championStats: Record<
      string,
      {
        played: number;
        wins: number;
        kills: number;
        deaths: number;
        assists: number;
      }
    > = {};

    // Statistiques par rôle
    const roleStats: Record<
      string,
      {
        played: number;
        wins: number;
      }
    > = {};

    matches.forEach((match) => {
      // Ne compter que les matchs où l'utilisateur a participé si un PUUID est fourni
      if (!puuid || match.participants.length > 0) {
        totalMatches++;
      }

      match.participants.forEach((participant) => {
        totalKills += participant.kills;
        totalDeaths += participant.deaths;
        totalAssists += participant.assists;

        if (participant.win) {
          totalWins++;
        }

        // Stats par champion
        if (!championStats[participant.championId]) {
          championStats[participant.championId] = {
            played: 0,
            wins: 0,
            kills: 0,
            deaths: 0,
            assists: 0,
          };
        }
        championStats[participant.championId].played++;
        championStats[participant.championId].kills += participant.kills;
        championStats[participant.championId].deaths += participant.deaths;
        championStats[participant.championId].assists += participant.assists;
        if (participant.win) {
          championStats[participant.championId].wins++;
        }

        // Stats par rôle
        if (participant.role) {
          if (!roleStats[participant.role]) {
            roleStats[participant.role] = {
              played: 0,
              wins: 0,
            };
          }
          roleStats[participant.role].played++;
          if (participant.win) {
            roleStats[participant.role].wins++;
          }
        }
      });
    });

    const winRate = totalMatches > 0 ? (totalWins / totalMatches) * 100 : 0;
    const avgKDA =
      totalMatches > 0
        ? `${(totalKills / totalMatches).toFixed(1)} / ${(
            totalDeaths / totalMatches
          ).toFixed(1)} / ${(totalAssists / totalMatches).toFixed(1)}`
        : "0 / 0 / 0";

    // Convertir les BigInt en strings pour la sérialisation JSON
    const serializedMatches = matches.map((match) => ({
      ...match,
      gameCreation: match.gameCreation.toString(),
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          matches: serializedMatches,
          stats: {
            totalGames: totalMatches,
            totalWins,
            winRate: winRate.toFixed(1),
            avgKDA,
            totalKills,
            totalDeaths,
            totalAssists,
          },
          championStats,
          roleStats,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération des matchs:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des matchs",
      },
      { status: 500 }
    );
  }
}
