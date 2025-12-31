import { createChampionStatsWorker } from "./champion-stats.worker";
import { createCompositionWorker } from "./composition.worker";
import { closeAllQueues } from "../queues";
import { closeRedis } from "../redis";

export { createChampionStatsWorker } from "./champion-stats.worker";
export { createCompositionWorker } from "./composition.worker";

/**
 * Start all workers
 * Call this from a separate process (not from Next.js API routes)
 */
export async function startAllWorkers() {
  console.log("[Workers] Starting all workers...");

  const workers = [
    createChampionStatsWorker(),
    createCompositionWorker(),
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
