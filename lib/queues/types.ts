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
  region: string;
  seedCount?: number;
  batchSize?: number;
}

export interface DataCrawlJobResult {
  playersDiscovered: number;
  matchesCollected: number;
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

// Job progress reporting
export interface JobProgress {
  current: number;
  total: number;
  message?: string;
}
