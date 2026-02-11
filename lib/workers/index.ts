import { createChampionStatsWorker } from "./champion-stats.worker";
import { createCompositionWorker } from "./composition.worker";
import { createDataCrawlWorker } from "./data-crawl.worker";
import { createLeaderboardSyncWorker } from "./leaderboard-sync.worker";
import { createDDragonSyncWorker } from "./ddragon-sync.worker";
import { createMetaAnalysisWorker } from "./meta-analysis.worker";
import { createSynergyAnalysisWorker } from "./synergy-analysis.worker";
import { createItemBuildsWorker } from "./item-builds.worker";
import { createDataCleanupWorker } from "./data-cleanup.worker";
import { createAccountRefreshWorker } from "./account-refresh.worker";
import { createDailyResetWorker } from "./daily-reset.worker";
import { closeJobQueue, scheduleJob, QUEUE_NAMES } from "../job-queue";
import { createLogger } from "../logger";

const logger = createLogger("workers");

// Export individual worker creators
export { createChampionStatsWorker } from "./champion-stats.worker";
export { createCompositionWorker } from "./composition.worker";
export { createDataCrawlWorker } from "./data-crawl.worker";
export { createLeaderboardSyncWorker } from "./leaderboard-sync.worker";
export { createDDragonSyncWorker } from "./ddragon-sync.worker";
export { createMetaAnalysisWorker } from "./meta-analysis.worker";
export { createSynergyAnalysisWorker } from "./synergy-analysis.worker";
export { createItemBuildsWorker } from "./item-builds.worker";
export { createDataCleanupWorker } from "./data-cleanup.worker";
export { createAccountRefreshWorker } from "./account-refresh.worker";
export { createDailyResetWorker } from "./daily-reset.worker";

/**
 * Start all workers
 * Call this from a separate process (not from Next.js API routes)
 */
export async function startAllWorkers() {
  logger.info("Starting all workers...");

  const workerIds: string[] = [];

  // Start all workers (they now return worker IDs)
  const workers = await Promise.all([
    // Data collection & analysis
    createChampionStatsWorker(),
    createCompositionWorker(),
    createDataCrawlWorker(),
    createMetaAnalysisWorker(),
    createSynergyAnalysisWorker(),
    createItemBuildsWorker(),

    // Sync jobs
    createLeaderboardSyncWorker(),
    createDDragonSyncWorker(),
    createAccountRefreshWorker(),

    // Maintenance jobs
    createDataCleanupWorker(),
    createDailyResetWorker(),
  ]);

  workerIds.push(...workers);
  logger.info(`Started ${workerIds.length} workers`);

  // Graceful shutdown handler
  const shutdown = async () => {
    logger.info("Shutting down...");
    await closeJobQueue();
    logger.info("Shutdown complete");
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return workerIds;
}

/**
 * Schedule all recurring jobs via pg-boss cron
 * Safe to call multiple times — pg-boss deduplicates schedules by queue name.
 */
export async function scheduleAllJobs() {
  logger.info("Scheduling recurring jobs...");

  const schedules: Array<{ queue: Parameters<typeof scheduleJob>[0]; cron: string; data: Record<string, unknown> }> = [
    // Every day at 00:00 UTC — reset daily quotas
    { queue: QUEUE_NAMES.DAILY_RESET, cron: "0 0 * * *", data: {} },
    // Every day at 01:00 UTC — cleanup old data
    { queue: QUEUE_NAMES.DATA_CLEANUP, cron: "0 1 * * *", data: { daysToKeep: 90 } },
    // Every 4 hours — sync leaderboards
    { queue: QUEUE_NAMES.LEADERBOARD_SYNC, cron: "0 */4 * * *", data: {} },
    // Every 6 hours — sync DDragon (champion/item data)
    { queue: QUEUE_NAMES.DDRAGON_SYNC, cron: "0 */6 * * *", data: {} },
    // Every 2 hours — refresh stale accounts
    { queue: QUEUE_NAMES.ACCOUNT_REFRESH, cron: "0 */2 * * *", data: {} },
    // Every hour — meta analysis
    { queue: QUEUE_NAMES.META_ANALYSIS, cron: "0 * * * *", data: {} },
    // Every 3 hours — synergy analysis
    { queue: QUEUE_NAMES.SYNERGY_ANALYSIS, cron: "0 */3 * * *", data: {} },
    // Every 3 hours — champion stats
    { queue: QUEUE_NAMES.CHAMPION_STATS, cron: "0 */3 * * *", data: {} },
    // Every 6 hours — item builds analysis
    { queue: QUEUE_NAMES.ITEM_BUILDS, cron: "0 */6 * * *", data: {} },
    // Every 2 hours — crawl new match data
    { queue: QUEUE_NAMES.DATA_CRAWL, cron: "0 */2 * * *", data: {} },
    // Every 4 hours — generate compositions
    { queue: QUEUE_NAMES.COMPOSITIONS, cron: "0 */4 * * *", data: {} },
  ];

  for (const { queue, cron, data } of schedules) {
    try {
      await scheduleJob(queue, cron, data);
    } catch (err) {
      logger.error(`Failed to schedule ${queue}`, err as Error);
    }
  }

  logger.info(`Scheduled ${schedules.length} recurring jobs`);
}

/**
 * Worker descriptions for the admin panel
 */
export const WORKER_DESCRIPTIONS: Record<string, { name: string; description: string }> = {
  "champion-stats": {
    name: "Champion Stats",
    description: "Calcule les statistiques (winrate, KDA, counters) pour chaque champion",
  },
  "composition-gen": {
    name: "Compositions",
    description: "Génère des suggestions de pick basées sur l'analyse des matchs",
  },
  "data-crawl": {
    name: "Data Crawl",
    description: "Collecte les matchs des joueurs découverts pour enrichir la base de données",
  },
  "account-sync": {
    name: "Account Sync",
    description: "Synchronise les comptes joueurs depuis l'API Riot",
  },
  "leaderboard-sync": {
    name: "Leaderboard Sync",
    description: "Synchronise les classements Challenger/GM/Master depuis l'API Riot",
  },
  "ddragon-sync": {
    name: "DDragon Sync",
    description: "Met à jour les champions, items et versions depuis DDragon CDN",
  },
  "meta-analysis": {
    name: "Meta Analysis",
    description: "Analyse la méta actuelle: top picks par rôle, tendances",
  },
  "synergy-analysis": {
    name: "Synergy Analysis",
    description: "Calcule les synergies entre champions (duos gagnants)",
  },
  "item-builds": {
    name: "Item Builds",
    description: "Analyse les builds d'items les plus efficaces par champion",
  },
  "data-cleanup": {
    name: "Data Cleanup",
    description: "Nettoie les données anciennes pour optimiser la base de données",
  },
  "account-refresh": {
    name: "Account Refresh",
    description: "Rafraîchit les informations des comptes liés (niveau, icône, nom)",
  },
  "daily-reset": {
    name: "Daily Reset",
    description: "Reset les quotas journaliers et effectue la maintenance quotidienne",
  },
};
