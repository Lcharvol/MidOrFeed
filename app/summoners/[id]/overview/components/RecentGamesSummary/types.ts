import type { RecentMatchEntry } from "../RecentMatchesSection";

export interface SummaryStats {
  total: number;
  wins: number;
  losses: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kdaRatio: number;
  pKill: number;
}

export interface ChampionStat {
  championId: string;
  wins: number;
  losses: number;
  winRate: number;
  kdaRatio: number;
}

export interface RoleData {
  role: string;
  games: number;
  percentage: number;
}

export interface RecentGamesSummaryProps {
  matches: RecentMatchEntry[];
  championKeyToId: Map<string, string>;
  resolveSlug: (idOrKey: string) => string;
  rolePerformance?: Array<{
    role: string;
    stats: { played: number };
  }>;
}

