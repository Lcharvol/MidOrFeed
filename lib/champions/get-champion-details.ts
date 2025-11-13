import type { Champion, ChampionStats } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ChampionEntity, TierListChampionStats } from "@/types";

export type ChampionDetails = {
  champion: ChampionEntity & {
    createdAtIso: string;
    updatedAtIso: string;
  };
  stats?: TierListChampionStats;
};

const toChampionEntity = (record: Champion): ChampionEntity => ({
  id: record.id,
  championId: record.championId,
  championKey: record.championKey ?? undefined,
  name: record.name,
  title: record.title,
  blurb: record.blurb,
  attack: record.attack,
  defense: record.defense,
  magic: record.magic,
  difficulty: record.difficulty,
  hp: record.hp,
  hpPerLevel: record.hpPerLevel,
  mp: record.mp,
  mpPerLevel: record.mpPerLevel,
  moveSpeed: record.moveSpeed,
  armor: record.armor,
  armorPerLevel: record.armorPerLevel,
  spellBlock: record.spellBlock,
  spellBlockPerLevel: record.spellBlockPerLevel,
  attackRange: record.attackRange,
  hpRegen: record.hpRegen,
  hpRegenPerLevel: record.hpRegenPerLevel,
  mpRegen: record.mpRegen,
  mpRegenPerLevel: record.mpRegenPerLevel,
  crit: record.crit,
  critPerLevel: record.critPerLevel,
  attackDamage: record.attackDamage,
  attackDamagePerLevel: record.attackDamagePerLevel,
  attackSpeed: record.attackSpeed,
  attackSpeedPerLevel: record.attackSpeedPerLevel,
});

const normalizeStats = (record: ChampionStats | null): TierListChampionStats | undefined => {
  if (!record) return undefined;
  return {
    id: record.id,
    championId: record.championId,
    totalGames: Number(record.totalGames),
    totalWins: Number(record.totalWins),
    totalLosses: Number(record.totalLosses),
    winRate: Number(record.winRate),
    avgKills: Number(record.avgKills),
    avgDeaths: Number(record.avgDeaths),
    avgAssists: Number(record.avgAssists),
    avgKDA: Number(record.avgKDA),
    avgGoldEarned: Number(record.avgGoldEarned),
    avgGoldSpent: Number(record.avgGoldSpent),
    avgDamageDealt: Number(record.avgDamageDealt),
    avgDamageTaken: Number(record.avgDamageTaken),
    avgVisionScore: Number(record.avgVisionScore),
    topRole: record.topRole,
    topLane: record.topLane,
    score: Number(record.score),
    lastAnalyzedAt: record.lastAnalyzedAt?.toISOString() ?? new Date().toISOString(),
  } satisfies TierListChampionStats;
};

const buildChampionDetails = (record: Champion, stats: ChampionStats | null): ChampionDetails => ({
  champion: {
    ...toChampionEntity(record),
    createdAtIso: record.createdAt.toISOString(),
    updatedAtIso: record.updatedAt.toISOString(),
  },
  stats: normalizeStats(stats),
});

export const getChampionDetails = async (identifier: string): Promise<ChampionDetails | null> => {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  const championById = await prisma.champion.findFirst({
    where: { championId: { equals: identifier, mode: "insensitive" } },
  });

  if (championById) {
    const statsRecord = await prisma.championStats.findUnique({
      where: { championId: championById.championId },
    });
    return buildChampionDetails(championById, statsRecord);
  }

  const formattedName = identifier.replace(/-/g, " ");
  const championByName = await prisma.champion.findFirst({
    where: { name: { equals: formattedName, mode: "insensitive" } },
  });

  if (!championByName) {
    return null;
  }

  const statsRecord = await prisma.championStats.findUnique({
    where: { championId: championByName.championId },
  });

  return buildChampionDetails(championByName, statsRecord);
};
