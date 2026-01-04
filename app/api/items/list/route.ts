import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaginationParams, getSkip, createPaginatedResponse } from "@/lib/pagination";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { prismaWithTimeout } from "@/lib/timeout";
import { getOrSetCache, CacheTTL } from "@/lib/cache";
import { applySecurityHeaders } from "@/lib/security-headers";
import { logger } from "@/lib/logger";
import { measureTiming } from "@/lib/metrics";

// Route GET pour obtenir la liste des items avec pagination et filtrage
export async function GET(request: NextRequest) {
  // Rate limiting modéré pour les API publiques
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { page, limit } = getPaginationParams(request);
    const skip = getSkip(page, limit);

    // Paramètres de filtrage
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get("tag"); // Filtrer par tag (Boots, Jungle, etc.)
    const completedOnly = searchParams.get("completed") === "true"; // Items finaux seulement
    const starterOnly = searchParams.get("starter") === "true"; // Items de départ (depth 1)

    // Construire le filtre where
    const where: Record<string, unknown> = {};

    if (tag) {
      // Filtrer les items qui contiennent ce tag dans leur JSON array
      where.tags = { contains: `"${tag}"` };
    }

    if (completedOnly) {
      // Items avec depth >= 2 (items complets, pas les composants de base)
      where.depth = { gte: 2 };
    }

    if (starterOnly) {
      // Items de départ (peu chers, depth 1)
      where.depth = 1;
    }

    // Utiliser le cache pour les données statiques (15 minutes)
    const cacheKey = `items:list:${page}:${limit}:${tag || "all"}:${completedOnly}:${starterOnly}`;

    const paginatedResponse = await measureTiming(
      "api.items.list",
      () =>
        getOrSetCache(
          cacheKey,
          CacheTTL.LONG, // 15 minutes
          async () => {
            // Compter le total et récupérer les données avec timeout
            const [total, items] = await Promise.all([
              measureTiming("db.item.count", () =>
                prismaWithTimeout(() => prisma.item.count({ where }), 10000)
              ),
              measureTiming("db.item.findMany", () =>
                prismaWithTimeout(
                  () =>
                    prisma.item.findMany({
                      where,
                      skip,
                      take: limit,
                      orderBy: { name: "asc" },
                    }),
                  10000
                )
              ),
            ]);

            return createPaginatedResponse(items, total, page, limit);
          }
        ),
      { page: page.toString(), limit: limit.toString(), tag: tag || "all" }
    );

    const response = NextResponse.json(
      {
        success: true,
        ...paginatedResponse,
      },
      { status: 200 }
    );

    return applySecurityHeaders(response);
  } catch (error) {
    logger.error("Erreur lors de la récupération des items", error as Error);
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des items",
      },
      { status: 500 }
    );
    return applySecurityHeaders(errorResponse);
  }
}
