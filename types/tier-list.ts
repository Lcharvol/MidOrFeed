import type { ReactElement, SVGProps } from "react";
import type { ChampionEntity } from "./champions";

export interface WeakAgainstItem {
  enemyChampionId: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  lastPlayedAt: string;
}

export interface WinRateTrend {
  trend: "up" | "down" | "stable";
  change: number;
}

export interface TierListChampionStats {
  id: string;
  championId: string;
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgKDA: number;
  avgGoldEarned: number;
  avgGoldSpent: number;
  avgDamageDealt: number;
  avgDamageTaken: number;
  avgVisionScore: number;
  topRole: string | null;
  topLane: string | null;
  weakAgainst?: WeakAgainstItem[] | null;
  winRateTrend?: WinRateTrend | null;
  score: number;
  lastAnalyzedAt: string;
}

export type TierListChampion = ChampionEntity;

export interface TierListChampionWithStats extends TierListChampion {
  stats?: TierListChampionStats;
}

export type SortColumn =
  | "name"
  | "score"
  | "winRate"
  | "totalGames"
  | "avgKDA"
  | "avgKills"
  | "avgDeaths"
  | "avgAssists"
  | "avgDamageDealt"
  | "avgVisionScore";

export type SortDirection = "asc" | "desc" | null;

// RoleIconComponent re-export kept above for compatibility.
export type RoleIconComponent = (props: SVGProps<SVGSVGElement>) => ReactElement;

export type RoleKey =
  | "TOP"
  | "JUNGLE"
  | "MIDDLE"
  | "MID"
  | "BOTTOM"
  | "BOT"
  | "ADC"
  | "UTILITY"
  | "SUPPORT";

export interface RoleMeta {
  label: string;
  Icon: RoleIconComponent;
}

export interface RoleFilterOption {
  key: RoleKey;
  label: string;
  Icon: RoleIconComponent;
}

export interface TierListMetrics {
  totalMatches: number;
  formattedLastUpdated: string;
  championsCount: number;
}

export interface TierListState {
  searchTerm: string;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  roleFilter: RoleKey | "ALL";
  reliabilityOnly: boolean;
  eliteOnly: boolean;
}

export interface TierListDerivedData {
  championsWithStats: TierListChampionWithStats[];
  sortedChampions: TierListChampionWithStats[];
  filtersActive: boolean;
  isWinRateSort: boolean;
  isLoading: boolean;
  error: unknown;
}

// ---- Item Tier List ----

export interface ItemStatsData {
  id: string;
  itemId: string;
  totalGames: number;
  totalWins: number;
  winRate: number;
  pickRate: number;
  avgKDA: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  score: number;
  lastAnalyzedAt: string;
}

export interface ItemEntity {
  id: string;
  itemId: string;
  name: string;
  description: string | null;
  plaintext: string | null;
  image: string | null;
  gold: string | null;
  tags: string | null;
  depth: number | null;
  fromItems: string | null;
  maps: string | null;
  inStore: boolean | null;
  requiredChampion: string | null;
}

export interface ItemWithStats extends ItemEntity {
  stats?: ItemStatsData;
}

export type ItemSortColumn =
  | "name"
  | "score"
  | "winRate"
  | "pickRate"
  | "avgKDA"
  | "totalGames"
  | "gold";
