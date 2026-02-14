import type {
  DraftState,
  DraftAction,
  DraftStep,
  DraftTeam,
  DraftBan,
  DraftPick,
} from "@/types/draft";
import type { CompositionRole } from "@/lib/compositions/roles";
import { DRAFT_SEQUENCE, TOTAL_STEPS, TIMER_DURATION } from "./constants";

export function createInitialState(): DraftState {
  return {
    phase: "not_started",
    currentStepIndex: 0,
    blueBans: [],
    redBans: [],
    bluePicks: [],
    redPicks: [],
    timerEnabled: false,
    timerSeconds: TIMER_DURATION,
    selectedRole: null,
    hoveredChampionId: null,
    analysis: null,
    analysisLoading: false,
  };
}

export function getCurrentStep(state: DraftState): DraftStep | null {
  if (state.phase !== "in_progress") return null;
  if (state.currentStepIndex >= TOTAL_STEPS) return null;
  return DRAFT_SEQUENCE[state.currentStepIndex];
}

export function isUserTurn(state: DraftState): boolean {
  const step = getCurrentStep(state);
  if (!step) return false;
  return step.team === "blue";
}

export function getAllBannedIds(state: DraftState): Set<string> {
  const ids = new Set<string>();
  for (const b of state.blueBans) ids.add(b.championId);
  for (const b of state.redBans) ids.add(b.championId);
  return ids;
}

export function getAllPickedIds(state: DraftState): Set<string> {
  const ids = new Set<string>();
  for (const p of state.bluePicks) ids.add(p.championId);
  for (const p of state.redPicks) ids.add(p.championId);
  return ids;
}

export function getAllUnavailableIds(state: DraftState): Set<string> {
  const ids = getAllBannedIds(state);
  for (const id of getAllPickedIds(state)) ids.add(id);
  return ids;
}

export function getFilledRoles(
  picks: DraftPick[]
): Set<CompositionRole> {
  return new Set(picks.map((p) => p.role));
}

export function getUnfilledRoles(
  picks: DraftPick[]
): CompositionRole[] {
  const filled = getFilledRoles(picks);
  const all: CompositionRole[] = [
    "TOP",
    "JUNGLE",
    "MIDDLE",
    "BOTTOM",
    "UTILITY",
  ];
  return all.filter((r) => !filled.has(r));
}

function addBan(
  state: DraftState,
  team: DraftTeam,
  championId: string
): DraftState {
  const ban: DraftBan = { championId, team };
  return team === "blue"
    ? { ...state, blueBans: [...state.blueBans, ban] }
    : { ...state, redBans: [...state.redBans, ban] };
}

function addPick(
  state: DraftState,
  team: DraftTeam,
  championId: string,
  role: CompositionRole
): DraftState {
  const pick: DraftPick = { championId, role, team };
  return team === "blue"
    ? { ...state, bluePicks: [...state.bluePicks, pick] }
    : { ...state, redPicks: [...state.redPicks, pick] };
}

function advanceStep(state: DraftState): DraftState {
  const nextIndex = state.currentStepIndex + 1;
  if (nextIndex >= TOTAL_STEPS) {
    return {
      ...state,
      currentStepIndex: nextIndex,
      phase: "finished",
      timerSeconds: 0,
      hoveredChampionId: null,
      selectedRole: null,
    };
  }
  return {
    ...state,
    currentStepIndex: nextIndex,
    timerSeconds: TIMER_DURATION,
    hoveredChampionId: null,
    selectedRole: null,
  };
}

function applyConfirmAction(
  state: DraftState,
  championId: string,
  role: CompositionRole | undefined,
  team: DraftTeam
): DraftState {
  const step = getCurrentStep(state);
  if (!step) return state;
  if (step.team !== team) return state;

  const unavailable = getAllUnavailableIds(state);
  if (unavailable.has(championId)) return state;

  let next: DraftState;

  if (step.action === "ban") {
    next = addBan(state, team, championId);
  } else {
    const picks = team === "blue" ? state.bluePicks : state.redPicks;
    const unfilled = getUnfilledRoles(picks);
    const pickRole = role && unfilled.includes(role) ? role : unfilled[0];
    if (!pickRole) return state;
    next = addPick(state, team, championId, pickRole);
  }

  return advanceStep(next);
}

export function draftReducer(
  state: DraftState,
  action: DraftAction
): DraftState {
  switch (action.type) {
    case "START_DRAFT":
      return { ...createInitialState(), phase: "in_progress", timerEnabled: state.timerEnabled };

    case "SELECT_ROLE":
      return { ...state, selectedRole: action.role };

    case "HOVER_CHAMPION":
      return { ...state, hoveredChampionId: action.championId };

    case "CONFIRM_ACTION":
      return applyConfirmAction(
        state,
        action.championId,
        action.role,
        "blue"
      );

    case "AI_ACTION":
      return applyConfirmAction(
        state,
        action.championId,
        action.role,
        "red"
      );

    case "TIMER_TICK":
      if (!state.timerEnabled || state.phase !== "in_progress") return state;
      if (state.timerSeconds <= 1) return state; // handled by TIMER_EXPIRE
      return { ...state, timerSeconds: state.timerSeconds - 1 };

    case "TIMER_EXPIRE":
      // Auto-action when timer runs out (only for user turns)
      return state;

    case "TOGGLE_TIMER":
      return {
        ...state,
        timerEnabled: !state.timerEnabled,
        timerSeconds: TIMER_DURATION,
      };

    case "SET_ANALYSIS":
      return {
        ...state,
        analysis: action.analysis,
        analysisLoading: false,
      };

    case "SET_ANALYSIS_LOADING":
      return { ...state, analysisLoading: action.loading };

    case "RESET":
      return createInitialState();

    default:
      return state;
  }
}
