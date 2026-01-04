import { Job } from "pg-boss";
import { registerWorker, QUEUE_NAMES } from "../job-queue";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import { createLogger } from "../logger";
import type {
  ItemBuildsJobData,
  ItemBuildsJobResult,
} from "../queues/types";

const logger = createLogger("item-builds-worker");

/**
 * Item Builds Worker
 * Calculates the most effective item builds per champion
 */
export async function createItemBuildsWorker() {
  return registerWorker<ItemBuildsJobData, ItemBuildsJobResult>(
    QUEUE_NAMES.ITEM_BUILDS,
    async (job: Job<ItemBuildsJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let buildsGenerated = 0;
      let championsProcessed = 0;

      try {
        logger.info(`Starting job ${job.id}`);

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
        logger.info(`Analyzing builds for ${total} champions`);

        for (let i = 0; i < champions.length; i++) {
          const { championId } = champions[i];

          try {
            // Get most common winning item combinations
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
              logger.debug(`Champion ${championId}: ${builds.length} popular builds found`);
              buildsGenerated += builds.length;
              championsProcessed++;
            }
          } catch (err) {
            const errorMsg = `Failed to analyze builds for ${championId}: ${
              err instanceof Error ? err.message : "Unknown error"
            }`;
            errors.push(errorMsg);
            logger.error(errorMsg);
          }
        }

        const duration = Date.now() - startTime;
        logger.info(
          `Completed: ${buildsGenerated} builds from ${championsProcessed} champions in ${duration}ms`
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
        logger.error(`Job failed: ${errorMsg}`);

        sendAlert(
          AlertSeverity.HIGH,
          "Item Builds Job Failed",
          errorMsg,
          "item-builds-worker",
          { jobId: job.id }
        );

        throw err;
      }
    }
  );
}
