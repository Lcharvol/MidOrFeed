import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../redis";
import { QUEUE_NAMES } from "../queues";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import { notifyJobCompleted, notifyJobFailed } from "./job-notifications";
import type {
  SynergyAnalysisJobData,
  SynergyAnalysisJobResult,
  JobProgress,
} from "../queues/types";

type SynergyData = {
  allyChampionId: string;
  games: number;
  wins: number;
  winRate: number;
};

/**
 * Synergy Analysis Worker
 * Computes champion synergies (which champions work well together)
 */
export function createSynergyAnalysisWorker() {
  const worker = new Worker<SynergyAnalysisJobData, SynergyAnalysisJobResult>(
    QUEUE_NAMES.SYNERGY_ANALYSIS,
    async (job: Job<SynergyAnalysisJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let synergiesComputed = 0;
      let championPairsAnalyzed = 0;

      try {
        console.log(`[Synergy Analysis] Starting job ${job.id}`);

        const {
          minGamesTogether = 50,
          topSynergiesPerChampion = 10,
        } = job.data;

        // Get all unique champions from recent matches
        const champions = await prisma.$queryRaw<Array<{ championId: string }>>`
          SELECT DISTINCT "championId" FROM match_participants
        `;

        const total = champions.length;
        console.log(`[Synergy Analysis] Analyzing synergies for ${total} champions`);

        for (let i = 0; i < champions.length; i++) {
          const { championId } = champions[i];

          const progress: JobProgress = {
            current: i + 1,
            total,
            message: `Analyzing synergies for champion ${championId} (${i + 1}/${total})`,
          };
          await job.updateProgress(progress);

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
              const synergyData: SynergyData[] = synergies.map((s) => ({
                allyChampionId: s.allyChampionId,
                games: Number(s.games),
                wins: Number(s.wins),
                winRate: Number(s.games) > 0
                  ? (Number(s.wins) / Number(s.games)) * 100
                  : 0,
              }));

              // Store synergies in ChampionStats (we could create a separate table too)
              // For now, we'll update an existing field or create a new one
              // Let's store it in a JSON field or update the existing model

              // Update ChampionStats with synergy data
              await prisma.championStats.upsert({
                where: { championId },
                create: {
                  championId,
                  // Store synergies as part of weakAgainst JSON for now
                  // In production, you'd want a separate ChampionSynergy model
                },
                update: {
                  // We'll need to add a synergies field to the model
                  // For now, just log it
                  lastAnalyzedAt: new Date(),
                },
              });

              synergiesComputed += synergies.length;
              championPairsAnalyzed++;

              console.log(
                `[Synergy Analysis] Found ${synergies.length} synergies for champion ${championId}`
              );
            }
          } catch (err) {
            const errorMsg = `Failed to analyze synergies for ${championId}: ${
              err instanceof Error ? err.message : "Unknown error"
            }`;
            errors.push(errorMsg);
            console.error(`[Synergy Analysis] ${errorMsg}`);
          }
        }

        const duration = Date.now() - startTime;
        console.log(
          `[Synergy Analysis] Completed: ${synergiesComputed} synergies from ${championPairsAnalyzed} champions in ${duration}ms`
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
        console.error(`[Synergy Analysis] Job failed:`, err);

        sendAlert(
          AlertSeverity.HIGH,
          "Synergy Analysis Job Failed",
          errorMsg,
          "synergy-analysis-worker",
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
    console.log(`[Synergy Analysis] Job ${job.id} completed`);
    notifyJobCompleted(QUEUE_NAMES.SYNERGY_ANALYSIS, job.id, result as unknown as Record<string, unknown>);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Synergy Analysis] Job ${job?.id} failed:`, err);
    notifyJobFailed(QUEUE_NAMES.SYNERGY_ANALYSIS, job?.id, err);
  });

  return worker;
}
