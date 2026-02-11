export type PublicStats = {
  totalMatches: number;
  totalPlayers: number;
  totalChampions: number;
};

export type LeaderboardEntry = {
  id: string;
  summonerName: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  rank: string;
  tier: string;
};

export type FeaturedGame = {
  gameId: number;
  gameMode: string;
  gameLength: number;
  queueId: number;
  blueTeam: Array<{ championId: number }>;
  redTeam: Array<{ championId: number }>;
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

export const TIER_EMPHASIS: Record<string, "info" | "positive" | "warning" | "danger" | "neutral"> = {
  CHALLENGER: "warning",
  GRANDMASTER: "danger",
  MASTER: "info",
  DIAMOND: "info",
  EMERALD: "positive",
  PLATINUM: "info",
  GOLD: "warning",
  SILVER: "neutral",
  BRONZE: "warning",
  IRON: "neutral",
};
