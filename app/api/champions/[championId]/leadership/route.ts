import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ShardedLeagueAccounts } from "@/lib/prisma-sharded-accounts";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ championId: string }> }
) {
  try {
    const { championId } = await params;

    // Récupérer les participants pour ce champion avec leurs informations
    const participants = await prisma.matchParticipant.findMany({
      where: {
        championId,
        participantPUuid: {
          not: null,
        },
      },
      select: {
        participantPUuid: true,
        win: true,
        kills: true,
        deaths: true,
        assists: true,
      },
    });

    // Agrégation des statistiques par joueur
    const playerStatsMap = new Map<
      string,
      {
        totalGames: number;
        wins: number;
        totalKills: number;
        totalDeaths: number;
        totalAssists: number;
      }
    >();

    for (const participant of participants) {
      if (!participant.participantPUuid) continue;

      const puuid = participant.participantPUuid;
      const stats = playerStatsMap.get(puuid) ?? {
        totalGames: 0,
        wins: 0,
        totalKills: 0,
        totalDeaths: 0,
        totalAssists: 0,
      };

      stats.totalGames++;
      if (participant.win) stats.wins++;
      stats.totalKills += participant.kills;
      stats.totalDeaths += participant.deaths;
      stats.totalAssists += participant.assists;

      playerStatsMap.set(puuid, stats);
    }

    // Récupérer les informations des comptes depuis les tables shardées
    const puuids = Array.from(playerStatsMap.keys());
    // Chercher dans toutes les régions car on ne connaît pas la région de chaque PUUID
    const accountsMap = await ShardedLeagueAccounts.findManyByPuuidsGlobal(
      puuids
    );
    const accounts = Array.from(accountsMap.values()).map((acc) => ({
      puuid: acc.puuid,
      riotGameName: acc.riotGameName,
      riotTagLine: acc.riotTagLine,
      riotRegion: acc.riotRegion,
      profileIconId: acc.profileIconId,
      summonerLevel: acc.summonerLevel,
    }));

    // Récupérer aussi depuis DiscoveredPlayer pour les joueurs non trouvés
    const foundPuuids = new Set(accounts.map((acc) => acc.puuid));
    const missingPuuids = puuids.filter((puuid) => !foundPuuids.has(puuid));
    
    const discoveredPlayers = missingPuuids.length > 0
      ? await prisma.discoveredPlayer.findMany({
          where: {
            puuid: {
              in: missingPuuids,
            },
          },
          select: {
            puuid: true,
            riotGameName: true,
            riotTagLine: true,
            riotRegion: true,
          },
        })
      : [];

    // accountsMap est déjà créé par findManyByPuuidsGlobal, on le convertit au bon format
    const accountsMapFormatted = new Map(
      accounts.map((acc) => [acc.puuid, acc])
    );

    // Ajouter les joueurs découverts qui n'ont pas de compte
    for (const discovered of discoveredPlayers) {
      if (!accountsMapFormatted.has(discovered.puuid)) {
        accountsMapFormatted.set(discovered.puuid, {
          puuid: discovered.puuid,
          riotGameName: discovered.riotGameName,
          riotTagLine: discovered.riotTagLine,
          riotRegion: discovered.riotRegion,
          profileIconId: null,
          summonerLevel: null,
        });
      }
    }

    // Calculer les statistiques pour chaque joueur
    const leaderboard = Array.from(playerStatsMap.entries()).map(
      ([puuid, stats]) => {
        const totalGames = stats.totalGames;
        const wins = stats.wins;
        const totalKills = stats.totalKills;
        const totalDeaths = stats.totalDeaths;
        const totalAssists = stats.totalAssists;

        const winRate = totalGames > 0 ? wins / totalGames : 0;
        const avgKDA =
          totalDeaths > 0
            ? (totalKills + totalAssists) / totalDeaths
            : totalKills + totalAssists;

        const account = accountsMapFormatted.get(puuid);

        return {
          puuid,
          gameName: account?.riotGameName ?? null,
          tagLine: account?.riotTagLine ?? null,
          region: account?.riotRegion ?? null,
          profileIconId: account?.profileIconId ?? null,
          summonerLevel: account?.summonerLevel ?? null,
          totalGames,
          wins,
          losses: totalGames - wins,
          winRate,
          totalKills,
          totalDeaths,
          totalAssists,
          avgKDA,
          avgKills: totalGames > 0 ? totalKills / totalGames : 0,
          avgDeaths: totalGames > 0 ? totalDeaths / totalGames : 0,
          avgAssists: totalGames > 0 ? totalAssists / totalGames : 0,
        };
      }
    );

    // Trier par score (combinaison de winRate, totalGames et avgKDA)
    // Score = (winRate * 0.4 + min(totalGames / 100, 1) * 0.2 + min(avgKDA / 5, 1) * 0.4) * 100
    const sortedLeaderboard = leaderboard
      .map((player) => {
        const volumeScore = Math.min(player.totalGames / 100, 1);
        const kdaScore = Math.min(player.avgKDA / 5, 1);
        const score =
          (player.winRate * 0.4 + volumeScore * 0.2 + kdaScore * 0.4) * 100;
        return {
          ...player,
          score,
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 50); // Top 50 joueurs

    return NextResponse.json({
      success: true,
      data: {
        leaderboard: sortedLeaderboard,
        totalPlayers: leaderboard.length,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des données",
      },
      { status: 500 }
    );
  }
}

