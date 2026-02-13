import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { createLogger } from "@/lib/logger";
import { toError } from "@/lib/errors";

const logger = createLogger("admin-stats");

/**
 * GET /api/admin/stats
 * Retourne les statistiques globales de la base de données
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.admin);
  if (rateLimitResponse) return rateLimitResponse;

  // Vérifier les permissions admin (skip CSRF for GET)
  const authError = await requireAdmin(request, { skipCsrf: true });
  if (authError) {
    return authError;
  }
  try {
    const [playerStats, totalPlayers, totalMatches, totalMatchesInDb, totalChampions, totalItems] = await Promise.all([
      prisma.discoveredPlayer.groupBy({
        by: ["crawlStatus"],
        _count: { id: true },
      }),
      prisma.discoveredPlayer.count(),
      prisma.discoveredPlayer.aggregate({
        _sum: { matchesCollected: true },
      }),
      prisma.match.count(),
      prisma.champion.count(),
      prisma.item.count(),
    ]);

    // Statistiques des comptes League of Legends (somme de toutes les tables shardées)
    // Utiliser UNION ALL pour optimiser le comptage en une seule requête
    const { getLeagueAccountsTableName } = await import(
      "@/lib/prisma-sharded-accounts"
    );
    const { MAIN_REGIONS } = await import("@/constants/riot-regions");
    const regions = MAIN_REGIONS;
    
    // Construire une requête UNION ALL pour compter toutes les tables en une seule requête
    const { validateTableName, escapeSqlIdentifier } = await import("@/lib/sql-sanitization");
    
    // Valider tous les noms de tables
    const tableNames = regions.map((region) => {
      const tableName = getLeagueAccountsTableName(region);
      if (!validateTableName(tableName)) {
        throw new Error(`Invalid table name: ${tableName}`);
      }
      return escapeSqlIdentifier(tableName);
    });

    // Construire la requête UNION ALL
    // Format: SELECT COUNT(*) FROM table1 UNION ALL SELECT COUNT(*) FROM table2 ...
    const unionQueries = tableNames
      .map((tableName) => `SELECT COUNT(*)::bigint as count FROM ${tableName}`)
      .join(" UNION ALL ");

    // Exécuter la requête et sommer les résultats
    const results = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      unionQueries
    );
    
    const totalAccounts = results.reduce(
      (sum, result) => sum + Number(result.count ?? 0),
      0
    );

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
    logger.error("Admin stats error", toError(error));
    return NextResponse.json(
      { error: "Erreur lors de la récupération des statistiques" },
      { status: 500 }
    );
  }
}
