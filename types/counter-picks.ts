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
  totalMatches: number;
  pairs: CounterPickPair[];
}


