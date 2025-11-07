import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Aggregate = {
  games: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
  goldEarned: number;
  goldSpent: number;
  damageDealt: number;
  damageTaken: number;
  visionScore: number;
  roles: Map<string, number>;
  lanes: Map<string, number>;
};

const normalize = (value: number, min: number, max: number): number => {
  if (Number.isNaN(value)) {
    return 0;
  }
  if (max === min) {
    return 50;
  }
  const ratio = (value - min) / (max - min);
  return Math.max(0, Math.min(100, ratio * 100));
};

const resolveBounds = (
  values: ReadonlyArray<number>,
  fallbackMin: number,
  fallbackMax: number
): [number, number] => {
  if (values.length === 0) {
    return [fallbackMin, fallbackMax];
  }
  return [Math.min(...values), Math.max(...values)];
};

const run = async (): Promise<void> => {
  console.log("[ANALYZE-CHAMPIONS] Début de l'analyse (local)");

  const participants = await prisma.matchParticipant.findMany({
    select: {
      championId: true,
      win: true,
      kills: true,
      deaths: true,
      assists: true,
      goldEarned: true,
      goldSpent: true,
      totalDamageDealtToChampions: true,
      totalDamageTaken: true,
      visionScore: true,
      role: true,
      lane: true,
    },
  });

  if (participants.length === 0) {
    console.log("Aucun participant trouvé.");
    return;
  }

  const statsByChampion = new Map<string, Aggregate>();

  participants.forEach((p) => {
    const current = statsByChampion.get(p.championId) ?? {
      games: 0,
      wins: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
      goldEarned: 0,
      goldSpent: 0,
      damageDealt: 0,
      damageTaken: 0,
      visionScore: 0,
      roles: new Map<string, number>(),
      lanes: new Map<string, number>(),
    };

    current.games += 1;
    if (p.win) {
      current.wins += 1;
    }
    current.kills += p.kills;
    current.deaths += p.deaths;
    current.assists += p.assists;
    current.goldEarned += p.goldEarned;
    current.goldSpent += p.goldSpent;
    current.damageDealt += p.totalDamageDealtToChampions;
    current.damageTaken += p.totalDamageTaken;
    current.visionScore += p.visionScore;

    if (p.role) {
      current.roles.set(p.role, (current.roles.get(p.role) ?? 0) + 1);
    }
    if (p.lane) {
      current.lanes.set(p.lane, (current.lanes.get(p.lane) ?? 0) + 1);
    }

    statsByChampion.set(p.championId, current);
  });

  const aggregates = Array.from(statsByChampion.entries()).map(
    ([championId, stats]) => {
      const games = stats.games;
      const winRate = games > 0 ? (stats.wins / games) * 100 : 0;
      const avgKDA =
        stats.deaths > 0
          ? (stats.kills + stats.assists) / stats.deaths
          : stats.kills + stats.assists;
      const avgDamageDealt = games > 0 ? stats.damageDealt / games : 0;
      const avgVisionScore = games > 0 ? stats.visionScore / games : 0;

      return {
        championId,
        stats,
        winRate,
        avgKDA,
        avgDamageDealt,
        avgVisionScore,
      };
    }
  );

  const reliable = aggregates.filter((item) => item.stats.games >= 10);

  const [minWinRate, maxWinRate] = resolveBounds(
    reliable.map((item) => item.winRate),
    0,
    100
  );
  const [minKDA, maxKDA] = resolveBounds(
    reliable.map((item) => item.avgKDA),
    0,
    5
  );
  const [minDamage, maxDamage] = resolveBounds(
    reliable.map((item) => item.avgDamageDealt),
    0,
    50000
  );
  const [minVision, maxVision] = resolveBounds(
    reliable.map((item) => item.avgVisionScore),
    0,
    100
  );

  let created = 0;
  let updated = 0;

  for (const aggregate of aggregates) {
    const {
      championId,
      stats,
      winRate,
      avgKDA,
      avgDamageDealt,
      avgVisionScore,
    } = aggregate;

    let score = 0;
    if (stats.games >= 10) {
      const normalizedWin = normalize(winRate, minWinRate, maxWinRate);
      const normalizedKda = normalize(avgKDA, minKDA, maxKDA);
      const normalizedDamage = normalize(avgDamageDealt, minDamage, maxDamage);
      const normalizedVision = normalize(avgVisionScore, minVision, maxVision);

      score =
        normalizedWin * 0.4 +
        normalizedKda * 0.3 +
        normalizedDamage * 0.2 +
        normalizedVision * 0.1;
    }

    let topRole: string | null = null;
    let topLane: string | null = null;
    let maxRoleCount = 0;
    let maxLaneCount = 0;

    stats.roles.forEach((count, role) => {
      if (count > maxRoleCount) {
        maxRoleCount = count;
        topRole = role;
      }
    });

    stats.lanes.forEach((count, lane) => {
      if (count > maxLaneCount) {
        maxLaneCount = count;
        topLane = lane;
      }
    });

    const payload = {
      totalGames: stats.games,
      totalWins: stats.wins,
      totalLosses: stats.games - stats.wins,
      winRate,
      avgKills: stats.kills / stats.games,
      avgDeaths: stats.deaths / stats.games,
      avgAssists: stats.assists / stats.games,
      avgKDA,
      avgGoldEarned: stats.goldEarned / stats.games,
      avgGoldSpent: stats.goldSpent / stats.games,
      avgDamageDealt: stats.damageDealt / stats.games,
      avgDamageTaken: stats.damageTaken / stats.games,
      avgVisionScore: stats.visionScore / stats.games,
      topRole,
      topLane,
      score,
      lastAnalyzedAt: new Date(),
    } as const;

    const existing = await prisma.championStats.findUnique({
      where: { championId },
    });

    if (existing) {
      await prisma.championStats.update({
        where: { championId },
        data: payload,
      });
      updated += 1;
    } else {
      await prisma.championStats.create({
        data: {
          championId,
          ...payload,
        },
      });
      created += 1;
    }
  }

  console.log(
    `[ANALYZE-CHAMPIONS] Terminé: ${created} créés, ${updated} mis à jour (participants: ${participants.length})`
  );
};

run()
  .catch((error) => {
    console.error("[ANALYZE-CHAMPIONS] Erreur:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
