import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { MATCHES_PAGE_LIMIT } from "@/constants/matches";

const logger = createLogger("matches");

/**
 * Route API pour obtenir la liste des matchs avec leurs statistiques
 * GET /api/matches/list?puuid={puuid}
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const puuid = searchParams.get("puuid");

    const matches = await prisma.match.findMany({
      where: puuid
        ? {
            participants: {
              some: {
                participantPUuid: puuid,
              },
            },
          }
        : {},
      include: {
      participants: {
        include: {
          match: {
            select: {
              queueId: true,
              region: true,
              gameDuration: true,
              gameMode: true,
              platformId: true,
              gameVersion: true,
              gameCreation: true,
            },
          },
        },
      },
      },
      orderBy: {
        gameCreation: "desc",
      },
      take: MATCHES_PAGE_LIMIT,
    });

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

    // Fonction de normalisation des rôles
    const normalizeRole = (role: string | null, lane: string | null): string | null => {
      if (!role) return null;

      const upperRole = role.toUpperCase();
      const upperLane = lane?.toUpperCase() || "";

      // Mapper les rôles Riot vers nos clés internes
      // Riot API utilise: TOP, JUNGLE, MIDDLE, DUO_CARRY (ADC), DUO_SUPPORT (Support), UTILITY (Support)
      switch (upperRole) {
        case "TOP":
          return "TOP";
        case "JUNGLE":
          return "JUNGLE";
        case "MIDDLE":
        case "MID":
          return "MID";
        case "DUO_CARRY":
        case "ADC":
          return "ADC";
        case "DUO_SUPPORT":
        case "UTILITY":
        case "SUPPORT":
          return "SUPPORT";
        case "BOTTOM":
          // BOTTOM peut être ambigu, mais généralement c'est ADC si lane est BOTTOM
          // Sinon on considère comme SUPPORT par défaut
          // Note: Cette logique peut être ajustée selon les données réelles
          return upperLane === "BOTTOM" ? "ADC" : "SUPPORT";
        default:
          // Si le rôle n'est pas reconnu, essayer de le retourner tel quel en majuscules
          return upperRole;
      }
    };

    // Statistiques par rôle
    const roleStats: Record<
      string,
      {
        played: number;
        wins: number;
      }
    > = {};

    matches.forEach((match) => {
      const relevantParticipants = puuid
        ? match.participants.filter(
            (participant) => participant.participantPUuid === puuid
          )
        : match.participants;

      if (relevantParticipants.length === 0) {
        return;
      }

      totalMatches++;

      relevantParticipants.forEach((participant) => {
        totalKills += participant.kills;
        totalDeaths += participant.deaths;
        totalAssists += participant.assists;

        if (participant.win) {
          totalWins++;
        }

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

        const normalizedRole = normalizeRole(participant.role, participant.lane);
        if (normalizedRole) {
          if (!roleStats[normalizedRole]) {
            roleStats[normalizedRole] = {
              played: 0,
              wins: 0,
            };
          }
          roleStats[normalizedRole].played++;
          if (participant.win) {
            roleStats[normalizedRole].wins++;
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
      participants: match.participants.map((participant) => ({
        ...participant,
        match: participant.match
          ? {
              ...participant.match,
              gameCreation: participant.match.gameCreation.toString(),
            }
          : undefined,
      })),
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
    logger.error("Erreur lors de la récupération des matchs", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des matchs",
      },
      { status: 500 }
    );
  }
}
