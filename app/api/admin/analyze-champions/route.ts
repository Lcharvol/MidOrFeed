import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;

  try {
    console.log("[ANALYZE-CHAMPIONS] Début de l'analyse...");

    // Récupérer tous les participants de matchs
    const participants = await prisma.matchParticipant.findMany({
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

    if (participants.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun participant trouvé dans la base de données",
        },
        { status: 400 }
      );
    }

    // Grouper par champion
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
      const existing = statsByChampion.get(p.championId) || {
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
        existing.roles.set(p.role, (existing.roles.get(p.role) || 0) + 1);
      }
      if (p.lane) {
        existing.lanes.set(p.lane, (existing.lanes.get(p.lane) || 0) + 1);
      }

      statsByChampion.set(p.championId, existing);
    }

    // Calculer les moyennes et upsert dans la base
    let created = 0;
    let updated = 0;

    for (const [championId, stats] of statsByChampion.entries()) {
      const winRate = stats.games > 0 ? (stats.wins / stats.games) * 100 : 0;
      const avgKDA =
        stats.deaths > 0
          ? (stats.kills + stats.assists) / stats.deaths
          : stats.kills + stats.assists;

      // Trouver le rôle et la lane les plus joués
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

      const existing = await prisma.championStats.findUnique({
        where: { championId },
      });

      if (existing) {
        await prisma.championStats.update({
          where: { championId },
          data: {
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
            topRole,
            topLane,
            lastAnalyzedAt: new Date(),
          },
        });
        updated++;
      } else {
        await prisma.championStats.create({
          data: {
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
            topRole,
            topLane,
            lastAnalyzedAt: new Date(),
          },
        });
        created++;
      }
    }

    console.log(
      `[ANALYZE-CHAMPIONS] Analyse terminée: ${created} créés, ${updated} mis à jour`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Analyse des champions terminée",
        data: {
          totalChampions: statsByChampion.size,
          created,
          updated,
          totalParticipants: participants.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ANALYZE-CHAMPIONS] Erreur:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de l'analyse des champions",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
