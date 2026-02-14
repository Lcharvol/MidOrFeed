import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { getOrSetCache, CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";
import { toError } from "@/lib/errors";

const logger = createLogger("leaderboard");

const VALID_TIERS = [
  "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD",
  "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"
] as const;

export async function GET(req: NextRequest) {
  const rateLimitResponse = await rateLimit(req, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { searchParams } = new URL(req.url);
    const region = (searchParams.get("region") || "euw1").toLowerCase();
    const tierParam = searchParams.get("tier") || "CHALLENGER";
    const tierUpper = tierParam.toUpperCase();
    const tierLower = tierParam.toLowerCase();
    const take = Math.min(parseInt(searchParams.get("take") || "200", 10), 500);

    // Validate tier parameter
    if (!VALID_TIERS.includes(tierUpper as typeof VALID_TIERS[number])) {
      return NextResponse.json(
        { success: false, error: "Invalid tier parameter" },
        { status: 400 }
      );
    }

    // Cache par région et tier - 5 minutes
    const cacheKey = `leaderboard:${region}:${tierLower}:${take}`;

    const entries = await getOrSetCache(
      cacheKey,
      CacheTTL.MEDIUM, // 5 minutes - le leaderboard change régulièrement
      async () => {
        const raw = await prisma.leaderboardEntry.findMany({
          where: {
            region,
            queueType: "RANKED_SOLO_5x5",
            tier: { in: [tierUpper, tierLower] },
          },
          orderBy: { leaguePoints: "desc" },
          take,
        });

        return raw.map((entry) => ({
          ...entry,
          summonerName:
            entry.gameName && entry.tagLine
              ? `${entry.gameName}#${entry.tagLine}`
              : entry.gameName || entry.summonerName,
          profileIconId: entry.profileIconId ?? null,
        }));
      }
    );

    return NextResponse.json({ success: true, data: entries }, {
      status: 200,
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch (e) {
    logger.error("Leaderboard list error", toError(e));
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
