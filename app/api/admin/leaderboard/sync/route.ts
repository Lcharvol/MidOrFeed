import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { riotApiRequest } from "@/lib/riot-api";
import { MAIN_REGIONS } from "@/constants/riot-regions";
import { createLogger } from "@/lib/logger";

const logger = createLogger("admin-leaderboard-sync");

type LeagueEntry = {
  summonerId?: string;
  puuid?: string;
  summonerName?: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  rank?: string;
};

type LeagueListResponse = {
  entries: LeagueEntry[];
};

const TIER_ENDPOINT: Record<string, string> = {
  challenger: "challengerleagues",
  grandmaster: "grandmasterleagues",
  master: "masterleagues",
};

const DEFAULT_TIERS = ["challenger", "grandmaster", "master"];

/**
 * POST /api/admin/leaderboard/sync
 * Directly sync leaderboard data from Riot API (bypasses pg-boss).
 * Body: { regions?: string[], tiers?: string[] }
 */
export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.admin);
  if (rateLimitResponse) return rateLimitResponse;

  const authError = await requireAdmin(request, { skipCsrf: true });
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({}));
    const {
      regions = MAIN_REGIONS as unknown as string[],
      tiers = DEFAULT_TIERS,
    } = body as { regions?: string[]; tiers?: string[] };

    const errors: string[] = [];
    let entriesSynced = 0;
    let regionsProcessed = 0;

    for (const region of regions) {
      for (const tier of tiers) {
        const endpoint = TIER_ENDPOINT[tier];
        if (!endpoint) {
          errors.push(`Unknown tier: ${tier}`);
          continue;
        }

        try {
          const url = `https://${region}.api.riotgames.com/lol/league/v4/${endpoint}/by-queue/RANKED_SOLO_5x5`;
          logger.info(`Fetching ${tier} for ${region}`);

          const { data } = await riotApiRequest<LeagueListResponse>(url, {
            useCache: false,
          });

          if (!data.entries || data.entries.length === 0) {
            logger.info(`No entries for ${tier} ${region}`);
            continue;
          }

          const tierUpper = tier.toUpperCase();

          // Deduplicate by summonerId or puuid
          const seen = new Set<string>();
          const unique = data.entries
            .filter((entry) => {
              // Use summonerId if available, fallback to puuid
              const id = entry.summonerId?.trim() || entry.puuid?.trim();
              if (!id || seen.has(id)) return false;
              seen.add(id);
              return true;
            })
            .map((entry) => ({
              region,
              queueType: "RANKED_SOLO_5x5",
              tier: tierUpper,
              rank: entry.rank || null,
              summonerId: (entry.summonerId?.trim() || entry.puuid || "unknown").trim(),
              summonerName: entry.summonerName || "",
              leaguePoints: entry.leaguePoints,
              wins: entry.wins,
              losses: entry.losses,
            }));

          // Safety: don't delete existing data if new batch is empty
          if (unique.length === 0) {
            logger.warn(`Filter removed all ${data.entries.length} entries for ${tierUpper} ${region}, skipping delete+insert`, {
              sampleEntry: JSON.stringify(data.entries[0]),
            });
            continue;
          }

          // Full snapshot replacement for this region/tier
          await prisma.leaderboardEntry.deleteMany({
            where: { region, queueType: "RANKED_SOLO_5x5", tier: tierUpper },
          });

          const result = await prisma.leaderboardEntry.createMany({
            data: unique,
          });
          entriesSynced += result.count;
          logger.info(`Synced ${result.count} entries for ${tierUpper} ${region}`);
        } catch (err) {
          const msg = `Failed ${tier} ${region}: ${err instanceof Error ? err.message : "Unknown error"}`;
          errors.push(msg);
          logger.error(msg);
        }
      }
      regionsProcessed++;
    }

    return NextResponse.json({
      success: true,
      entriesSynced,
      regionsProcessed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    logger.error("Leaderboard sync failed", error as Error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
