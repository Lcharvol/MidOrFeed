import { Job } from "pg-boss";
import { registerWorker, QUEUE_NAMES, updateJobProgress } from "../job-queue";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import { createLogger } from "../logger";
import { invalidateCachePrefix } from "../cache";
import type {
  AnalyzeItemsJobData,
  AnalyzeItemsJobResult,
} from "../queues/types";

const logger = createLogger("analyze-items-worker");

const SUMMONERS_RIFT_MAP_ID = 11;
const MIN_GAMES_FOR_SCORE = 10;

/**
 * Analyze Items Worker
 * Computes global item statistics (winrate, pickrate, score) for the item tier list
 */
export async function createAnalyzeItemsWorker() {
  return registerWorker<AnalyzeItemsJobData, AnalyzeItemsJobResult>(
    QUEUE_NAMES.ANALYZE_ITEMS,
    async (job: Job<AnalyzeItemsJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];

      try {
        logger.info(`Starting job ${job.id}`);

        const { matchLimit } = job.data;

        await updateJobProgress(job.id, {
          current: 0,
          total: 4,
          message: "Fetching match participants",
        });

        // Fetch matches on Summoner's Rift only
        let matchIds: string[] | null = null;
        if (matchLimit && matchLimit > 0) {
          const clamped = Math.min(Math.max(Math.round(matchLimit), 50), 1000);
          const latestMatches = await prisma.match.findMany({
            select: { id: true },
            where: { mapId: SUMMONERS_RIFT_MAP_ID },
            orderBy: { gameCreation: "desc" },
            take: clamped,
          });
          matchIds = latestMatches.map((m) => m.id);
        }

        const participants = await prisma.matchParticipant.findMany({
          select: {
            win: true,
            kills: true,
            deaths: true,
            assists: true,
            item0: true,
            item1: true,
            item2: true,
            item3: true,
            item4: true,
            item5: true,
            item6: true,
          },
          where: {
            ...(matchIds
              ? { matchId: { in: matchIds } }
              : { match: { mapId: SUMMONERS_RIFT_MAP_ID } }),
          },
          take: matchIds ? undefined : 50000,
        });

        if (participants.length === 0) {
          logger.warn("No participants found on Summoner's Rift");
          return {
            totalItems: 0,
            totalParticipants: 0,
            totalMatches: 0,
            created: 0,
            updated: 0,
            duration: Date.now() - startTime,
            errors: ["No participants found on Summoner's Rift"],
          };
        }

        const totalMatches = matchIds
          ? matchIds.length
          : await prisma.match.count({ where: { mapId: SUMMONERS_RIFT_MAP_ID } });

        await updateJobProgress(job.id, {
          current: 1,
          total: 4,
          message: `Aggregating stats from ${participants.length} participants`,
        });

        // Aggregate stats by itemId
        const statsByItem = new Map<
          string,
          { games: number; wins: number; kills: number; deaths: number; assists: number }
        >();

        for (const p of participants) {
          const items = new Set<number>();
          for (const slot of [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6]) {
            if (slot && slot > 0) items.add(slot);
          }

          for (const itemId of items) {
            const key = String(itemId);
            const existing = statsByItem.get(key) ?? {
              games: 0,
              wins: 0,
              kills: 0,
              deaths: 0,
              assists: 0,
            };

            existing.games++;
            if (p.win) existing.wins++;
            existing.kills += p.kills;
            existing.deaths += p.deaths;
            existing.assists += p.assists;

            statsByItem.set(key, existing);
          }
        }

        await updateJobProgress(job.id, {
          current: 2,
          total: 4,
          message: `Computing scores for ${statsByItem.size} items`,
        });

        // Compute normalized scores
        const allStats = Array.from(statsByItem.entries()).map(([itemId, stats]) => {
          const winRate = stats.games > 0 ? (stats.wins / stats.games) * 100 : 0;
          const pickRate = totalMatches > 0 ? (stats.games / totalMatches) * 100 : 0;
          const avgKDA =
            stats.deaths > 0
              ? (stats.kills + stats.assists) / stats.deaths
              : stats.kills + stats.assists;

          return { itemId, stats, winRate, pickRate, avgKDA };
        });

        // Normalization bounds (only reliable items)
        const reliable = allStats.filter((s) => s.stats.games >= MIN_GAMES_FOR_SCORE);

        const maxWR = Math.max(...reliable.map((s) => s.winRate), 100);
        const minWR = Math.min(...reliable.map((s) => s.winRate), 0);
        const maxPR = Math.max(...reliable.map((s) => s.pickRate), 100);
        const minPR = Math.min(...reliable.map((s) => s.pickRate), 0);
        const maxKDA = Math.max(...reliable.map((s) => s.avgKDA), 5);
        const minKDA = Math.min(...reliable.map((s) => s.avgKDA), 0);

        const normalize = (value: number, min: number, max: number) => {
          if (max === min) return 50;
          return Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
        };

        await updateJobProgress(job.id, {
          current: 3,
          total: 4,
          message: `Upserting ${allStats.length} item stats`,
        });

        // Upsert all item stats in batched transactions
        let created = 0;
        let updated = 0;
        const now = new Date();

        const BATCH_SIZE = 50;
        for (let batchStart = 0; batchStart < allStats.length; batchStart += BATCH_SIZE) {
          const batch = allStats.slice(batchStart, batchStart + BATCH_SIZE);
          try {
            const results = await prisma.$transaction(
              batch.map(({ itemId, stats, winRate, pickRate, avgKDA }) => {
                let score = 0;
                if (stats.games >= MIN_GAMES_FOR_SCORE) {
                  score =
                    normalize(winRate, minWR, maxWR) * 0.4 +
                    normalize(pickRate, minPR, maxPR) * 0.3 +
                    normalize(avgKDA, minKDA, maxKDA) * 0.3;
                }

                const data = {
                  totalGames: stats.games,
                  totalWins: stats.wins,
                  winRate,
                  pickRate,
                  avgKDA,
                  avgKills: stats.games > 0 ? stats.kills / stats.games : 0,
                  avgDeaths: stats.games > 0 ? stats.deaths / stats.games : 0,
                  avgAssists: stats.games > 0 ? stats.assists / stats.games : 0,
                  score,
                  lastAnalyzedAt: now,
                };

                return prisma.itemStats.upsert({
                  where: { itemId },
                  update: data,
                  create: { itemId, ...data },
                  select: { createdAt: true, updatedAt: true },
                });
              })
            );

            for (const result of results) {
              if (result.createdAt.getTime() === result.updatedAt.getTime()) {
                created++;
              } else {
                updated++;
              }
            }
          } catch (err) {
            errors.push(`Failed to upsert batch at ${batchStart}: ${err instanceof Error ? err.message : "Unknown"}`);
          }
        }

        // Invalidate server-side cache so fresh data is served immediately
        invalidateCachePrefix("items:");

        const duration = Date.now() - startTime;
        logger.info(
          `Completed: ${statsByItem.size} items (${created} created, ${updated} updated) from ${participants.length} participants in ${duration}ms`
        );

        if (errors.length > 0) {
          sendAlert(
            AlertSeverity.MEDIUM,
            "Analyze Items Completed with Errors",
            `Processed ${statsByItem.size} items with ${errors.length} errors`,
            "analyze-items-worker",
            { errors: errors.slice(0, 5) }
          );
        }

        return {
          totalItems: statsByItem.size,
          totalParticipants: participants.length,
          totalMatches,
          created,
          updated,
          duration,
          errors,
        };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        logger.error(`Job failed: ${errorMsg}`);

        sendAlert(
          AlertSeverity.HIGH,
          "Analyze Items Job Failed",
          errorMsg,
          "analyze-items-worker",
          { jobId: job.id }
        );

        throw err;
      }
    }
  );
}
