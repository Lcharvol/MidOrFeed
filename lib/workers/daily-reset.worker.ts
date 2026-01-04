import { Job } from "pg-boss";
import { registerWorker, QUEUE_NAMES } from "../job-queue";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import { createLogger } from "../logger";
import type {
  DailyResetJobData,
  DailyResetJobResult,
} from "../queues/types";

const logger = createLogger("daily-reset-worker");

/**
 * Daily Reset Worker
 * Resets daily quotas and performs scheduled maintenance tasks
 */
export async function createDailyResetWorker() {
  return registerWorker<DailyResetJobData, DailyResetJobResult>(
    QUEUE_NAMES.DAILY_RESET,
    async (job: Job<DailyResetJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let usersReset = 0;
      let notificationsArchived = 0;

      try {
        logger.info(`Starting job ${job.id}`);

        const {
          resetAnalysisQuotas = true,
          archiveNotifications = true,
        } = job.data;

        // Step 1: Reset analysis quotas for all users
        if (resetAnalysisQuotas) {
          logger.info("Resetting daily analysis quotas");

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
            logger.info(`Reset quotas for ${usersReset} users`);
          } catch (err) {
            const errorMsg = `Failed to reset quotas: ${
              err instanceof Error ? err.message : "Unknown error"
            }`;
            errors.push(errorMsg);
            logger.error(errorMsg);
          }
        }

        // Step 2: Archive/cleanup old notifications (if we had a notifications table)
        if (archiveNotifications) {
          logger.info("Archiving old notifications");

          try {
            // Note: We'd need a Notification model for this
            logger.info("Notification archival: No notifications table yet");
            notificationsArchived = 0;
          } catch (err) {
            const errorMsg = `Failed to archive notifications: ${
              err instanceof Error ? err.message : "Unknown error"
            }`;
            errors.push(errorMsg);
            logger.error(errorMsg);
          }
        }

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
            logger.info(`Expired ${expiredSubs.count} subscriptions`);
          }
        } catch (err) {
          logger.error(`Failed to check subscriptions: ${err}`);
        }

        const duration = Date.now() - startTime;
        logger.info(
          `Completed: ${usersReset} users reset, ${notificationsArchived} notifications archived in ${duration}ms`
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
        logger.error(`Job failed: ${errorMsg}`);

        sendAlert(
          AlertSeverity.HIGH,
          "Daily Reset Job Failed",
          errorMsg,
          "daily-reset-worker",
          { jobId: job.id }
        );

        throw err;
      }
    }
  );
}
