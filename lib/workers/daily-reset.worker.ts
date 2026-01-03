import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../redis";
import { QUEUE_NAMES } from "../queues";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import { notifyJobCompleted, notifyJobFailed } from "./job-notifications";
import type {
  DailyResetJobData,
  DailyResetJobResult,
  JobProgress,
} from "../queues/types";

/**
 * Daily Reset Worker
 * Resets daily quotas and performs scheduled maintenance tasks
 */
export function createDailyResetWorker() {
  const worker = new Worker<DailyResetJobData, DailyResetJobResult>(
    QUEUE_NAMES.DAILY_RESET,
    async (job: Job<DailyResetJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let usersReset = 0;
      let notificationsArchived = 0;

      try {
        console.log(`[Daily Reset] Starting job ${job.id}`);

        const {
          resetAnalysisQuotas = true,
          archiveNotifications = true,
        } = job.data;

        // Step 1: Reset analysis quotas for all users
        if (resetAnalysisQuotas) {
          const progress1: JobProgress = {
            current: 1,
            total: 2,
            message: "Resetting daily analysis quotas",
          };
          await job.updateProgress(progress1);

          try {
            // Reset daily analyses used to 0 for all users
            const result = await prisma.user.updateMany({
              where: {
                dailyAnalysesUsed: { gt: 0 },
              },
              data: {
                dailyAnalysesUsed: 0,
                lastDailyReset: new Date(),
              },
            });

            usersReset = result.count;
            console.log(`[Daily Reset] Reset quotas for ${usersReset} users`);
          } catch (err) {
            const errorMsg = `Failed to reset quotas: ${
              err instanceof Error ? err.message : "Unknown error"
            }`;
            errors.push(errorMsg);
            console.error(`[Daily Reset] ${errorMsg}`);
          }
        }

        // Step 2: Archive/cleanup old notifications (if we had a notifications table)
        if (archiveNotifications) {
          const progress2: JobProgress = {
            current: 2,
            total: 2,
            message: "Archiving old notifications",
          };
          await job.updateProgress(progress2);

          try {
            // Note: We'd need a Notification model for this
            // For now, we just log the step
            console.log(`[Daily Reset] Notification archival: No notifications table yet`);
            notificationsArchived = 0;
          } catch (err) {
            const errorMsg = `Failed to archive notifications: ${
              err instanceof Error ? err.message : "Unknown error"
            }`;
            errors.push(errorMsg);
            console.error(`[Daily Reset] ${errorMsg}`);
          }
        }

        // Additional daily tasks could be added here:
        // - Update subscription expirations
        // - Send daily digest emails
        // - Refresh cached stats
        // - Clean up expired sessions

        // Check for expired subscriptions
        try {
          const expiredSubs = await prisma.user.updateMany({
            where: {
              subscriptionExpiresAt: { lt: new Date() },
              subscriptionTier: { not: "free" },
            },
            data: {
              subscriptionTier: "free",
            },
          });

          if (expiredSubs.count > 0) {
            console.log(`[Daily Reset] Expired ${expiredSubs.count} subscriptions`);
          }
        } catch (err) {
          console.error(`[Daily Reset] Failed to check subscriptions:`, err);
        }

        const duration = Date.now() - startTime;
        console.log(
          `[Daily Reset] Completed: ${usersReset} users reset, ${notificationsArchived} notifications archived in ${duration}ms`
        );

        if (errors.length > 0) {
          sendAlert(
            AlertSeverity.MEDIUM,
            "Daily Reset Completed with Errors",
            `Reset ${usersReset} users with ${errors.length} errors`,
            "daily-reset-worker",
            { errors }
          );
        }

        return { usersReset, notificationsArchived, duration, errors };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Daily Reset] Job failed:`, err);

        sendAlert(
          AlertSeverity.HIGH,
          "Daily Reset Job Failed",
          errorMsg,
          "daily-reset-worker",
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

  worker.on("completed", (job, result) => {
    console.log(`[Daily Reset] Job ${job.id} completed`);
    notifyJobCompleted(QUEUE_NAMES.DAILY_RESET, job.id, result as unknown as Record<string, unknown>);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Daily Reset] Job ${job?.id} failed:`, err);
    notifyJobFailed(QUEUE_NAMES.DAILY_RESET, job?.id, err);
  });

  return worker;
}
