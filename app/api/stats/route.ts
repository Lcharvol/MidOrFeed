import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { getOrSetCache, CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";

const logger = createLogger("stats");

type PublicStats = {
  totalMatches: number;
  totalPlayers: number;
  totalChampions: number;
};

/**
 * GET /api/stats
 * Retourne les statistiques publiques pour la page d'accueil
 * Endpoint cache pour eviter de surcharger la base de donnees
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const stats = await getOrSetCache<PublicStats>(
      "public:stats",
      CacheTTL.LONG, // 30 minutes - les stats changent lentement
      async () => {
        const [totalMatches, totalPlayers, totalChampions] = await Promise.all([
          prisma.match.count({
            where: { participants: { some: {} } },
          }),
          prisma.discoveredPlayer.count(),
          prisma.champion.count(),
        ]);

        return {
          totalMatches,
          totalPlayers,
          totalChampions,
        };
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: stats,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600",
        },
      }
    );
  } catch (error) {
    logger.error("Erreur:", error as Error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la recuperation des statistiques" },
      { status: 500 }
    );
  }
}
