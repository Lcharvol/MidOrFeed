import { Job } from "pg-boss";
import { registerWorker, QUEUE_NAMES } from "../job-queue";
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
  summonerId: string;
  summonerName: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  rank?: string;
};

type LeagueListResponse = {
  entries: LeagueEntry[];
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

        for (const region of regions) {
          for (const queueType of queueTypes) {
            for (const tier of tiers) {
              try {
                // Build API URL
                const url = `https://${region}.api.riotgames.com/lol/league/v4/${tier}leagues/by-queue/${queueType}`;

                const { data } = await riotApiRequest<LeagueListResponse>(url, {
                  useCache: false,
                });

                if (!data.entries || data.entries.length === 0) {
                  continue;
                }

                // Upsert entries in batch
                for (const entry of data.entries) {
                  await prisma.leaderboardEntry.upsert({
                    where: {
                      region_queueType_tier_summonerId: {
                        region,
                        queueType,
                        tier,
                        summonerId: entry.summonerId,
                      },
                    },
                    create: {
                      region,
                      queueType,
                      tier,
                      rank: entry.rank || null,
                      summonerId: entry.summonerId,
                      summonerName: entry.summonerName,
                      leaguePoints: entry.leaguePoints,
                      wins: entry.wins,
                      losses: entry.losses,
                    },
                    update: {
                      rank: entry.rank || null,
                      summonerName: entry.summonerName,
                      leaguePoints: entry.leaguePoints,
                      wins: entry.wins,
                      losses: entry.losses,
                      updatedAt: new Date(),
                    },
                  });
                  entriesSynced++;
                }

                logger.info(
                  `Synced ${data.entries.length} entries for ${tier} ${queueType} ${region}`
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
