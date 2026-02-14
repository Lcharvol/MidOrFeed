import type { CompositionRole } from "@/lib/compositions/roles";

export type DraftTeam = "blue" | "red";
export type DraftActionType = "ban" | "pick";

export interface DraftStep {
  index: number;
  team: DraftTeam;
  action: DraftActionType;
  /** Label shown in UI, e.g. "Ban Phase 1" */
  phaseLabel: string;
}

export interface DraftPick {
  championId: string;
  role: CompositionRole;
  team: DraftTeam;
}

export interface DraftBan {
  championId: string;
  team: DraftTeam;
}

export type DraftPhase = "not_started" | "in_progress" | "finished";

export interface DraftState {
  phase: DraftPhase;
  currentStepIndex: number;
  blueBans: DraftBan[];
  redBans: DraftBan[];
  bluePicks: DraftPick[];
  redPicks: DraftPick[];
  /** Whether the 30s timer is enabled */
  timerEnabled: boolean;
  /** Seconds remaining on the current turn timer */
  timerSeconds: number;
  /** Role selected for the next pick (user only) */
  selectedRole: CompositionRole | null;
  /** Champion hovered before confirming */
  hoveredChampionId: string | null;
  /** Analysis result after draft is finished */
  analysis: DraftAnalyzeResponse | null;
  /** Whether the analysis is loading */
  analysisLoading: boolean;
}

export type DraftAction =
  | { type: "START_DRAFT" }
  | { type: "SELECT_ROLE"; role: CompositionRole }
  | { type: "HOVER_CHAMPION"; championId: string }
  | { type: "CONFIRM_ACTION"; championId: string; role?: CompositionRole }
  | { type: "AI_ACTION"; championId: string; role?: CompositionRole }
  | { type: "TIMER_TICK" }
  | { type: "TIMER_EXPIRE" }
  | { type: "TOGGLE_TIMER" }
  | { type: "SET_ANALYSIS"; analysis: DraftAnalyzeResponse }
  | { type: "SET_ANALYSIS_LOADING"; loading: boolean }
  | { type: "RESET" };

// API types
export interface DraftAnalyzeTeamPick {
  championId: string;
  role: CompositionRole;
}

export interface DraftAnalyzeRequest {
  bluePicks: DraftAnalyzeTeamPick[];
  redPicks: DraftAnalyzeTeamPick[];
}

export interface LaneMatchup {
  role: CompositionRole;
  blueChampionId: string;
  redChampionId: string;
  blueWinRate: number;
  gamesPlayed: number;
}

export interface TeamStats {
  avgScore: number;
  avgWinRate: number;
  avgKDA: number;
}

export interface DraftAnalyzeResponse {
  blueWinProbability: number;
  redWinProbability: number;
  laneMatchups: LaneMatchup[];
  blueTeamStats: TeamStats;
  redTeamStats: TeamStats;
}

// Draft history types
export interface DraftHistoryEntry {
  id: string;
  blueWinProbability: number;
  bluePicks: DraftAnalyzeTeamPick[];
  redPicks: DraftAnalyzeTeamPick[];
  blueAvgWinRate: number;
  blueAvgKDA: number;
  blueAvgScore: number;
  redAvgWinRate: number;
  redAvgKDA: number;
  redAvgScore: number;
  recordedAt: string;
}

export interface DraftHistoryResponse {
  success: boolean;
  data: {
    history: DraftHistoryEntry[];
    stats: {
      totalDrafts: number;
      avgBlueWinRate: number;
    };
  };
}
