import {
  MountainIcon,
  TreePineIcon,
  SwordsIcon,
  TargetIcon,
  SparklesIcon,
} from "lucide-react";
import type {
  RoleFilterOption,
  RoleKey,
  RoleMeta,
  TierListChampionStats,
} from "@/types";
import { MATCHES_FETCH_LIMIT } from "@/constants/matches";

export const PATCH_VERSION = "15.21" as const;

export const ROLE_META: Record<RoleKey, RoleMeta> = {
  TOP: { label: "Top", Icon: MountainIcon },
  JUNGLE: { label: "Jungle", Icon: TreePineIcon },
  MIDDLE: { label: "Mid", Icon: SwordsIcon },
  MID: { label: "Mid", Icon: SwordsIcon },
  BOTTOM: { label: "Bot", Icon: TargetIcon },
  BOT: { label: "Bot", Icon: TargetIcon },
  ADC: { label: "Bot", Icon: TargetIcon },
  UTILITY: { label: "Support", Icon: SparklesIcon },
  SUPPORT: { label: "Support", Icon: SparklesIcon },
};

export const ROLE_FILTER_OPTIONS: RoleFilterOption[] = [
  { key: "TOP", label: "Top", Icon: MountainIcon },
  { key: "JUNGLE", label: "Jungle", Icon: TreePineIcon },
  { key: "MID", label: "Mid", Icon: SwordsIcon },
  { key: "BOT", label: "Bot", Icon: TargetIcon },
  { key: "SUPPORT", label: "Support", Icon: SparklesIcon },
];

export const fetcher = async <T>(url: string): Promise<T> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Erreur lors de la récupération des données");
  }
  return response.json();
};

export const normalizeRoleKey = (role?: string | null): RoleKey | undefined => {
  if (!role) return undefined;
  const upper = role.toUpperCase();
  if (upper === "MIDDLE" || upper === "MID") return "MID";
  if (upper === "BOTTOM" || upper === "BOT" || upper === "ADC") return "BOT";
  if (upper === "UTILITY" || upper === "SUPPORT") return "SUPPORT";
  if (upper === "JUNGLE") return "JUNGLE";
  if (upper === "TOP") return "TOP";
  return undefined;
};

export const getRoleMeta = (role?: string | null): RoleMeta =>
  ROLE_META[normalizeRoleKey(role) ?? "SUPPORT"];

export const clampNumber = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export const toFiniteNumber = (value: number | null | undefined) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

const RELIABILITY_TARGET_MATCHES = 60;

export const computeReliabilityRatio = (games: number) =>
  games <= 0 ? 0 : clampNumber(games / RELIABILITY_TARGET_MATCHES, 0, 1);

export const computeWinRateComponent = (winRate: number) => {
  if (!Number.isFinite(winRate)) return 0;
  if (winRate >= 54) return 35 + (winRate - 54) * 3;
  if (winRate >= 50) return 15 + (winRate - 50) * 5;
  return (winRate - 50) * 4;
};

export const computeKdaComponent = (avgKDA: number | null | undefined) =>
  Number.isFinite(avgKDA) ? clampNumber((Number(avgKDA) - 2) * 3, 0, 12) : 0;

export const computeChampionScore = (
  stats?: TierListChampionStats
): number | null => {
  if (!stats) return null;
  const baseScore = clampNumber(toFiniteNumber(stats.score), 0, 100);
  const winRateScore = computeWinRateComponent(toFiniteNumber(stats.winRate));
  const reliabilityScore = computeReliabilityRatio(stats.totalGames ?? 0) * 15;
  const kdaScore = computeKdaComponent(stats.avgKDA);
  const composite =
    baseScore * 0.45 + winRateScore * 1 + reliabilityScore + kdaScore;
  return clampNumber(composite, 0, 100);
};

export const resolveTier = (stats?: TierListChampionStats) => {
  if (!stats) return "-";
  const games = stats.totalGames ?? 0;
  if (games < MATCHES_FETCH_LIMIT) return "-";
  const tierScore = computeChampionScore(stats) ?? 0;
  const winRate = toFiniteNumber(stats.winRate);
  if (winRate >= 58 || tierScore >= 88) return "S+";
  if (winRate >= 54 || tierScore >= 80) return "S";
  if (winRate >= 52 || tierScore >= 72) return "A";
  if (winRate >= 50 || tierScore >= 64) return "B";
  if (winRate >= 48 || tierScore >= 56) return "C";
  return "D";
};

export const getTierBadgeEmphasis = (tier: string) => {
  if (tier === "S+" || tier === "S") return "positive";
  if (tier === "A") return "info";
  if (tier === "B") return "neutral";
  if (tier === "C") return "warning";
  if (tier === "D") return "danger";
  return "neutral";
};

export const getScoreEmphasis = (score?: number | null) => {
  if (!score && score !== 0) return "neutral";
  if (score >= 85) return "positive";
  if (score >= 70) return "info";
  if (score >= 60) return "warning";
  if (score >= 50) return "warning";
  return "danger";
};

export const getWinRateEmphasis = (winRate?: number) => {
  if (!winRate && winRate !== 0) return "neutral";
  if (winRate >= 56) return "positive";
  if (winRate >= 52) return "info";
  if (winRate >= 50) return "warning";
  return "danger";
};

export const formatPercentage = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)}%`;
};

export const formatNumber = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString("fr-FR");
};

export const formatKDA = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return value.toFixed(2);
};
