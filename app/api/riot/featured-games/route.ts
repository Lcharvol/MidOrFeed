import { NextRequest, NextResponse } from "next/server";
import { REGION_TO_BASE_URL } from "@/constants/regions";
import { getEnv } from "@/lib/env";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { riotApiRequest } from "@/lib/riot-api";
import { CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";

interface FeaturedGameParticipant {
  puuid: string;
  teamId: number;
  spell1Id: number;
  spell2Id: number;
  championId: number;
  profileIconId: number;
  bot: boolean;
}

interface FeaturedGame {
  gameId: number;
  mapId: number;
  gameMode: string;
  gameType: string;
  gameQueueConfigId: number;
  participants: FeaturedGameParticipant[];
  observers: { encryptionKey: string };
  platformId: string;
  bannedChampions: Array<{ championId: number; teamId: number; pickTurn: number }>;
  gameStartTime: number;
  gameLength: number;
}

interface FeaturedGamesDto {
  gameList: FeaturedGame[];
  clientRefreshInterval: number;
}

interface TransformedGame {
  gameId: number;
  gameMode: string;
  gameLength: number;
  gameStartTime: number;
  queueId: number;
  blueTeam: Array<{ championId: number }>;
  redTeam: Array<{ championId: number }>;
  bannedChampions: Array<{ championId: number; teamId: number }>;
}

/**
 * GET /api/riot/featured-games - Get featured live games
 */
export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

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

    const response = await riotApiRequest<FeaturedGamesDto>(
      `${baseUrl}/lol/spectator/v5/featured-games`,
      {
        region,
        cacheKey: `riot:featured-games:${region}`,
        cacheTTL: CacheTTL.SHORT, // refresh frequently
      }
    );

    const games: TransformedGame[] = response.data.gameList
      .filter((g) => g.gameQueueConfigId === 420 || g.gameQueueConfigId === 440) // ranked only
      .slice(0, 5)
      .map((g) => ({
        gameId: g.gameId,
        gameMode: g.gameMode,
        gameLength: g.gameLength,
        gameStartTime: g.gameStartTime,
        queueId: g.gameQueueConfigId,
        blueTeam: g.participants
          .filter((p) => p.teamId === 100)
          .map((p) => ({ championId: p.championId })),
        redTeam: g.participants
          .filter((p) => p.teamId === 200)
          .map((p) => ({ championId: p.championId })),
        bannedChampions: g.bannedChampions
          .filter((b) => b.championId > 0)
          .map((b) => ({ championId: b.championId, teamId: b.teamId })),
      }));

    return NextResponse.json(
      {
        success: true,
        data: {
          games,
          refreshInterval: response.data.clientRefreshInterval,
        },
      },
      {
        status: 200,
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" },
      }
    );
  } catch (error) {
    const logger = createLogger("riot-featured-games");
    logger.error("Erreur featured games", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des parties en vedette",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : "Erreur inconnue") : undefined,
      },
      { status: 500 }
    );
  }
}
