import { Job } from "pg-boss";
import { registerWorker, QUEUE_NAMES } from "../job-queue";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import { createLogger } from "../logger";
import type {
  DataCleanupJobData,
  DataCleanupJobResult,
} from "../queues/types";

const logger = createLogger("data-cleanup-worker");

/**
 * Data Cleanup Worker
 * Cleans old/stale data to optimize database size
 */
export async function createDataCleanupWorker() {
  return registerWorker<DataCleanupJobData, DataCleanupJobResult>(
    QUEUE_NAMES.DATA_CLEANUP,
    async (job: Job<DataCleanupJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let matchesDeleted = 0;
      let accountsDeleted = 0;
      let spaceFreedMB = 0;

      try {
        logger.info(`Starting job ${job.id}`);

        const {
          matchesOlderThanDays = 180,
          inactiveAccountsDays = 90,
          dryRun = false,
        } = job.data;

        // Calculate cutoff dates
        const matchCutoff = new Date();
        matchCutoff.setDate(matchCutoff.getDate() - matchesOlderThanDays);
        const matchCutoffTimestamp = BigInt(matchCutoff.getTime());

        const accountCutoff = new Date();
        accountCutoff.setDate(accountCutoff.getDate() - inactiveAccountsDays);

        // Step 1: Clean old matches
        logger.info(`Cleaning matches older than ${matchesOlderThanDays} days`);

        try {
          // Count matches to delete
          const oldMatchesCount = await prisma.match.count({
            where: {
              gameCreation: { lt: matchCutoffTimestamp },
            },
          });

          logger.info(`Found ${oldMatchesCount} old matches`);

          if (!dryRun && oldMatchesCount > 0) {
            // Delete in batches to avoid timeout
            const batchSize = 1000;
            let deleted = 0;

            while (deleted < oldMatchesCount) {
              const matchesToDelete = await prisma.match.findMany({
                where: {
                  gameCreation: { lt: matchCutoffTimestamp },
                },
                take: batchSize,
                select: { id: true },
              });

              if (matchesToDelete.length === 0) break;

              await prisma.match.deleteMany({
                where: {
                  id: { in: matchesToDelete.map((m) => m.id) },
                },
              });

              deleted += matchesToDelete.length;
              matchesDeleted += matchesToDelete.length;

              logger.info(`Deleted ${deleted}/${oldMatchesCount} matches`);
            }
          } else if (dryRun) {
            logger.info(`DRY RUN: Would delete ${oldMatchesCount} matches`);
            matchesDeleted = oldMatchesCount;
          }
        } catch (err) {
          const errorMsg = `Failed to clean matches: ${
            err instanceof Error ? err.message : "Unknown error"
          }`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }

        // Step 2: Clean inactive discovered players
        logger.info(`Cleaning inactive accounts (${inactiveAccountsDays}+ days)`);

        try {
          // Count inactive accounts
          const inactiveCount = await prisma.discoveredPlayer.count({
            where: {
              OR: [
                { lastCrawledAt: { lt: accountCutoff } },
                { lastCrawledAt: null, createdAt: { lt: accountCutoff } },
              ],
              crawlStatus: { in: ["completed", "failed"] },
            },
          });

          logger.info(`Found ${inactiveCount} inactive discovered players`);

          if (!dryRun && inactiveCount > 0) {
            const result = await prisma.discoveredPlayer.deleteMany({
              where: {
                OR: [
                  { lastCrawledAt: { lt: accountCutoff } },
                  { lastCrawledAt: null, createdAt: { lt: accountCutoff } },
                ],
                crawlStatus: { in: ["completed", "failed"] },
              },
            });

            accountsDeleted = result.count;
          } else if (dryRun) {
            logger.info(`DRY RUN: Would delete ${inactiveCount} discovered players`);
            accountsDeleted = inactiveCount;
          }
        } catch (err) {
          const errorMsg = `Failed to clean inactive accounts: ${
            err instanceof Error ? err.message : "Unknown error"
          }`;
          errors.push(errorMsg);
          logger.error(errorMsg);
        }

        // Step 3: pg-boss handles job cleanup automatically
        logger.info("Job history cleanup handled by pg-boss");

        // Estimate space freed (rough calculation)
        spaceFreedMB = Math.round((matchesDeleted * 0.002 + accountsDeleted * 0.001) * 10) / 10;

        const duration = Date.now() - startTime;
        logger.info(
          `Completed: ${matchesDeleted} matches, ${accountsDeleted} accounts deleted (~${spaceFreedMB}MB freed) in ${duration}ms`
        );

        if (errors.length > 0) {
          sendAlert(
            AlertSeverity.MEDIUM,
            "Data Cleanup Completed with Errors",
            `Deleted ${matchesDeleted} matches, ${accountsDeleted} accounts with ${errors.length} errors`,
            "data-cleanup-worker",
            { errors }
          );
        }

        return { matchesDeleted, accountsDeleted, spaceFreedMB, duration, errors };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        logger.error(`Job failed: ${errorMsg}`);

        sendAlert(
          AlertSeverity.HIGH,
          "Data Cleanup Job Failed",
          errorMsg,
          "data-cleanup-worker",
          { jobId: job.id }
        );

        throw err;
      }
    }
  );
}
