import {
  PgBoss,
  type Job,
  type SendOptions,
  type ScheduleOptions,
  type WorkOptions,
} from "pg-boss";
import { createLogger } from "./logger";
import { getEnv } from "@/lib/env";

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

// Singleton: store the initialization promise to prevent race conditions
let bossPromise: Promise<PgBoss> | null = null;

/**
 * Get or create pg-boss instance
 */
export async function getJobQueue(): Promise<PgBoss> {
  if (!bossPromise) {
    bossPromise = initJobQueue();
  }
  return bossPromise;
}

async function initJobQueue(): Promise<PgBoss> {
  const databaseUrl = getEnv().DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required for job queue");
  }

  const instance = new PgBoss({
    connectionString: databaseUrl,
    monitorIntervalSeconds: 60,
  });

  instance.on("error", (error: Error) => {
    logger.error("pg-boss error", error);
  });

  await instance.start();
  logger.info("pg-boss started successfully");

  // Create all queues (required since pg-boss v10+)
  for (const name of Object.values(QUEUE_NAMES)) {
    try {
      await instance.createQueue(name);
    } catch (err) {
      // Queue already exists — safe to ignore
      logger.info(`Queue ${name} already exists or created`);
    }
  }
  logger.info("All queues ensured");

  return instance;
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
    retryDelay: 30,
    retryBackoff: true,
    expireInSeconds: 1800, // 30 minutes
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
      waiting: stats.queuedCount,
      active: stats.activeCount,
      total: stats.totalCount,
      deferred: stats.deferredCount,
    };
  } catch {
    return { waiting: 0, active: 0, total: 0, deferred: 0 };
  }
}

/**
 * Get all queues status
 */
export async function getAllQueuesStatus() {
  const status: Record<string, { waiting: number; active: number; total: number; deferred: number }> = {};

  for (const name of Object.values(QUEUE_NAMES)) {
    try {
      const queue = await getJobQueue();
      const stats = await queue.getQueueStats(name);
      status[name] = {
        waiting: stats.queuedCount,
        active: stats.activeCount,
        total: stats.totalCount,
        deferred: stats.deferredCount,
      };
    } catch {
      status[name] = { waiting: 0, active: 0, total: 0, deferred: 0 };
    }
  }

  return status;
}

/**
 * Get recent jobs via SQL (read-only, does NOT dequeue)
 */
export async function getRecentJobs(limit = 30) {
  const boss = await getJobQueue();
  const db = boss.getDb();

  try {
    const result = await db.executeSql(
      `SELECT id, name, state, created_on, started_on, completed_on, output, retry_count
       FROM pgboss.job
       WHERE name = ANY($1)
       ORDER BY created_on DESC
       LIMIT $2`,
      [Object.values(QUEUE_NAMES), limit]
    );

    return (result.rows || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      queue: row.name as string,
      name: row.name as string,
      state: row.state as string,
      timestamp: new Date(row.created_on as string).getTime(),
      startedOn: row.started_on ? new Date(row.started_on as string).getTime() : undefined,
      completedOn: row.completed_on ? new Date(row.completed_on as string).getTime() : undefined,
      duration:
        row.started_on && row.completed_on
          ? new Date(row.completed_on as string).getTime() - new Date(row.started_on as string).getTime()
          : undefined,
      retryCount: row.retry_count as number,
      output: row.output as Record<string, unknown> | null,
    }));
  } catch (err) {
    logger.error("Failed to fetch recent jobs via SQL", err as Error);
    return [];
  }
}

/**
 * Get jobs for a specific queue via SQL (read-only)
 */
export async function getQueueJobs(queueName: QueueName, limit = 20) {
  const boss = await getJobQueue();
  const db = boss.getDb();

  try {
    const result = await db.executeSql(
      `SELECT id, name, state, data, created_on, started_on, completed_on, output, retry_count
       FROM pgboss.job
       WHERE name = $1
       ORDER BY created_on DESC
       LIMIT $2`,
      [queueName, limit]
    );

    return (result.rows || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string,
      state: row.state as string,
      data: row.data as Record<string, unknown> | null,
      createdOn: new Date(row.created_on as string).getTime(),
      startedOn: row.started_on ? new Date(row.started_on as string).getTime() : undefined,
      completedOn: row.completed_on ? new Date(row.completed_on as string).getTime() : undefined,
      retryCount: row.retry_count as number,
      output: row.output as Record<string, unknown> | null,
    }));
  } catch (err) {
    logger.error(`Failed to fetch jobs for queue ${queueName}`, err as Error);
    return [];
  }
}

/**
 * Purge jobs from a queue (without destroying the queue itself)
 */
export async function purgeQueue(queueName: QueueName) {
  const boss = await getJobQueue();
  await boss.deleteQueuedJobs(queueName);
  await boss.deleteStoredJobs(queueName);
}

/**
 * Update job progress (writes to the output column as JSON).
 * This does NOT dequeue; it's a plain SQL update on the active job row.
 */
export async function updateJobProgress(
  jobId: string,
  progress: { current: number; total: number; message?: string }
) {
  const boss = await getJobQueue();
  const db = boss.getDb();
  const percent = progress.total > 0 ? Math.round((progress.current / progress.total) * 100) : 0;
  await db.executeSql(
    `UPDATE pgboss.job SET output = $2 WHERE id = $1 AND state = 'active'`,
    [jobId, JSON.stringify({ ...progress, percent })]
  );
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
  if (bossPromise) {
    const instance = await bossPromise;
    await instance.stop({ graceful: true, timeout: 30000 });
    bossPromise = null;
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
