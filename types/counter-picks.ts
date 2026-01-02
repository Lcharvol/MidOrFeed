export type CounterPickMode = "same_lane" | "global";

export interface CounterPickPair {
  enemyChampionId: string;
  games: number;
  wins: number;
  losses: number;
  winRate: number;
  lastPlayedAt: string;
}

export interface CounterPickResponse {
  championId: string;
  mode: CounterPickMode;
  totalMatches: number;
  pairs: CounterPickPair[];
}


