import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";

/**
 * GET /api/admin/stats
 * Retourne les statistiques globales de la base de données
 */
export async function GET(request: NextRequest) {
  // Vérifier les permissions admin
  const authError = await requireAdmin(request);
  if (authError) {
    return authError;
  }
  try {
    // Statistiques des joueurs découverts
    const playerStats = await prisma.discoveredPlayer.groupBy({
      by: ["crawlStatus"],
      _count: { id: true },
    });

    const totalPlayers = await prisma.discoveredPlayer.count();

    const totalMatches = await prisma.discoveredPlayer.aggregate({
      _sum: { matchesCollected: true },
    });

    // Statistiques des matchs
    const totalMatchesInDb = await prisma.match.count();

    // Statistiques des champions
    const totalChampions = await prisma.champion.count();

    // Statistiques des items
    const totalItems = await prisma.item.count();

    // Statistiques des comptes League of Legends
    const totalAccounts = await prisma.leagueOfLegendsAccount.count();

    // Convertir les stats des joueurs en objet
    const byStatus: Record<string, number> = {};
    for (const stat of playerStats) {
      byStatus[stat.crawlStatus] = stat._count.id;
    }

    return NextResponse.json(
      {
        success: true,
        totalPlayers,
        totalMatches: totalMatches._sum.matchesCollected || 0,
        totalMatchesInDb,
        totalChampions,
        totalItems,
        totalAccounts,
        byStatus,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[ADMIN/STATS] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
