import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { REGION_TO_BASE_URL } from "@/constants/regions";
import { createLogger } from "@/lib/logger";

const logger = createLogger("leaderboard-update");

const schema = z.object({
  region: z.string().min(1), // platform id like euw1
  tier: z.enum(["challenger", "grandmaster", "master"]).default("challenger"),
});

const TIER_ENDPOINT: Record<string, string> = {
  challenger: "challengerleagues",
  grandmaster: "grandmasterleagues",
  master: "masterleagues",
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { region, tier } = schema.parse(body);
    const base = REGION_TO_BASE_URL[region.toLowerCase()];
    if (!base)
      return NextResponse.json({ error: "Région invalide" }, { status: 400 });

    const endpoint = `${base}/lol/league/v4/${TIER_ENDPOINT[tier]}/by-queue/RANKED_SOLO_5x5`;
    const RIOT_API_KEY = process.env.RIOT_API_KEY;
    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: "Clé API Riot Games non configurée" },
        { status: 500 }
      );
    }

    const res = await fetch(endpoint, {
      headers: { "X-Riot-Token": RIOT_API_KEY },
      cache: "no-store",
    });
    if (!res.ok) {
      const err = await res.text().catch(() => "");
      return NextResponse.json(
        { error: `Erreur Riot ${res.status}`, details: err },
        { status: res.status }
      );
    }
    const json = await res.json();
    interface RiotLeagueEntry {
      summonerId?: string;
      summonerName?: string;
      leaguePoints?: number;
      wins?: number;
      losses?: number;
      rank?: string;
    }
    const rawEntries: RiotLeagueEntry[] = Array.isArray(json?.entries)
      ? (json.entries as RiotLeagueEntry[])
      : [];
    const entries = rawEntries.map((e: RiotLeagueEntry, _i: number) => ({
      summonerId: String(e?.summonerId ?? "").trim(),
      summonerName: typeof e?.summonerName === "string" ? e.summonerName : "",
      leaguePoints: Number(e?.leaguePoints) || 0,
      wins: Number(e?.wins) || 0,
      losses: Number(e?.losses) || 0,
      rank: typeof e?.rank === "string" ? e.rank : undefined,
    }));

    // Remplacement full-snapshot de la tranche (region, tier)
    const regionLower = region.toLowerCase();
    const tierUpper = tier.toUpperCase();
    const normalized = entries.map(
      (
        e: {
          summonerId: string;
          summonerName: string;
          leaguePoints: number;
          wins: number;
          losses: number;
          rank?: string;
        },
        _i: number
      ) => ({
        region: regionLower,
        queueType: "RANKED_SOLO_5x5" as const,
        tier: tierUpper,
        rank: e.rank ?? null,
        summonerId:
          e.summonerId && e.summonerId.length > 0
            ? e.summonerId
            : `anon:${e.summonerName || "unknown"}:${e.rank || ""}:$${
                e.leaguePoints
              }:${e.wins}:${e.losses}:${_i}`,
        summonerName: e.summonerName ?? "",
        leaguePoints: e.leaguePoints,
        wins: e.wins,
        losses: e.losses,
      })
    );
    const db = prisma as unknown as {
      leaderboardEntry: {
        deleteMany: (args: unknown) => Promise<{ count: number }>;
        createMany: (args: unknown) => Promise<{ count: number }>;
        findMany: (args: unknown) => Promise<Array<{ summonerId: string }>>;
        update: (args: unknown) => Promise<unknown>;
      };
    };
    await db.leaderboardEntry.deleteMany({
      where: {
        region: regionLower,
        tier: tierUpper,
        queueType: "RANKED_SOLO_5x5",
      },
    });
    // Dédoublonnage avant insertion pour éviter P2002
    const seen = new Set<string>();
    const unique = normalized.filter((e) => {
      const key = `${e.region}|${e.queueType}|${e.tier}|${e.summonerId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    const createRes = await db.leaderboardEntry.createMany({
      data: unique,
    });
    const upserts = createRes.count;

    // Enrichir les noms d'invocateur manquants (quota léger pour éviter 429)
    let enriched = 0;
    const maxEnrich = 60;
    const candidates = await db.leaderboardEntry.findMany({
      where: {
        region: regionLower,
        tier: tierUpper,
        queueType: "RANKED_SOLO_5x5",
        summonerName: "",
        NOT: {
          summonerId: { startsWith: "anon:" },
        },
      },
      take: maxEnrich,
    });

    for (const c of candidates) {
      try {
        // Small spacing to be nice with API
        await new Promise((r) => setTimeout(r, 200));
        const summonerRes = await fetch(
          `${REGION_TO_BASE_URL[regionLower]}/lol/summoner/v4/summoners/${c.summonerId}`,
          { headers: { "X-Riot-Token": RIOT_API_KEY } }
        );
        if (summonerRes.status === 429) {
          // basic backoff, one retry
          const retryAfter = parseInt(
            summonerRes.headers.get("Retry-After") || "1",
            10
          );
          await new Promise((r) =>
            setTimeout(r, (isNaN(retryAfter) ? 1 : retryAfter) * 1000)
          );
          continue;
        }
        if (!summonerRes.ok) continue;
        const summonerJson = await summonerRes.json();
        const name =
          typeof summonerJson?.name === "string" ? summonerJson.name : "";
        if (!name) continue;
        await db.leaderboardEntry.update({
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
      } catch {
        // ignore single failures
      }
    }

    return NextResponse.json(
      {
        success: true,
        count: upserts,
        rawCount: rawEntries.length,
        parsedCount: entries.length,
        sample:
          entries.length > 0
            ? {
                summonerId: entries[0].summonerId,
                summonerName: entries[0].summonerName,
                leaguePoints: entries[0].leaguePoints,
                wins: entries[0].wins,
                losses: entries[0].losses,
                rank: entries[0].rank ?? null,
              }
            : null,
        enriched,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("Error", error as Error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
