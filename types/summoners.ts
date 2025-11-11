import type { ChampionId } from "./champions";
import type { MatchSummary } from "./matches";

export interface SummonerChampionStats {
  played: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
}

export type ChampionIdToStats = Record<ChampionId, SummonerChampionStats>;

export interface RoleStats {
  played: number;
  wins: number;
}

export type RoleId = string;
export type RoleIdToStats = Record<RoleId, RoleStats>;

export interface SummonerOverviewAggregate {
  totalGames: number;
  totalWins: number;
  winRate: string;
  avgKDA: string;
  totalKills: number;
  totalDeaths: number;
  totalAssists: number;
}

export interface SummonerOverviewMatchData {
  matches: MatchSummary[];
  stats: SummonerOverviewAggregate;
  championStats: ChampionIdToStats;
  roleStats: RoleIdToStats;
}


