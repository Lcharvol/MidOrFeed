import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger("item-stats");

const SUMMONERS_RIFT_MAP_ID = 11;

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const stats = await prisma.itemStats.findMany({
      orderBy: [{ score: "desc" }, { totalGames: "desc" }],
    });

    const totalUniqueMatches = await prisma.match.count({
      where: {
        mapId: SUMMONERS_RIFT_MAP_ID,
        participants: { some: {} },
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: stats,
        count: stats.length,
        totalUniqueMatches,
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    logger.error("Erreur lors de la récupération des stats items", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des statistiques items",
      },
      { status: 500 }
    );
  }
}
