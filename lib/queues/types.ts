/**
 * Job data types for each queue
 */

// Champion Stats Job
export interface ChampionStatsJobData {
  // Optional: specific champion IDs to process (if empty, process all)
  championIds?: number[];
  // Force recalculation even if recently computed
  force?: boolean;
}

export interface ChampionStatsJobResult {
  championsProcessed: number;
  duration: number;
  errors: string[];
}

// Composition Generation Job
export interface CompositionJobData {
  // Optional: specific roles to generate (if empty, all roles)
  roles?: ("top" | "jungle" | "mid" | "adc" | "support")[];
  // Minimum sample size for confidence
  minSampleSize?: number;
}

export interface CompositionJobResult {
  suggestionsGenerated: number;
  duration: number;
  errors: string[];
}

// Data Crawl Job
export interface DataCrawlJobData {
  region?: string;
  // Number of players to crawl
  limit?: number;
  // Max matches to collect per player
  matchesPerPlayer?: number;
}

export interface DataCrawlJobResult {
  playersCrawled: number;
  matchesCollected: number;
  newPlayersDiscovered: number;
  duration: number;
  errors: string[];
}

// Account Sync Job
export interface AccountSyncJobData {
  riotApiQuota?: number;
  batchSize?: number;
}

export interface AccountSyncJobResult {
  accountsSynced: number;
  apiCallsMade: number;
  duration: number;
  errors: string[];
}

// Leaderboard Sync Job
export interface LeaderboardSyncJobData {
  // Regions to sync (if empty, all main regions)
  regions?: string[];
  // Queue types to sync
  queueTypes?: ("RANKED_SOLO_5x5" | "RANKED_FLEX_SR")[];
  // Tiers to sync (Challenger, Grandmaster, Master)
  tiers?: ("challenger" | "grandmaster" | "master")[];
}

export interface LeaderboardSyncJobResult {
  entriesSynced: number;
  regionsProcessed: number;
  duration: number;
  errors: string[];
}

// DDragon Sync Job
export interface DDragonSyncJobData {
  // Force update even if version hasn't changed
  force?: boolean;
  // Specific resources to sync
  resources?: ("champions" | "items" | "versions")[];
}

export interface DDragonSyncJobResult {
  championsUpdated: number;
  itemsUpdated: number;
  newVersion: string | null;
  duration: number;
  errors: string[];
}

// Meta Analysis Job
export interface MetaAnalysisJobData {
  // Minimum games for a champion to be considered
  minGames?: number;
  // Number of days to analyze
  daysToAnalyze?: number;
}

export interface MetaAnalysisJobResult {
  championsAnalyzed: number;
  topPicksGenerated: number;
  duration: number;
  errors: string[];
}

// Synergy Analysis Job
export interface SynergyAnalysisJobData {
  // Minimum games together for synergy calculation
  minGamesTogether?: number;
  // Top synergies to keep per champion
  topSynergiesPerChampion?: number;
}

export interface SynergyAnalysisJobResult {
  synergiesComputed: number;
  championPairsAnalyzed: number;
  duration: number;
  errors: string[];
}

// Item Builds Job
export interface ItemBuildsJobData {
  // Specific champions to analyze (if empty, all)
  championIds?: string[];
  // Minimum games for a build to be considered
  minGames?: number;
}

export interface ItemBuildsJobResult {
  buildsGenerated: number;
  championsProcessed: number;
  duration: number;
  errors: string[];
}

// Data Cleanup Job
export interface DataCleanupJobData {
  // Delete matches older than X days
  matchesOlderThanDays?: number;
  // Delete inactive accounts (no matches in X days)
  inactiveAccountsDays?: number;
  // Dry run mode (don't actually delete)
  dryRun?: boolean;
}

export interface DataCleanupJobResult {
  matchesDeleted: number;
  accountsDeleted: number;
  spaceFreedMB: number;
  duration: number;
  errors: string[];
}

// Account Refresh Job
export interface AccountRefreshJobData {
  // Max accounts to refresh per run
  limit?: number;
  // Only refresh accounts not updated in X hours
  staleHours?: number;
}

export interface AccountRefreshJobResult {
  accountsRefreshed: number;
  accountsNotFound: number;
  duration: number;
  errors: string[];
}

// Daily Reset Job
export interface DailyResetJobData {
  // Reset analysis quotas
  resetAnalysisQuotas?: boolean;
  // Archive old notifications
  archiveNotifications?: boolean;
}

export interface DailyResetJobResult {
  usersReset: number;
  notificationsArchived: number;
  duration: number;
  errors: string[];
}

// Job progress reporting
export interface JobProgress {
  current: number;
  total: number;
  message?: string;
}
