import { Worker, Job } from "bullmq";
import { getRedisConnection } from "../redis";
import { QUEUE_NAMES } from "../queues";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import type {
  ChampionStatsJobData,
  ChampionStatsJobResult,
  JobProgress,
} from "../queues/types";

/**
 * Champion Stats Worker
 * Computes statistics for each champion from match data
 */
export function createChampionStatsWorker() {
  const worker = new Worker<ChampionStatsJobData, ChampionStatsJobResult>(
    QUEUE_NAMES.CHAMPION_STATS,
    async (job: Job<ChampionStatsJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let championsProcessed = 0;

      try {
        console.log(`[Champion Stats] Starting job ${job.id}`);

        // Get all unique champion IDs from match participants
        const championIds = job.data.championIds?.length
          ? job.data.championIds.map(String)
          : await getUniqueChampionIds();

        const total = championIds.length;
        console.log(`[Champion Stats] Processing ${total} champions`);

        // Process each champion
        for (let i = 0; i < championIds.length; i++) {
          const championId = championIds[i];

          try {
            await computeChampionStats(championId);
            championsProcessed++;

            // Report progress
            const progress: JobProgress = {
              current: i + 1,
              total,
              message: `Processing champion ${championId} (${i + 1}/${total})`,
            };
            await job.updateProgress(progress);
          } catch (err) {
            const errorMsg = `Failed to process champion ${championId}: ${
              err instanceof Error ? err.message : "Unknown error"
            }`;
            errors.push(errorMsg);
            console.error(`[Champion Stats] ${errorMsg}`);
          }
        }

        const duration = Date.now() - startTime;
        console.log(
          `[Champion Stats] Completed: ${championsProcessed}/${total} champions in ${duration}ms`
        );

        // Send alert if there were errors
        if (errors.length > 0) {
          sendAlert(
            AlertSeverity.MEDIUM,
            "Champion Stats Job Completed with Errors",
            `Processed ${championsProcessed}/${total} champions with ${errors.length} errors`,
            "champion-stats-worker",
            { errors: errors.slice(0, 5) }
          );
        }

        return { championsProcessed, duration, errors };
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error";
        console.error(`[Champion Stats] Job failed:`, err);

        sendAlert(
          AlertSeverity.HIGH,
          "Champion Stats Job Failed",
          errorMsg,
          "champion-stats-worker"
        );

        throw err;
      }
    },
    {
      ...getRedisConnection(),
      concurrency: 1, // Process one job at a time
    }
  );

  worker.on("completed", (job) => {
    console.log(`[Champion Stats] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    console.error(`[Champion Stats] Job ${job?.id} failed:`, err);
  });

  return worker;
}

/**
 * Get all unique champion IDs from match participants
 */
async function getUniqueChampionIds(): Promise<string[]> {
  const result = await prisma.matchParticipant.findMany({
    select: { championId: true },
    distinct: ["championId"],
  });
  return result.map((r) => r.championId);
}

/**
 * Compute and save stats for a single champion
 */
async function computeChampionStats(championId: string): Promise<void> {
  // 1. Get aggregate stats
  const stats = await prisma.matchParticipant.aggregate({
    where: { championId },
    _count: { _all: true },
    _sum: {
      kills: true,
      deaths: true,
      assists: true,
      goldEarned: true,
      goldSpent: true,
      totalDamageDealtToChampions: true,
      totalDamageTaken: true,
      visionScore: true,
    },
  });

  const totalGames = stats._count._all;
  if (totalGames === 0) return;

  // 2. Count wins
  const wins = await prisma.matchParticipant.count({
    where: { championId, win: true },
  });

  // 3. Calculate averages
  const avgKills = (stats._sum.kills || 0) / totalGames;
  const avgDeaths = (stats._sum.deaths || 0) / totalGames;
  const avgAssists = (stats._sum.assists || 0) / totalGames;
  const avgKDA = avgDeaths > 0 ? (avgKills + avgAssists) / avgDeaths : avgKills + avgAssists;
  const winRate = wins / totalGames;

  // 4. Get most played role/lane
  const roleStats = await prisma.matchParticipant.groupBy({
    by: ["role"],
    where: { championId, role: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { role: "desc" } },
    take: 1,
  });

  const laneStats = await prisma.matchParticipant.groupBy({
    by: ["lane"],
    where: { championId, lane: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { lane: "desc" } },
    take: 1,
  });

  // 5. Calculate counters (champions with highest win rate against this champion)
  const counters = await getCounterChampions(championId);

  // 6. Calculate composite score (0-100)
  // 40% win rate + 30% KDA + 20% damage + 10% vision
  const maxKDA = 5; // Normalize KDA to max of 5
  const maxDamage = 30000; // Normalize damage
  const maxVision = 50; // Normalize vision score

  const normalizedKDA = Math.min(avgKDA / maxKDA, 1);
  const normalizedDamage = Math.min(
    (stats._sum.totalDamageDealtToChampions || 0) / totalGames / maxDamage,
    1
  );
  const normalizedVision = Math.min(
    (stats._sum.visionScore || 0) / totalGames / maxVision,
    1
  );

  // Only score champions with enough games
  const score =
    totalGames >= 10
      ? (winRate * 40 + normalizedKDA * 30 + normalizedDamage * 20 + normalizedVision * 10)
      : 0;

  // 7. Upsert champion stats
  await prisma.championStats.upsert({
    where: { championId },
    create: {
      championId,
      totalGames,
      totalWins: wins,
      totalLosses: totalGames - wins,
      winRate,
      avgKills,
      avgDeaths,
      avgAssists,
      avgKDA,
      avgGoldEarned: (stats._sum.goldEarned || 0) / totalGames,
      avgGoldSpent: (stats._sum.goldSpent || 0) / totalGames,
      avgDamageDealt: (stats._sum.totalDamageDealtToChampions || 0) / totalGames,
      avgDamageTaken: (stats._sum.totalDamageTaken || 0) / totalGames,
      avgVisionScore: (stats._sum.visionScore || 0) / totalGames,
      topRole: roleStats[0]?.role || null,
      topLane: laneStats[0]?.lane || null,
      weakAgainst: counters,
      score,
      lastAnalyzedAt: new Date(),
    },
    update: {
      totalGames,
      totalWins: wins,
      totalLosses: totalGames - wins,
      winRate,
      avgKills,
      avgDeaths,
      avgAssists,
      avgKDA,
      avgGoldEarned: (stats._sum.goldEarned || 0) / totalGames,
      avgGoldSpent: (stats._sum.goldSpent || 0) / totalGames,
      avgDamageDealt: (stats._sum.totalDamageDealtToChampions || 0) / totalGames,
      avgDamageTaken: (stats._sum.totalDamageTaken || 0) / totalGames,
      avgVisionScore: (stats._sum.visionScore || 0) / totalGames,
      topRole: roleStats[0]?.role || null,
      topLane: laneStats[0]?.lane || null,
      weakAgainst: counters,
      score,
      lastAnalyzedAt: new Date(),
    },
  });

  // 8. Record win rate history for trends
  await prisma.championWinRateHistory.create({
    data: {
      championId,
      winRate,
      totalGames,
      totalWins: wins,
      totalLosses: totalGames - wins,
    },
  });
}

/**
 * Get counter champions (champions that beat this champion most often)
 */
async function getCounterChampions(
  championId: string
): Promise<Array<{ championId: string; lossRate: number; games: number }>> {
  // Get all matches where this champion lost
  const losses = await prisma.matchParticipant.findMany({
    where: { championId, win: false },
    select: { matchId: true, teamId: true },
  });

  if (losses.length === 0) return [];

  // Count opponent champions in those matches
  const opponentCounts: Record<string, { wins: number; total: number }> = {};

  // Process in batches to avoid memory issues
  const batchSize = 100;
  for (let i = 0; i < losses.length; i += batchSize) {
    const batch = losses.slice(i, i + batchSize);
    const matchIds = batch.map((l) => l.matchId);

    const opponents = await prisma.matchParticipant.findMany({
      where: {
        matchId: { in: matchIds },
        championId: { not: championId },
        teamId: { notIn: batch.map((l) => l.teamId) },
      },
      select: { championId: true, matchId: true, win: true },
    });

    for (const opp of opponents) {
      if (!opponentCounts[opp.championId]) {
        opponentCounts[opp.championId] = { wins: 0, total: 0 };
      }
      opponentCounts[opp.championId].total++;
      if (opp.win) {
        opponentCounts[opp.championId].wins++;
      }
    }
  }

  // Calculate loss rates and sort
  const counters = Object.entries(opponentCounts)
    .filter(([, stats]) => stats.total >= 5) // Minimum 5 games
    .map(([oppChampionId, stats]) => ({
      championId: oppChampionId,
      lossRate: stats.wins / stats.total,
      games: stats.total,
    }))
    .sort((a, b) => b.lossRate - a.lossRate)
    .slice(0, 5); // Top 5 counters

  return counters;
}
