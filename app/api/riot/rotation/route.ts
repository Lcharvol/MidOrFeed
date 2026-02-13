import { NextRequest, NextResponse } from "next/server";
import { REGION_TO_BASE_URL } from "@/constants/regions";
import { getEnv } from "@/lib/env";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { riotApiRequest } from "@/lib/riot-api";
import { CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";
import { toError } from "@/lib/errors";

interface ChampionRotationDto {
  freeChampionIds: number[];
  freeChampionIdsForNewPlayers: number[];
  maxNewPlayerLevel: number;
}

/**
 * GET /api/riot/rotation - Get free champion rotation
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const env = getEnv();
    if (!env.RIOT_API_KEY) {
      throw new Error("RIOT_API_KEY est requis");
    }

    const searchParams = request.nextUrl.searchParams;
    const region = (searchParams.get("region") || "euw1").toLowerCase();

    const baseUrl = REGION_TO_BASE_URL[region];
    if (!baseUrl) {
      return NextResponse.json({ success: false, error: "Région invalide" }, { status: 400 });
    }

    const response = await riotApiRequest<ChampionRotationDto>(
      `${baseUrl}/lol/platform/v3/champion-rotations`,
      {
        region,
        cacheKey: `riot:rotation:${region}`,
        cacheTTL: CacheTTL.LONG, // rotation changes weekly
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          freeChampionIds: response.data.freeChampionIds,
          freeChampionIdsForNewPlayers: response.data.freeChampionIdsForNewPlayers,
          maxNewPlayerLevel: response.data.maxNewPlayerLevel,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=7200" },
      }
    );
  } catch (error) {
    const logger = createLogger("riot-rotation");
    logger.error("Erreur lors de la récupération de la rotation", toError(error));
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération de la rotation",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : "Erreur inconnue") : undefined,
      },
      { status: 500 }
    );
  }
}
