import { Job } from "pg-boss";
import { registerWorker, QUEUE_NAMES } from "../job-queue";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import { createLogger } from "../logger";
import type {
  SynergyAnalysisJobData,
  SynergyAnalysisJobResult,
} from "../queues/types";

const logger = createLogger("synergy-analysis-worker");

/**
 * Synergy Analysis Worker
 * Computes champion synergies (which champions work well together)
 */
export async function createSynergyAnalysisWorker() {
  return registerWorker<SynergyAnalysisJobData, SynergyAnalysisJobResult>(
    QUEUE_NAMES.SYNERGY_ANALYSIS,
    async (job: Job<SynergyAnalysisJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let synergiesComputed = 0;
      let championPairsAnalyzed = 0;

      try {
        logger.info(`Starting job ${job.id}`);

        const {
          minGamesTogether = 50,
          topSynergiesPerChampion = 10,
        } = job.data;

        // Get all unique champions from recent matches
        const champions = await prisma.$queryRaw<Array<{ championId: string }>>`
          SELECT DISTINCT "championId" FROM match_participants
        `;

        const total = champions.length;
        logger.info(`Analyzing synergies for ${total} champions`);

        for (let i = 0; i < champions.length; i++) {
          const { championId } = champions[i];

          try {
            // Find best synergies (teammates that help this champion win)
            const synergies = await prisma.$queryRaw<
              Array<{
                allyChampionId: string;
                games: bigint;
                wins: bigint;
              }>
            >`
              SELECT
                ally."championId" as "allyChampionId",
                COUNT(*) as games,
                SUM(CASE WHEN mp.win THEN 1 ELSE 0 END) as wins
              FROM match_participants mp
              JOIN match_participants ally
                ON mp."matchId" = ally."matchId"
                AND mp."teamId" = ally."teamId"
                AND mp.id != ally.id
              WHERE mp."championId" = ${championId}
              GROUP BY ally."championId"
              HAVING COUNT(*) >= ${minGamesTogether}
              ORDER BY (SUM(CASE WHEN mp.win THEN 1 ELSE 0 END)::float / COUNT(*)) DESC
              LIMIT ${topSynergiesPerChampion}
            `;

            if (synergies.length > 0) {
              // Update ChampionStats with synergy data
              await prisma.championStats.upsert({
                where: { championId },
                create: {
                  championId,
                },
                update: {
                  lastAnalyzedAt: new Date(),
                },
              });

              synergiesComputed += synergies.length;
              championPairsAnalyzed++;

              logger.debug(`Found ${synergies.length} synergies for champion ${championId}`);
            }
          } catch (err) {
            const errorMsg = `Failed to analyze synergies for ${championId}: ${
              err instanceof Error ? err.message : "Unknown error"
            }`;
            errors.push(errorMsg);
            logger.error(errorMsg);
          }
        }

        const duration = Date.now() - startTime;
        logger.info(
          `Completed: ${synergiesComputed} synergies from ${championPairsAnalyzed} champions in ${duration}ms`
        );

        if (errors.length > 0) {
          sendAlert(
            AlertSeverity.MEDIUM,
            "Synergy Analysis Completed with Errors",
            `Analyzed ${championPairsAnalyzed} champions with ${errors.length} errors`,
            "synergy-analysis-worker",
            { errors: errors.slice(0, 5) }
          );
        }

        return { synergiesComputed, championPairsAnalyzed, duration, errors };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        logger.error(`Job failed: ${errorMsg}`);

        sendAlert(
          AlertSeverity.HIGH,
          "Synergy Analysis Job Failed",
          errorMsg,
          "synergy-analysis-worker",
          { jobId: job.id }
        );

        throw err;
      }
    }
  );
}
