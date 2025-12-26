import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrSetCache, CacheTTL } from "@/lib/cache";

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
export async function GET() {
  try {
    const stats = await getOrSetCache<PublicStats>(
      "public:stats",
      CacheTTL.LONG, // 30 minutes - les stats changent lentement
      async () => {
        // Compter les matchs analyses
        const totalMatches = await prisma.match.count({
          where: {
            participants: {
              some: {},
            },
          },
        });

        // Compter les joueurs decouverts
        const totalPlayers = await prisma.discoveredPlayer.count();

        // Compter les champions
        const totalChampions = await prisma.champion.count();

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
    console.error("[STATS] Erreur:", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la recuperation des statistiques" },
      { status: 500 }
    );
  }
}
