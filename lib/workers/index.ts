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
import { closeAllQueues } from "../queues";
import { closeRedis } from "../redis";

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
  console.log("[Workers] Starting all workers...");

  const workers = [
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
  ];

  console.log(`[Workers] Started ${workers.length} workers`);

  // Graceful shutdown handler
  const shutdown = async () => {
    console.log("[Workers] Shutting down...");

    for (const worker of workers) {
      await worker.close();
    }

    await closeAllQueues();
    await closeRedis();

    console.log("[Workers] Shutdown complete");
    process.exit(0);
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);

  return workers;
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
