import { NextRequest, NextResponse } from "next/server";
import { REGION_TO_BASE_URL } from "@/constants/regions";
import { getEnv } from "@/lib/env";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { measureTiming } from "@/lib/metrics";
import { riotApiRequest } from "@/lib/riot-api";
import { CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";

type Params = {
  puuid: string;
};

interface RiotChampionMastery {
  puuid: string;
  championId: number;
  championLevel: number;
  championPoints: number;
  lastPlayTime: number;
  championPointsSinceLastLevel: number;
  championPointsUntilNextLevel: number;
  markRequiredForNextLevel: number;
  tokensEarned: number;
  chestGranted: boolean;
}

interface MasteryResponse {
  success: boolean;
  data: {
    totalScore: number;
    topMasteries: Array<{
      championId: number;
      level: number;
      points: number;
      lastPlayed: string;
      chestGranted: boolean;
      tokensEarned: number;
    }>;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let puuid = "";
  try {
    const env = getEnv();
    if (!env.RIOT_API_KEY) {
      throw new Error("RIOT_API_KEY est requis");
    }

    const resolvedParams = await params;
    puuid = resolvedParams.puuid || "";

    if (!puuid) {
      return NextResponse.json({ error: "PUUID requis" }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get("region");
    const count = Math.min(parseInt(searchParams.get("count") || "10", 10), 20);

    if (!region) {
      return NextResponse.json({ error: "Region requise" }, { status: 400 });
    }

    const normalizedRegion = region.toLowerCase();
    const baseUrl = REGION_TO_BASE_URL[normalizedRegion];

    if (!baseUrl) {
      return NextResponse.json({ error: "Region invalide" }, { status: 400 });
    }

    // Fetch top champion masteries
    const masteryResponse = await measureTiming(
      "api.riot.mastery.top",
      () =>
        riotApiRequest<RiotChampionMastery[]>(
          `${baseUrl}/lol/champion-mastery/v4/champion-masteries/by-puuid/${puuid}/top?count=${count}`,
          {
            region: normalizedRegion,
            cacheKey: `riot:mastery:top:${puuid}:${normalizedRegion}:${count}`,
            cacheTTL: CacheTTL.MEDIUM,
          }
        ).catch((error) => {
          if (error.message.includes("404")) {
            return { data: [] as RiotChampionMastery[], cached: false, attempt: 1 };
          }
          throw error;
        }),
      { region: normalizedRegion }
    );

    // Fetch total mastery score
    const scoreResponse = await measureTiming(
      "api.riot.mastery.score",
      () =>
        riotApiRequest<number>(
          `${baseUrl}/lol/champion-mastery/v4/scores/by-puuid/${puuid}`,
          {
            region: normalizedRegion,
            cacheKey: `riot:mastery:score:${puuid}:${normalizedRegion}`,
            cacheTTL: CacheTTL.MEDIUM,
          }
        ).catch(() => {
          return { data: 0, cached: false, attempt: 1 };
        }),
      { region: normalizedRegion }
    );

    const topMasteries = masteryResponse.data.map((m) => ({
      championId: m.championId,
      level: m.championLevel,
      points: m.championPoints,
      lastPlayed: new Date(m.lastPlayTime).toISOString(),
      chestGranted: m.chestGranted,
      tokensEarned: m.tokensEarned,
    }));

    const response: MasteryResponse = {
      success: true,
      data: {
        totalScore: scoreResponse.data,
        topMasteries,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const masteryLogger = createLogger("mastery");
    masteryLogger.error("Erreur lors de la recuperation des maitrises", error as Error, {
      puuid,
    });
    return NextResponse.json(
      {
        error: "Erreur lors de la recuperation des maitrises",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
