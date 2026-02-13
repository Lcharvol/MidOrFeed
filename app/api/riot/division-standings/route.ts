import { NextRequest, NextResponse } from "next/server";
import { REGION_TO_BASE_URL } from "@/constants/regions";
import { getEnv } from "@/lib/env";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { riotApiRequest } from "@/lib/riot-api";
import { CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";
import { toError } from "@/lib/errors";

interface RiotLeagueEntry {
  summonerId: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran: boolean;
  inactive: boolean;
  freshBlood: boolean;
  hotStreak: boolean;
}

interface DivisionStandingsResponse {
  success: boolean;
  data: {
    tier: string;
    division: string;
    queue: string;
    totalPlayers: number;
    playerRank: number | null;
    topPlayers: Array<{
      leaguePoints: number;
      wins: number;
      losses: number;
    }>;
  };
}

/**
 * GET /api/riot/division-standings
 * Returns standing position in a specific division (e.g. Gold II)
 * Query params: region, tier, division, queue, puuid (to find player rank)
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
    const tier = (searchParams.get("tier") || "").toUpperCase();
    const division = (searchParams.get("division") || "").toUpperCase();
    const queue = searchParams.get("queue") || "RANKED_SOLO_5x5";
    const playerLp = parseInt(searchParams.get("lp") || "0", 10);

    // Master+ tiers don't have divisions and use a different endpoint
    const highTiers = ["MASTER", "GRANDMASTER", "CHALLENGER"];
    if (highTiers.includes(tier)) {
      return NextResponse.json(
        { success: true, data: { tier, division: "I", queue, totalPlayers: 0, playerRank: null, topPlayers: [] } },
        { status: 200 }
      );
    }

    const validTiers = ["IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD", "DIAMOND"];
    const validDivisions = ["I", "II", "III", "IV"];

    if (!validTiers.includes(tier) || !validDivisions.includes(division)) {
      return NextResponse.json({ success: false, error: "Tier ou division invalide" }, { status: 400 });
    }

    const baseUrl = REGION_TO_BASE_URL[region];
    if (!baseUrl) {
      return NextResponse.json({ success: false, error: "Région invalide" }, { status: 400 });
    }

    // Fetch first page of division entries (200 max per page)
    const response = await riotApiRequest<RiotLeagueEntry[]>(
      `${baseUrl}/lol/league/v4/entries/${queue}/${tier}/${division}?page=1`,
      {
        region,
        cacheKey: `riot:division:${region}:${queue}:${tier}:${division}`,
        cacheTTL: CacheTTL.LONG,
      }
    );

    const entries = response.data;

    // Sort by LP descending
    const sorted = [...entries].sort((a, b) => b.leaguePoints - a.leaguePoints);

    // Estimate player rank by LP position
    let playerRank: number | null = null;
    if (playerLp > 0) {
      const index = sorted.findIndex((e) => e.leaguePoints <= playerLp);
      playerRank = index === -1 ? sorted.length + 1 : index + 1;
    }

    const topPlayers = sorted.slice(0, 10).map((e) => ({
      leaguePoints: e.leaguePoints,
      wins: e.wins,
      losses: e.losses,
    }));

    const result: DivisionStandingsResponse = {
      success: true,
      data: {
        tier,
        division,
        queue,
        totalPlayers: entries.length,
        playerRank,
        topPlayers,
      },
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    const logger = createLogger("division-standings");
    logger.error("Erreur division standings", toError(error));
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération du classement de la division",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : "Erreur inconnue") : undefined,
      },
      { status: 500 }
    );
  }
}
