/**
 * Job data and result types for all queue workers
 */

// Common job progress structure
export interface JobProgress {
  current: number;
  total: number;
  message?: string;
}

// Champion Stats Worker
export interface ChampionStatsJobData {
  championIds?: string[];
}

export interface ChampionStatsJobResult {
  championsProcessed: number;
  duration: number;
  errors: string[];
}

// Composition Worker
export interface CompositionJobData {
  roles?: string[];
  minSampleSize?: number;
}

export interface CompositionJobResult {
  suggestionsGenerated: number;
  duration: number;
  errors: string[];
}

// Data Crawl Worker
export interface DataCrawlJobData {
  region?: string;
  limit?: number;
  matchesPerPlayer?: number;
}

export interface DataCrawlJobResult {
  playersCrawled: number;
  matchesCollected: number;
  newPlayersDiscovered: number;
  duration: number;
  errors: string[];
}

// Leaderboard Sync Worker
export interface LeaderboardSyncJobData {
  regions?: string[];
  queueTypes?: string[];
  tiers?: string[];
}

export interface LeaderboardSyncJobResult {
  entriesSynced: number;
  regionsProcessed: number;
  duration: number;
  errors: string[];
}

// DDragon Sync Worker
export interface DDragonSyncJobData {
  force?: boolean;
  resources?: string[];
}

export interface DDragonSyncJobResult {
  championsUpdated: number;
  itemsUpdated: number;
  newVersion: string | null;
  duration: number;
  errors: string[];
}

// Meta Analysis Worker
export interface MetaAnalysisJobData {
  minGames?: number;
  daysToAnalyze?: number;
}

export interface MetaAnalysisJobResult {
  championsAnalyzed: number;
  topPicksGenerated: number;
  duration: number;
  errors: string[];
}

// Synergy Analysis Worker
export interface SynergyAnalysisJobData {
  minGamesTogether?: number;
  topSynergiesPerChampion?: number;
}

export interface SynergyAnalysisJobResult {
  synergiesComputed: number;
  championPairsAnalyzed: number;
  duration: number;
  errors: string[];
}

// Item Builds Worker
export interface ItemBuildsJobData {
  championIds?: string[];
  minGames?: number;
}

export interface ItemBuildsJobResult {
  buildsGenerated: number;
  championsProcessed: number;
  duration: number;
  errors: string[];
}

// Data Cleanup Worker
export interface DataCleanupJobData {
  matchesOlderThanDays?: number;
  inactiveAccountsDays?: number;
  dryRun?: boolean;
}

export interface DataCleanupJobResult {
  matchesDeleted: number;
  accountsDeleted: number;
  spaceFreedMB: number;
  duration: number;
  errors: string[];
}

// Account Refresh Worker
export interface AccountRefreshJobData {
  limit?: number;
  staleHours?: number;
  puuid?: string;
}

export interface AccountRefreshJobResult {
  accountsRefreshed: number;
  accountsNotFound: number;
  duration: number;
  errors: string[];
}

// Daily Reset Worker
export interface DailyResetJobData {
  resetAnalysisQuotas?: boolean;
  archiveNotifications?: boolean;
}

export interface DailyResetJobResult {
  usersReset: number;
  notificationsArchived: number;
  duration: number;
  errors: string[];
}
