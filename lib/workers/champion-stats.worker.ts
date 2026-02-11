import { Job } from "pg-boss";
import { registerWorker, QUEUE_NAMES, updateJobProgress } from "../job-queue";
import { prisma } from "../prisma";
import { sendAlert, AlertSeverity } from "../alerting";
import { createLogger } from "../logger";
import type {
  ChampionStatsJobData,
  ChampionStatsJobResult,
} from "../queues/types";

const logger = createLogger("champion-stats-worker");

/**
 * Champion Stats Worker
 * Computes statistics for each champion from match data
 */
export async function createChampionStatsWorker() {
  return registerWorker<ChampionStatsJobData, ChampionStatsJobResult>(
    QUEUE_NAMES.CHAMPION_STATS,
    async (job: Job<ChampionStatsJobData>) => {
      const startTime = Date.now();
      const errors: string[] = [];
      let championsProcessed = 0;

      try {
        logger.info(`Starting job ${job.id}`);

        // Get all unique champion IDs from match participants
        const championIds = job.data.championIds?.length
          ? job.data.championIds.map(String)
          : await getUniqueChampionIds();

        const total = championIds.length;
        logger.info(`Processing ${total} champions`);

        // Process each champion
        for (let i = 0; i < championIds.length; i++) {
          const championId = championIds[i];

          await updateJobProgress(job.id, {
            current: i,
            total,
            message: `Processing champion ${i + 1}/${total}`,
          });

          try {
            await computeChampionStats(championId);
            championsProcessed++;
          } catch (err) {
            const errorMsg = `Failed to process champion ${championId}: ${
              err instanceof Error ? err.message : "Unknown error"
            }`;
            errors.push(errorMsg);
            logger.error(errorMsg);
          }
        }

        const duration = Date.now() - startTime;
        logger.info(`Completed: ${championsProcessed}/${total} champions in ${duration}ms`);

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
        logger.error(`Job failed: ${errorMsg}`);

        sendAlert(
          AlertSeverity.HIGH,
          "Champion Stats Job Failed",
          errorMsg,
          "champion-stats-worker"
        );

        throw err;
      }
    }
  );
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
  const winRate = (wins / totalGames) * 100;

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
  // Note: winRate is 0-100, so normalize to 0-1 for the score calculation
  const normalizedWinRate = winRate / 100;
  const score =
    totalGames >= 10
      ? (normalizedWinRate * 40 + normalizedKDA * 30 + normalizedDamage * 20 + normalizedVision * 10)
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
 * Get counter champions via a single SQL aggregation (no in-memory loading).
 * Returns the top 5 champions with highest win rate against this champion.
 */
async function getCounterChampions(
  championId: string
): Promise<Array<{
  enemyChampionId: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  lastPlayedAt: string;
}>> {
  const counters = await prisma.$queryRaw<
    Array<{
      enemyChampionId: string;
      games: bigint;
      enemyWins: bigint;
      enemyLosses: bigint;
      lastPlayedAt: Date;
    }>
  >`
    SELECT
      enemy."championId" AS "enemyChampionId",
      COUNT(*) AS games,
      SUM(CASE WHEN enemy.win THEN 1 ELSE 0 END) AS "enemyWins",
      SUM(CASE WHEN enemy.win THEN 0 ELSE 1 END) AS "enemyLosses",
      MAX(enemy."createdAt") AS "lastPlayedAt"
    FROM match_participants mp
    JOIN match_participants enemy
      ON mp."matchId" = enemy."matchId"
      AND mp."teamId" != enemy."teamId"
    WHERE mp."championId" = ${championId}
      AND enemy."championId" != ${championId}
    GROUP BY enemy."championId"
    HAVING COUNT(*) >= 5
    ORDER BY SUM(CASE WHEN enemy.win THEN 1 ELSE 0 END)::float / COUNT(*) DESC
    LIMIT 5
  `;

  return counters.map((c) => {
    const games = Number(c.games);
    const wins = Number(c.enemyWins);
    const losses = Number(c.enemyLosses);
    return {
      enemyChampionId: c.enemyChampionId,
      games,
      wins,
      losses,
      winRate: wins / games,
      lastPlayedAt: c.lastPlayedAt.toISOString(),
    };
  });
}
