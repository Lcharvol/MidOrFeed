export interface ChampionStat {
  championId: string;
  games: number;
  wins: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
}

export interface RoleDistribution {
  role: string;
  games: number;
  percentage: number;
  winRate: number;
}

export interface RankedInfo {
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  winRate: number;
  queueType: string;
}

export interface PlaystyleAnalysis {
  aggressionScore: number;
  visionScore: number;
  farmingScore: number;
  teamfightScore: number;
  survivabilityScore: number;
  earlyGameScore: number;
  objectiveScore: number;
}

export interface RankProgression {
  date: string;
  tier: string;
  rank: string;
  lp: number;
}

export interface PlayerStats {
  totalGames: number;
  wins: number;
  losses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgKDA: number;
  avgVisionScore: number;
  avgDamageDealt: number;
  avgDamageTaken: number;
  avgGoldEarned: number;
  goldPerMin: number;
  damagePerMin: number;
  avgGameDuration: number;
}

export interface PlayerData {
  puuid: string;
  gameName: string;
  tagLine: string;
  region: string;
  profileIconId?: number;
  summonerLevel?: number;
  stats: PlayerStats;
  rankedInfo: RankedInfo | null;
  rankProgression: RankProgression[];
  topChampions: ChampionStat[];
  roleDistribution: RoleDistribution[];
  playstyle: PlaystyleAnalysis;
  recentForm: {
    last10WinRate: number;
    currentStreak: number;
    streakType: "win" | "loss" | null;
  };
}

export interface CommonChampion {
  championId: string;
  player1: ChampionStat;
  player2: ChampionStat;
}

export interface DuoSynergy {
  roleCompatibility: number;
  playstyleCompatibility: number;
  recommendations: string[];
}

export interface BanRecommendation {
  championId: string;
  reason: string;
  priority: number;
}

export interface CompareResponse {
  success: boolean;
  data: {
    player1: PlayerData;
    player2: PlayerData;
    comparison: {
      commonChampions: CommonChampion[];
      duoSynergy: DuoSynergy;
      bansAgainstPlayer1: BanRecommendation[];
      bansAgainstPlayer2: BanRecommendation[];
    };
  };
}

export const TIER_COLORS: Record<string, string> = {
  IRON: "bg-gray-600",
  BRONZE: "bg-amber-700",
  SILVER: "bg-gray-400",
  GOLD: "bg-yellow-500",
  PLATINUM: "bg-cyan-500",
  EMERALD: "bg-emerald-500",
  DIAMOND: "bg-blue-500",
  MASTER: "bg-purple-500",
  GRANDMASTER: "bg-red-500",
  CHALLENGER: "bg-amber-400",
};

export const ROLE_LABELS: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  MID: "Mid",
  BOTTOM: "ADC",
  BOT: "ADC",
  UTILITY: "Support",
  SUPPORT: "Support",
  NONE: "Fill",
  UNKNOWN: "Autre",
};

export const parsePlayerQuery = (
  query: string
): { gameName: string; tagLine: string } | null => {
  const trimmed = query.trim();
  const hashIndex = trimmed.lastIndexOf("#");

  if (
    hashIndex === -1 ||
    hashIndex === 0 ||
    hashIndex === trimmed.length - 1
  ) {
    return null;
  }

  const gameName = trimmed.slice(0, hashIndex).trim();
  const tagLine = trimmed.slice(hashIndex + 1).trim();

  if (!gameName || !tagLine) {
    return null;
  }

  return { gameName, tagLine };
};
