import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getPaginationParams, getSkip, createPaginatedResponse } from "@/lib/pagination";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { prismaWithTimeout } from "@/lib/timeout";
import { getOrSetCache, CacheTTL } from "@/lib/cache";
import { applySecurityHeaders } from "@/lib/security-headers";
import { logger } from "@/lib/logger";
import { measureTiming } from "@/lib/metrics";

// Route GET pour obtenir la liste des items avec pagination
export async function GET(request: NextRequest) {
  // Rate limiting modéré pour les API publiques
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const { page, limit } = getPaginationParams(request);
    const skip = getSkip(page, limit);

    // Utiliser le cache pour les données statiques (15 minutes)
    const cacheKey = `items:list:${page}:${limit}`;
    
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
                prismaWithTimeout(() => prisma.item.count(), 10000)
              ),
              measureTiming("db.item.findMany", () =>
                prismaWithTimeout(
                  () =>
                    prisma.item.findMany({
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
      { page: page.toString(), limit: limit.toString() }
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
