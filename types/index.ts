// Domain types centralization
// Keep this small and composable; prefer composition over inheritance.

// Utility
export type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };

// Riot/LoL domain
export type ChampionId = string; // DDragon champion key/name id used across the app

export interface ChampionStats {
  played: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
}

export type ChampionIdToStats = Record<ChampionId, ChampionStats>;

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

// Minimal user surface used client-side; keep server models in Prisma
export interface PublicUser {
  id: string;
  email: string | null;
  name: string | null;
  leagueAccountId: string | null;
}

// Shared enums/constants
export type QueueId = number;

// Re-export structure for future files, e.g., from './riot', './user'
export type {};

// League account surface used client-side
export interface LeagueAccount {
  puuid: string;
  riotRegion: string;
  riotGameName?: string | null;
  riotTagLine?: string | null;
  summonerLevel?: number | null;
  profileIconId?: number | null;
}
