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

    // Calculer les moyennes et déterminer les min/max pour la normalisation
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

        return {
          championId,
          stats,
          winRate,
          avgKDA,
          avgDamageDealt,
          avgVisionScore,
        };
      }
    );

    // Trouver les min/max pour la normalisation (seulement pour les champions avec au moins 10 parties pour la fiabilité)
    const reliableStats = allStats.filter((s) => s.stats.games >= 10);

    const maxWinRate = Math.max(...reliableStats.map((s) => s.winRate), 100);
    const minWinRate = Math.min(...reliableStats.map((s) => s.winRate), 0);

    const maxKDA = Math.max(...reliableStats.map((s) => s.avgKDA), 5);
    const minKDA = Math.min(...reliableStats.map((s) => s.avgKDA), 0);

    const maxDamage = Math.max(
      ...reliableStats.map((s) => s.avgDamageDealt),
      50000
    );
    const minDamage = Math.min(
      ...reliableStats.map((s) => s.avgDamageDealt),
      0
    );

    const maxVision = Math.max(
      ...reliableStats.map((s) => s.avgVisionScore),
      100
    );
    const minVision = Math.min(
      ...reliableStats.map((s) => s.avgVisionScore),
      0
    );

    // Fonction de normalisation (0-100)
    const normalize = (value: number, min: number, max: number): number => {
      if (max === min) return 50; // Valeur par défaut si pas de variation
      return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
    };

    // Calculer les moyennes et upsert dans la base
    let created = 0;
    let updated = 0;

    for (const {
      championId,
      stats,
      winRate,
      avgKDA,
      avgDamageDealt,
      avgVisionScore,
    } of allStats) {
      // Calculer le score agrégé
      // Formule: winRate (40%) + KDA normalisé (30%) + Dégâts normalisés (20%) + Vision normalisée (10%)
      // Seulement pour les champions avec au moins 10 parties pour la fiabilité
      let score = 0;
      if (stats.games >= 10) {
        const normalizedWinRate = normalize(winRate, minWinRate, maxWinRate);
        const normalizedKDA = normalize(avgKDA, minKDA, maxKDA);
        const normalizedDamage = normalize(
          avgDamageDealt,
          minDamage,
          maxDamage
        );
        const normalizedVision = normalize(
          avgVisionScore,
          minVision,
          maxVision
        );

        score =
          normalizedWinRate * 0.4 +
          normalizedKDA * 0.3 +
          normalizedDamage * 0.2 +
          normalizedVision * 0.1;
      }

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
            score,
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
            score,
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
