import type { ChampionId } from "./champions";
import type {
  ChampionIdToStats,
  RoleIdToStats,
  SummonerOverviewAggregate,
} from "./summoners";

export interface MatchParticipantSummary {
  id: string;
  participantId: number;
  participantPUuid: string | null;
  teamId: number;
  championId: ChampionId;
  championName?: string | null;
  role: string | null;
  lane: string | null;
  kills: number;
  deaths: number;
  assists: number;
  goldEarned: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  visionScore: number;
  win: boolean;
  match?: {
    queueId: number | null;
    region: string | null;
    gameDuration: number;
    gameMode: string | null;
    platformId: string | null;
    gameVersion: string | null;
    gameCreation: string;
  };
  [key: string]: unknown;
}

export interface MatchSummary {
  id: string;
  matchId: string;
  gameCreation: string;
  gameDuration: number;
  queueId: number | null;
  region: string | null;
  gameMode: string | null;
  platformId: string | null;
  gameVersion: string | null;
  blueTeamWon?: boolean | null;
  redTeamWon?: boolean | null;
  participants: MatchParticipantSummary[];
  [key: string]: unknown;
}

export type MatchesAggregateStats = SummonerOverviewAggregate;

export interface MatchesPayload {
  matches: MatchSummary[];
  stats: MatchesAggregateStats;
  championStats: ChampionIdToStats;
  roleStats: RoleIdToStats;
}
