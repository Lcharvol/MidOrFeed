import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../redis";
import { QUEUE_NAMES } from "../queues";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import { notifyJobCompleted, notifyJobFailed } from "./job-notifications";
import type {
  ItemBuildsJobData,
  ItemBuildsJobResult,
  JobProgress,
} from "../queues/types";

type BuildData = {
  items: number[];
  games: number;
  wins: number;
  winRate: number;
};

/**
 * Item Builds Worker
 * Calculates the most effective item builds per champion
 */
export function createItemBuildsWorker() {
  const worker = new Worker<ItemBuildsJobData, ItemBuildsJobResult>(
    QUEUE_NAMES.ITEM_BUILDS,
    async (job: Job<ItemBuildsJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let buildsGenerated = 0;
      let championsProcessed = 0;

      try {
        console.log(`[Item Builds] Starting job ${job.id}`);

        const { championIds, minGames = 50 } = job.data;

        // Get champions to process
        let champions: Array<{ championId: string }>;

        if (championIds && championIds.length > 0) {
          champions = championIds.map((id) => ({ championId: id }));
        } else {
          champions = await prisma.$queryRaw<Array<{ championId: string }>>`
            SELECT DISTINCT "championId" FROM match_participants
          `;
        }

        const total = champions.length;
        console.log(`[Item Builds] Analyzing builds for ${total} champions`);

        for (let i = 0; i < champions.length; i++) {
          const { championId } = champions[i];

          const progress: JobProgress = {
            current: i + 1,
            total,
            message: `Analyzing builds for champion ${championId} (${i + 1}/${total})`,
          };
          await job.updateProgress(progress);

          try {
            // Get most common winning item combinations
            // We group by the final build (items 0-5, excluding boots/wards in item6)
            const builds = await prisma.$queryRaw<
              Array<{
                item0: number | null;
                item1: number | null;
                item2: number | null;
                item3: number | null;
                item4: number | null;
                item5: number | null;
                games: bigint;
                wins: bigint;
              }>
            >`
              SELECT
                item0, item1, item2, item3, item4, item5,
                COUNT(*) as games,
                SUM(CASE WHEN win THEN 1 ELSE 0 END) as wins
              FROM match_participants
              WHERE "championId" = ${championId}
                AND win = true
                AND item0 IS NOT NULL
                AND item0 > 0
              GROUP BY item0, item1, item2, item3, item4, item5
              HAVING COUNT(*) >= ${minGames}
              ORDER BY COUNT(*) DESC
              LIMIT 5
            `;

            if (builds.length > 0) {
              const buildData: BuildData[] = builds.map((b) => {
                const items = [b.item0, b.item1, b.item2, b.item3, b.item4, b.item5]
                  .filter((item): item is number => item !== null && item > 0);

                return {
                  items,
                  games: Number(b.games),
                  wins: Number(b.wins),
                  winRate: Number(b.games) > 0
                    ? (Number(b.wins) / Number(b.games)) * 100
                    : 0,
                };
              });

              // Store builds - for now, we log them
              // In production, you'd want a ChampionBuild model
              console.log(
                `[Item Builds] Champion ${championId}: ${builds.length} popular builds found`
              );

              // We could store this in ChampionStats or a dedicated table
              // For demonstration, we'll just count them
              buildsGenerated += builds.length;
              championsProcessed++;
            }
          } catch (err) {
            const errorMsg = `Failed to analyze builds for ${championId}: ${
              err instanceof Error ? err.message : "Unknown error"
            }`;
            errors.push(errorMsg);
            console.error(`[Item Builds] ${errorMsg}`);
          }
        }

        const duration = Date.now() - startTime;
        console.log(
          `[Item Builds] Completed: ${buildsGenerated} builds from ${championsProcessed} champions in ${duration}ms`
        );

        if (errors.length > 0) {
          sendAlert(
            AlertSeverity.MEDIUM,
            "Item Builds Analysis Completed with Errors",
            `Analyzed ${championsProcessed} champions with ${errors.length} errors`,
            "item-builds-worker",
            { errors: errors.slice(0, 5) }
          );
        }

        return { buildsGenerated, championsProcessed, duration, errors };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Item Builds] Job failed:`, err);

        sendAlert(
          AlertSeverity.HIGH,
          "Item Builds Job Failed",
          errorMsg,
          "item-builds-worker",
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
    console.log(`[Item Builds] Job ${job.id} completed`);
    notifyJobCompleted(QUEUE_NAMES.ITEM_BUILDS, job.id, result as unknown as Record<string, unknown>);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Item Builds] Job ${job?.id} failed:`, err);
    notifyJobFailed(QUEUE_NAMES.ITEM_BUILDS, job?.id, err);
  });

  return worker;
}
