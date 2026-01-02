import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../redis";
import { QUEUE_NAMES } from "../queues";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import type {
  DataCleanupJobData,
  DataCleanupJobResult,
  JobProgress,
} from "../queues/types";

/**
 * Data Cleanup Worker
 * Cleans old/stale data to optimize database size
 */
export function createDataCleanupWorker() {
  const worker = new Worker<DataCleanupJobData, DataCleanupJobResult>(
    QUEUE_NAMES.DATA_CLEANUP,
    async (job: Job<DataCleanupJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let matchesDeleted = 0;
      let accountsDeleted = 0;
      let spaceFreedMB = 0;

      try {
        console.log(`[Data Cleanup] Starting job ${job.id}`);

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
        const progress1: JobProgress = {
          current: 1,
          total: 3,
          message: `Cleaning matches older than ${matchesOlderThanDays} days`,
        };
        await job.updateProgress(progress1);

        try {
          // Count matches to delete
          const oldMatchesCount = await prisma.match.count({
            where: {
              gameCreation: { lt: matchCutoffTimestamp },
            },
          });

          console.log(`[Data Cleanup] Found ${oldMatchesCount} old matches`);

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

              console.log(`[Data Cleanup] Deleted ${deleted}/${oldMatchesCount} matches`);
            }
          } else if (dryRun) {
            console.log(`[Data Cleanup] DRY RUN: Would delete ${oldMatchesCount} matches`);
            matchesDeleted = oldMatchesCount;
          }
        } catch (err) {
          const errorMsg = `Failed to clean matches: ${
            err instanceof Error ? err.message : "Unknown error"
          }`;
          errors.push(errorMsg);
          console.error(`[Data Cleanup] ${errorMsg}`);
        }

        // Step 2: Clean inactive discovered players
        const progress2: JobProgress = {
          current: 2,
          total: 3,
          message: `Cleaning inactive accounts (${inactiveAccountsDays}+ days)`,
        };
        await job.updateProgress(progress2);

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

          console.log(`[Data Cleanup] Found ${inactiveCount} inactive discovered players`);

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
            console.log(`[Data Cleanup] DRY RUN: Would delete ${inactiveCount} discovered players`);
            accountsDeleted = inactiveCount;
          }
        } catch (err) {
          const errorMsg = `Failed to clean inactive accounts: ${
            err instanceof Error ? err.message : "Unknown error"
          }`;
          errors.push(errorMsg);
          console.error(`[Data Cleanup] ${errorMsg}`);
        }

        // Step 3: Clean old job history (completed/failed jobs older than 7 days)
        const progress3: JobProgress = {
          current: 3,
          total: 3,
          message: "Cleaning old job history",
        };
        await job.updateProgress(progress3);

        // BullMQ handles job cleanup via removeOnComplete/removeOnFail options
        // So we just log this step
        console.log(`[Data Cleanup] Job history cleanup handled by BullMQ`);

        // Estimate space freed (rough calculation)
        spaceFreedMB = Math.round((matchesDeleted * 0.002 + accountsDeleted * 0.001) * 10) / 10;

        const duration = Date.now() - startTime;
        console.log(
          `[Data Cleanup] Completed: ${matchesDeleted} matches, ${accountsDeleted} accounts deleted (~${spaceFreedMB}MB freed) in ${duration}ms`
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
        console.error(`[Data Cleanup] Job failed:`, err);

        sendAlert(
          AlertSeverity.HIGH,
          "Data Cleanup Job Failed",
          errorMsg,
          "data-cleanup-worker",
          { jobId: job.id }
        );

        throw err;
      }
    },
    {
      ...getRedisConnection(),
      concurrency: 1,
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Data Cleanup] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Data Cleanup] Job ${job?.id} failed:`, err);
  });

  return worker;
}
