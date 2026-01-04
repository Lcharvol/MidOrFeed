import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrSetCache, CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";

const logger = createLogger("leaderboard");

const VALID_TIERS = [
  "IRON", "BRONZE", "SILVER", "GOLD", "PLATINUM", "EMERALD",
  "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"
] as const;

export async function GET(req: Request) {
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
        return prisma.leaderboardEntry.findMany({
          where: {
            region,
            queueType: "RANKED_SOLO_5x5",
            tier: { in: [tierUpper, tierLower] },
          },
          orderBy: { leaguePoints: "desc" },
          take,
        });
      }
    );

    return NextResponse.json({ success: true, data: entries }, { status: 200 });
  } catch (e) {
    logger.error("Leaderboard list error", e as Error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
