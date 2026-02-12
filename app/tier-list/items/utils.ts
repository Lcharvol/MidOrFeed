import type { ItemStatsData } from "@/types";

// Re-export shared utilities from champion tier list
export {
  TIER_ROW_CONFIG,
  getTierBadgeEmphasis,
  getScoreEmphasis,
  getWinRateEmphasis,
  formatPercentage,
  formatNumber,
  formatKDA,
  clampNumber,
  toFiniteNumber,
  computeReliabilityRatio,
} from "../champions/utils";

import { clampNumber, toFiniteNumber, computeReliabilityRatio } from "../champions/utils";

export const ITEM_MIN_APPEARANCES = 50;

export const ITEM_TAG_OPTIONS = [
  { value: "Damage", label: "Damage" },
  { value: "AttackSpeed", label: "Attack Speed" },
  { value: "SpellDamage", label: "Spell Damage" },
  { value: "Armor", label: "Armor" },
  { value: "SpellBlock", label: "Magic Resist" },
  { value: "Health", label: "Health" },
  { value: "Mana", label: "Mana" },
  { value: "LifeSteal", label: "Life Steal" },
  { value: "CriticalStrike", label: "Critical Strike" },
  { value: "Boots", label: "Boots" },
  { value: "Jungle", label: "Jungle" },
  { value: "OnHit", label: "On-Hit" },
  { value: "CooldownReduction", label: "CDR" },
  { value: "ManaRegen", label: "Mana Regen" },
  { value: "HealthRegen", label: "Health Regen" },
] as const;

export const parseGoldTotal = (gold: string | null): number => {
  if (!gold) return 0;
  try {
    const parsed = JSON.parse(gold);
    return parsed.total ?? 0;
  } catch {
    return 0;
  }
};

export const parseItemTags = (tags: string | null): string[] => {
  if (!tags) return [];
  try {
    return JSON.parse(tags);
  } catch {
    return [];
  }
};

const computeWinRateComponent = (winRate: number) => {
  if (!Number.isFinite(winRate)) return 0;
  if (winRate >= 54) return 35 + (winRate - 54) * 3;
  if (winRate >= 50) return 15 + (winRate - 50) * 5;
  return (winRate - 50) * 4;
};

const computeKdaComponent = (avgKDA: number | null | undefined) =>
  Number.isFinite(avgKDA) ? clampNumber((Number(avgKDA) - 2) * 3, 0, 12) : 0;

export const computeItemScore = (stats?: ItemStatsData): number | null => {
  if (!stats) return null;
  const baseScore = clampNumber(toFiniteNumber(stats.score), 0, 100);
  const winRateScore = computeWinRateComponent(toFiniteNumber(stats.winRate));
  const reliabilityScore = computeReliabilityRatio(stats.totalGames ?? 0) * 15;
  const kdaScore = computeKdaComponent(stats.avgKDA);
  const composite =
    baseScore * 0.45 + winRateScore * 1 + reliabilityScore + kdaScore;
  return clampNumber(composite, 0, 100);
};

export const resolveItemTier = (stats?: ItemStatsData) => {
  if (!stats) return "-";
  if (stats.totalGames < ITEM_MIN_APPEARANCES) return "-";
  const tierScore = computeItemScore(stats) ?? 0;
  const winRate = toFiniteNumber(stats.winRate);
  if (winRate >= 58 || tierScore >= 88) return "S+";
  if (winRate >= 54 || tierScore >= 80) return "S";
  if (winRate >= 52 || tierScore >= 72) return "A";
  if (winRate >= 50 || tierScore >= 64) return "B";
  if (winRate >= 48 || tierScore >= 56) return "C";
  return "D";
};
