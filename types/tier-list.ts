import type { ReactElement, SVGProps } from "react";
import type { ChampionEntity } from "./champions";

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


