import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { REGION_TO_BASE_URL } from "@/constants/regions";
import { createLogger } from "@/lib/logger";

const logger = createLogger("leaderboard-enrich");

const schema = z.object({
  region: z.string().default("euw1"),
  tier: z.string().default("CHALLENGER"),
  limit: z.number().int().positive().max(200).default(60),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { region, tier, limit } = schema.parse(body);
    const regionLower = region.toLowerCase();
    const tierUpper = tier.toUpperCase();

    const RIOT_API_KEY = process.env.RIOT_API_KEY;
    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: "Clé API Riot Games non configurée" },
        { status: 500 }
      );
    }

    const base = REGION_TO_BASE_URL[regionLower];
    if (!base) {
      return NextResponse.json({ error: "Région invalide" }, { status: 400 });
    }

    const candidates = await prisma.leaderboardEntry.findMany({
      where: {
        region: regionLower,
        tier: tierUpper,
        queueType: "RANKED_SOLO_5x5",
        summonerName: "",
        NOT: { summonerId: { startsWith: "anon:" } },
      },
      take: limit,
    });

    let enriched = 0;
    for (const c of candidates) {
      try {
        await new Promise((r) => setTimeout(r, 200));
        const res = await fetch(
          `${base}/lol/summoner/v4/summoners/${c.summonerId}`,
          {
            headers: { "X-Riot-Token": RIOT_API_KEY },
          }
        );
        if (res.status === 429) {
          const retryAfter = parseInt(
            res.headers.get("Retry-After") || "1",
            10
          );
          await new Promise((r) =>
            setTimeout(r, (isNaN(retryAfter) ? 1 : retryAfter) * 1000)
          );
          continue;
        }
        if (!res.ok) continue;
        const js = await res.json();
        const name = typeof js?.name === "string" ? js.name : "";
        if (!name) continue;
        await prisma.leaderboardEntry.update({
          where: {
            region_queueType_tier_summonerId: {
              region: regionLower,
              queueType: "RANKED_SOLO_5x5",
              tier: tierUpper,
              summonerId: c.summonerId,
            },
          },
          data: { summonerName: name },
        });
        enriched++;
      } catch {}
    }

    return NextResponse.json(
      { success: true, enriched, scanned: candidates.length },
      { status: 200 }
    );
  } catch (e) {
    logger.error("Error", e as Error);
    return NextResponse.json(
      { success: false, error: "Erreur interne" },
      { status: 500 }
    );
  }
}
