import { Queue, QueueEvents, JobsOptions } from "bullmq";
import { getRedisConnection } from "../redis";

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

// Default job options
export const DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: {
    type: "exponential",
    delay: 5000,
  },
  removeOnComplete: {
    count: 100, // Keep last 100 completed jobs
  },
  removeOnFail: {
    count: 50, // Keep last 50 failed jobs
  },
};

// Queue instances cache
const queues = new Map<QueueName, Queue>();
const queueEvents = new Map<QueueName, QueueEvents>();

/**
 * Get or create a queue by name
 */
export function getQueue(name: QueueName): Queue {
  if (!queues.has(name)) {
    const queue = new Queue(name, {
      ...getRedisConnection(),
      defaultJobOptions: DEFAULT_JOB_OPTIONS,
    });
    queues.set(name, queue);
  }
  return queues.get(name)!;
}

/**
 * Get or create queue events listener
 */
export function getQueueEvents(name: QueueName): QueueEvents {
  if (!queueEvents.has(name)) {
    const events = new QueueEvents(name, getRedisConnection());
    queueEvents.set(name, events);
  }
  return queueEvents.get(name)!;
}

// Convenience getters for specific queues
export const championStatsQueue = () => getQueue(QUEUE_NAMES.CHAMPION_STATS);
export const compositionsQueue = () => getQueue(QUEUE_NAMES.COMPOSITIONS);
export const dataCrawlQueue = () => getQueue(QUEUE_NAMES.DATA_CRAWL);
export const accountSyncQueue = () => getQueue(QUEUE_NAMES.ACCOUNT_SYNC);
export const leaderboardSyncQueue = () => getQueue(QUEUE_NAMES.LEADERBOARD_SYNC);
export const ddragonSyncQueue = () => getQueue(QUEUE_NAMES.DDRAGON_SYNC);
export const metaAnalysisQueue = () => getQueue(QUEUE_NAMES.META_ANALYSIS);
export const synergyAnalysisQueue = () => getQueue(QUEUE_NAMES.SYNERGY_ANALYSIS);
export const itemBuildsQueue = () => getQueue(QUEUE_NAMES.ITEM_BUILDS);
export const dataCleanupQueue = () => getQueue(QUEUE_NAMES.DATA_CLEANUP);
export const accountRefreshQueue = () => getQueue(QUEUE_NAMES.ACCOUNT_REFRESH);
export const dailyResetQueue = () => getQueue(QUEUE_NAMES.DAILY_RESET);

/**
 * Get all queues status
 */
export async function getAllQueuesStatus() {
  const status: Record<
    string,
    {
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
    }
  > = {};

  for (const name of Object.values(QUEUE_NAMES)) {
    const queue = getQueue(name);
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    status[name] = { waiting, active, completed, failed, delayed };
  }

  return status;
}

interface JobProgressData {
  current: number;
  total: number;
  message?: string;
  percent?: number;
}

interface RecentJobData {
  id: string;
  queue: string;
  name: string;
  status: string;
  progress: number | JobProgressData;
  timestamp: number;
  processedOn?: number;
  finishedOn?: number;
  duration?: number;
  failedReason?: string;
}

/**
 * Get recent jobs from all queues
 */
export async function getRecentJobs(limit = 20): Promise<RecentJobData[]> {
  const jobs: RecentJobData[] = [];

  for (const queueName of Object.values(QUEUE_NAMES)) {
    const queue = getQueue(queueName);

    // Get jobs in various states
    const [active, completed, failed, waiting] = await Promise.all([
      queue.getJobs(["active"], 0, 10),
      queue.getJobs(["completed"], 0, 10),
      queue.getJobs(["failed"], 0, 10),
      queue.getJobs(["waiting"], 0, 10),
    ]);

    const allJobs = [...active, ...completed, ...failed, ...waiting];

    for (const job of allJobs) {
      const state = await job.getState();

      // Normalize progress - could be number or object
      let progress: number | JobProgressData = 0;
      if (job.progress) {
        if (typeof job.progress === "number") {
          progress = job.progress;
        } else if (typeof job.progress === "object") {
          const p = job.progress as JobProgressData;
          progress = {
            current: p.current || 0,
            total: p.total || 100,
            message: p.message,
            percent: p.total > 0 ? Math.round((p.current / p.total) * 100) : 0,
          };
        }
      }

      jobs.push({
        id: job.id || "unknown",
        queue: queueName,
        name: job.name,
        status: state,
        progress,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        duration: job.finishedOn && job.processedOn
          ? job.finishedOn - job.processedOn
          : undefined,
        failedReason: job.failedReason,
      });
    }
  }

  // Sort by timestamp descending and limit
  return jobs.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
}

/**
 * Close all queue connections gracefully
 */
export async function closeAllQueues(): Promise<void> {
  const queueList = Array.from(queues.values());
  const eventsList = Array.from(queueEvents.values());

  for (const queue of queueList) {
    await queue.close();
  }
  for (const events of eventsList) {
    await events.close();
  }
  queues.clear();
  queueEvents.clear();
}
