export const REGIONS = [
  { value: "euw1", label: "EU West" },
  { value: "eun1", label: "EU Nordic & East" },
  { value: "na1", label: "North America" },
  { value: "kr", label: "Korea" },
  { value: "br1", label: "Brazil" },
  { value: "jp1", label: "Japan" },
  { value: "oc1", label: "Oceania" },
  { value: "tr1", label: "Turkey" },
  { value: "ru", label: "Russia" },
  { value: "la1", label: "Latin America North" },
  { value: "la2", label: "Latin America South" },
];

export type LiveGameData = {
  success: boolean;
  inGame: boolean;
  data: {
    gameId: number;
    gameMode: string;
    gameType: string;
    gameLength: number;
    participants: Array<{
      puuid: string;
      riotId: string;
      teamId: number;
      championId: number;
      isCurrentPlayer: boolean;
    }>;
    bannedChampions: Array<{
      championId: number;
      teamId: number;
    }>;
  } | null;
};

export type StatusData = {
  success: boolean;
  data: {
    platform: string;
    platformName: string;
    hasIssues: boolean;
    maintenances: Array<{
      id: number;
      status: string;
      title: string;
      description: string | null;
    }>;
    incidents: Array<{
      id: number;
      severity: string;
      title: string;
      description: string | null;
    }>;
  };
};

export type MasteryData = {
  success: boolean;
  data: {
    totalScore: number;
    topMasteries: Array<{
      championId: number;
      level: number;
      points: number;
      chestGranted: boolean;
      tokensEarned: number;
    }>;
  };
};
