import { Job } from "pg-boss";
import { registerWorker, QUEUE_NAMES, updateJobProgress } from "../job-queue";
import { prisma } from "../prisma";
import { riotApiRequest } from "../riot-api";
import { sendAlert, AlertSeverity } from "../alerting";
import { createLogger } from "../logger";
import { MAIN_REGIONS } from "../../constants/riot-regions";
import type {
  LeaderboardSyncJobData,
  LeaderboardSyncJobResult,
} from "../queues/types";

const logger = createLogger("leaderboard-sync-worker");

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

/**
 * Leaderboard Sync Worker
 * Synchronizes leaderboard data from Riot API for each region
 */
export async function createLeaderboardSyncWorker() {
  return registerWorker<LeaderboardSyncJobData, LeaderboardSyncJobResult>(
    QUEUE_NAMES.LEADERBOARD_SYNC,
    async (job: Job<LeaderboardSyncJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let entriesSynced = 0;
      let regionsProcessed = 0;

      try {
        logger.info(`Starting job ${job.id}`);

        const {
          regions = MAIN_REGIONS,
          queueTypes = ["RANKED_SOLO_5x5"],
          tiers = ["challenger", "grandmaster", "master"],
        } = job.data;

        const totalSteps = regions.length * queueTypes.length * tiers.length;
        let step = 0;

        for (const region of regions) {
          for (const queueType of queueTypes) {
            for (const tier of tiers) {
              await updateJobProgress(job.id, {
                current: step++,
                total: totalSteps,
                message: `Syncing ${tier} ${queueType} for ${region}`,
              });

              try {
                // Build API URL
                const endpoint = TIER_ENDPOINT[tier];
                if (!endpoint) {
                  errors.push(`Unknown tier: ${tier}`);
                  continue;
                }
                const url = `https://${region}.api.riotgames.com/lol/league/v4/${endpoint}/by-queue/${queueType}`;

                logger.info(`Fetching ${url}`);
                const { data } = await riotApiRequest<LeagueListResponse>(url, {
                  useCache: false,
                });

                if (!data.entries || data.entries.length === 0) {
                  logger.info(`No entries for ${tier} ${queueType} ${region}`);
                  continue;
                }

                // Normalize tier to uppercase for consistent storage
                const tierUpper = tier.toUpperCase();

                // Deduplicate by summonerId or puuid
                const seen = new Set<string>();
                const unique = data.entries
                  .filter((entry) => {
                    const id = entry.summonerId?.trim() || entry.puuid?.trim();
                    if (!id || seen.has(id)) return false;
                    seen.add(id);
                    return true;
                  })
                  .map((entry) => ({
                    region,
                    queueType,
                    tier: tierUpper,
                    rank: entry.rank || null,
                    summonerId: (entry.summonerId?.trim() || entry.puuid || "unknown").trim(),
                    summonerName: entry.summonerName || "",
                    leaguePoints: entry.leaguePoints,
                    wins: entry.wins,
                    losses: entry.losses,
                    puuid: entry.puuid?.trim() || null,
                  }));

                // Safety: don't delete existing data if new batch is empty
                if (unique.length === 0) {
                  logger.warn(`Filter removed all ${data.entries.length} entries for ${tierUpper} ${queueType} ${region}, skipping delete+insert`, {
                    sampleEntry: JSON.stringify(data.entries[0]),
                  });
                  continue;
                }

                // Preserve existing enrichment data (gameName, tagLine, profileIconId)
                // before replacing entries
                const existingEntries = await prisma.leaderboardEntry.findMany({
                  where: { region, queueType, tier: tierUpper },
                  select: { summonerId: true, gameName: true, tagLine: true, profileIconId: true },
                });
                const enrichMap = new Map(
                  existingEntries
                    .filter((e) => e.gameName || e.profileIconId)
                    .map((e) => [e.summonerId, { gameName: e.gameName, tagLine: e.tagLine, profileIconId: e.profileIconId }])
                );

                // Merge enrichment data into new entries
                const enrichedUnique = unique.map((entry) => {
                  const existing = enrichMap.get(entry.summonerId);
                  if (existing) {
                    return {
                      ...entry,
                      gameName: existing.gameName,
                      tagLine: existing.tagLine,
                      profileIconId: existing.profileIconId,
                    };
                  }
                  return entry;
                });

                // Delete existing entries for this region/tier/queueType then bulk insert
                await prisma.leaderboardEntry.deleteMany({
                  where: { region, queueType, tier: tierUpper },
                });

                const result = await prisma.leaderboardEntry.createMany({
                  data: enrichedUnique,
                });
                entriesSynced += result.count;

                logger.info(
                  `Synced ${result.count} entries for ${tierUpper} ${queueType} ${region}`
                );
              } catch (err) {
                const errorMsg = `Failed to sync ${tier} ${queueType} for ${region}: ${
                  err instanceof Error ? err.message : "Unknown error"
                }`;
                errors.push(errorMsg);
                logger.error(errorMsg);
              }
            }
          }
          regionsProcessed++;
        }

        const duration = Date.now() - startTime;
        logger.info(
          `Completed: ${entriesSynced} entries from ${regionsProcessed} regions in ${duration}ms`
        );

        if (errors.length > 0) {
          sendAlert(
            AlertSeverity.MEDIUM,
            "Leaderboard Sync Completed with Errors",
            `Synced ${entriesSynced} entries with ${errors.length} errors`,
            "leaderboard-sync-worker",
            { errors: errors.slice(0, 5) }
          );
        }

        return { entriesSynced, regionsProcessed, duration, errors };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        logger.error(`Job failed: ${errorMsg}`);

        sendAlert(
          AlertSeverity.HIGH,
          "Leaderboard Sync Job Failed",
          errorMsg,
          "leaderboard-sync-worker",
          { jobId: job.id }
        );

        throw err;
      }
    }
  );
}
