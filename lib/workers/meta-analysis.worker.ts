import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../redis";
import { QUEUE_NAMES } from "../queues";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import { notifyJobCompleted, notifyJobFailed } from "./job-notifications";
import type {
  MetaAnalysisJobData,
  MetaAnalysisJobResult,
  JobProgress,
} from "../queues/types";

const ROLES = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"] as const;

/**
 * Meta Analysis Worker
 * Analyzes current meta: top picks per role, trends, etc.
 */
export function createMetaAnalysisWorker() {
  const worker = new Worker<MetaAnalysisJobData, MetaAnalysisJobResult>(
    QUEUE_NAMES.META_ANALYSIS,
    async (job: Job<MetaAnalysisJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let championsAnalyzed = 0;
      let topPicksGenerated = 0;

      try {
        console.log(`[Meta Analysis] Starting job ${job.id}`);

        const { minGames = 100, daysToAnalyze = 7 } = job.data;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToAnalyze);
        const cutoffTimestamp = BigInt(cutoffDate.getTime());

        // Analyze each role
        for (let i = 0; i < ROLES.length; i++) {
          const role = ROLES[i];

          const progress: JobProgress = {
            current: i + 1,
            total: ROLES.length,
            message: `Analyzing ${role} meta`,
          };
          await job.updateProgress(progress);

          try {
            // Get champion stats for this role
            const stats = await prisma.$queryRaw<
              Array<{
                championId: string;
                total: bigint;
                wins: bigint;
                avgKills: number;
                avgDeaths: number;
                avgAssists: number;
              }>
            >`
              SELECT
                mp."championId",
                COUNT(*) as total,
                SUM(CASE WHEN mp.win THEN 1 ELSE 0 END) as wins,
                AVG(mp.kills) as "avgKills",
                AVG(mp.deaths) as "avgDeaths",
                AVG(mp.assists) as "avgAssists"
              FROM match_participants mp
              JOIN matches m ON mp."matchId" = m.id
              WHERE mp.role = ${role}
                AND m."gameCreation" >= ${cutoffTimestamp}
                AND m."queueId" IN (420, 440)
              GROUP BY mp."championId"
              HAVING COUNT(*) >= ${minGames}
              ORDER BY (SUM(CASE WHEN mp.win THEN 1 ELSE 0 END)::float / COUNT(*)) DESC
              LIMIT 20
            `;

            for (const stat of stats) {
              const totalGames = Number(stat.total);
              const totalWins = Number(stat.wins);
              const winRate = totalGames > 0 ? (totalWins / totalGames) * 100 : 0;
              const avgKDA =
                stat.avgDeaths > 0
                  ? (stat.avgKills + stat.avgAssists) / stat.avgDeaths
                  : stat.avgKills + stat.avgAssists;

              // Update champion stats with role-specific meta data
              await prisma.championStats.upsert({
                where: { championId: stat.championId },
                create: {
                  championId: stat.championId,
                  totalGames,
                  totalWins,
                  totalLosses: totalGames - totalWins,
                  winRate,
                  avgKills: stat.avgKills,
                  avgDeaths: stat.avgDeaths,
                  avgAssists: stat.avgAssists,
                  avgKDA,
                  topRole: role,
                  score: winRate * Math.log10(totalGames + 1),
                  lastAnalyzedAt: new Date(),
                },
                update: {
                  totalGames,
                  totalWins,
                  totalLosses: totalGames - totalWins,
                  winRate,
                  avgKills: stat.avgKills,
                  avgDeaths: stat.avgDeaths,
                  avgAssists: stat.avgAssists,
                  avgKDA,
                  topRole: role,
                  score: winRate * Math.log10(totalGames + 1),
                  lastAnalyzedAt: new Date(),
                },
              });

              championsAnalyzed++;
              topPicksGenerated++;
            }

            console.log(`[Meta Analysis] Analyzed ${stats.length} champions for ${role}`);
          } catch (err) {
            const errorMsg = `Failed to analyze ${role}: ${
              err instanceof Error ? err.message : "Unknown error"
            }`;
            errors.push(errorMsg);
            console.error(`[Meta Analysis] ${errorMsg}`);
          }
        }

        const duration = Date.now() - startTime;
        console.log(
          `[Meta Analysis] Completed: ${championsAnalyzed} champions, ${topPicksGenerated} top picks in ${duration}ms`
        );

        if (errors.length > 0) {
          sendAlert(
            AlertSeverity.MEDIUM,
            "Meta Analysis Completed with Errors",
            `Analyzed ${championsAnalyzed} champions with ${errors.length} errors`,
            "meta-analysis-worker",
            { errors }
          );
        }

        return { championsAnalyzed, topPicksGenerated, duration, errors };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Meta Analysis] Job failed:`, err);

        sendAlert(
          AlertSeverity.HIGH,
          "Meta Analysis Job Failed",
          errorMsg,
          "meta-analysis-worker",
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
    console.log(`[Meta Analysis] Job ${job.id} completed`);
    notifyJobCompleted(QUEUE_NAMES.META_ANALYSIS, job.id, result as unknown as Record<string, unknown>);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Meta Analysis] Job ${job?.id} failed:`, err);
    notifyJobFailed(QUEUE_NAMES.META_ANALYSIS, job?.id, err);
  });

  return worker;
}
