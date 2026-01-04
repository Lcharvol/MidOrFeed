import {
  PgBoss,
  type Job,
  type SendOptions,
  type ScheduleOptions,
  type WorkOptions,
  type JobWithMetadata,
} from "pg-boss";
import { createLogger } from "./logger";

const logger = createLogger("job-queue");

// Queue names
export const QUEUE_NAMES = {
  CHAMPION_STATS: "champion-stats",
  COMPOSITIONS: "composition-gen",
  DATA_CRAWL: "data-crawl",
  ACCOUNT_SYNC: "account-sync",
  LEADERBOARD_SYNC: "leaderboard-sync",
  DDRAGON_SYNC: "ddragon-sync",
  META_ANALYSIS: "meta-analysis",
  SYNERGY_ANALYSIS: "synergy-analysis",
  ITEM_BUILDS: "item-builds",
  DATA_CLEANUP: "data-cleanup",
  ACCOUNT_REFRESH: "account-refresh",
  DAILY_RESET: "daily-reset",
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

// Singleton instance
let boss: PgBoss | null = null;

/**
 * Get or create pg-boss instance
 */
export async function getJobQueue(): Promise<PgBoss> {
  if (boss) {
    return boss;
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for job queue");
  }

  boss = new PgBoss({
    connectionString: databaseUrl,
    // Monitoring settings
    monitorIntervalSeconds: 60,
  });

  boss.on("error", (error: Error) => {
    logger.error("pg-boss error", error);
  });

  await boss.start();
  logger.info("pg-boss started successfully");

  return boss;
}

/**
 * Send a job to a queue
 */
export async function sendJob<T extends object>(
  queueName: QueueName,
  data: T,
  options?: SendOptions
): Promise<string | null> {
  const queue = await getJobQueue();
  return queue.send(queueName, data, {
    retryLimit: 3,
    retryDelay: 5,
    ...options,
  });
}

/**
 * Schedule a recurring job
 */
export async function scheduleJob<T extends object>(
  queueName: QueueName,
  cron: string,
  data: T,
  options?: ScheduleOptions
): Promise<void> {
  const queue = await getJobQueue();
  await queue.schedule(queueName, cron, data, options);
  logger.info(`Scheduled job ${queueName} with cron: ${cron}`);
}

/**
 * Register a worker for a queue
 */
export async function registerWorker<T extends object, R = void>(
  queueName: QueueName,
  handler: (job: Job<T>) => Promise<R>,
  options?: WorkOptions
): Promise<string> {
  const queue = await getJobQueue();

  const workerId = await queue.work<T, R>(
    queueName,
    {
      batchSize: 1,
      ...options,
    },
    async (jobs: Job<T>[]) => {
      // Process each job individually
      for (const job of jobs) {
        const startTime = Date.now();
        logger.info(`[${queueName}] Starting job ${job.id}`);

        try {
          const result = await handler(job);
          const duration = Date.now() - startTime;
          logger.info(`[${queueName}] Job ${job.id} completed in ${duration}ms`);
          return result;
        } catch (error) {
          const duration = Date.now() - startTime;
          logger.error(`[${queueName}] Job ${job.id} failed after ${duration}ms`, error as Error);
          throw error;
        }
      }
      return undefined as R;
    }
  );

  logger.info(`Worker registered for queue: ${queueName}`);
  return workerId;
}

/**
 * Get queue status
 */
export async function getQueueStatus(queueName: QueueName) {
  const queue = await getJobQueue();

  try {
    const stats = await queue.getQueueStats(queueName);
    return {
      created: stats.queuedCount,
      active: stats.activeCount,
      completed: 0,
      failed: 0,
    };
  } catch {
    return { created: 0, active: 0, completed: 0, failed: 0 };
  }
}

/**
 * Get all queues status
 */
export async function getAllQueuesStatus() {
  const status: Record<string, { waiting: number; active: number; completed: number; failed: number }> = {};

  for (const name of Object.values(QUEUE_NAMES)) {
    try {
      const queue = await getJobQueue();
      const stats = await queue.getQueueStats(name);
      status[name] = {
        waiting: stats.queuedCount,
        active: stats.activeCount,
        completed: 0,
        failed: 0,
      };
    } catch {
      status[name] = { waiting: 0, active: 0, completed: 0, failed: 0 };
    }
  }

  return status;
}

/**
 * Get recent jobs
 */
export async function getRecentJobs(limit = 20) {
  const queue = await getJobQueue();
  const jobs: Array<{
    id: string;
    queue: string;
    name: string;
    status: string;
    progress: number;
    timestamp: number;
    duration?: number;
    failedReason?: string;
  }> = [];

  for (const queueName of Object.values(QUEUE_NAMES)) {
    try {
      const queueJobs = await queue.fetch<unknown>(queueName, { includeMetadata: true });
      if (queueJobs && queueJobs.length > 0) {
        for (const job of queueJobs) {
          const jobMeta = job as JobWithMetadata<unknown>;
          jobs.push({
            id: jobMeta.id,
            queue: queueName,
            name: jobMeta.name,
            status: jobMeta.state || "active",
            progress: 0,
            timestamp: new Date(jobMeta.createdOn).getTime(),
          });
        }
      }
    } catch {
      // Queue might not exist yet
    }
  }

  return jobs.slice(0, limit);
}

/**
 * Get job by ID
 */
export async function getJobById<T = unknown>(queueName: QueueName, jobId: string) {
  const queue = await getJobQueue();
  return queue.getJobById<T>(queueName, jobId);
}

/**
 * Cancel a job
 */
export async function cancelJob(queueName: QueueName, jobId: string) {
  const queue = await getJobQueue();
  return queue.cancel(queueName, jobId);
}

/**
 * Retry a job
 */
export async function retryJob(queueName: QueueName, jobId: string) {
  const queue = await getJobQueue();
  return queue.retry(queueName, jobId);
}

/**
 * Close the job queue gracefully
 */
export async function closeJobQueue(): Promise<void> {
  if (boss) {
    await boss.stop({ graceful: true, timeout: 30000 });
    boss = null;
    logger.info("pg-boss stopped");
  }
}

// Convenience functions for specific queues
export const sendChampionStatsJob = (data: { championIds?: string[] }) =>
  sendJob(QUEUE_NAMES.CHAMPION_STATS, data);

export const sendDataCrawlJob = (data: { region?: string; count?: number }) =>
  sendJob(QUEUE_NAMES.DATA_CRAWL, data);

export const sendLeaderboardSyncJob = (data: { region?: string; tier?: string }) =>
  sendJob(QUEUE_NAMES.LEADERBOARD_SYNC, data);

export const sendDdragonSyncJob = (data: { force?: boolean }) =>
  sendJob(QUEUE_NAMES.DDRAGON_SYNC, data);

export const sendMetaAnalysisJob = (data: Record<string, unknown>) =>
  sendJob(QUEUE_NAMES.META_ANALYSIS, data);

export const sendDataCleanupJob = (data: { daysToKeep?: number }) =>
  sendJob(QUEUE_NAMES.DATA_CLEANUP, data);

export const sendAccountRefreshJob = (data: { puuid?: string }) =>
  sendJob(QUEUE_NAMES.ACCOUNT_REFRESH, data);

export const sendDailyResetJob = (data: Record<string, unknown>) =>
  sendJob(QUEUE_NAMES.DAILY_RESET, data);
