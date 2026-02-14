import type { DraftStep, DraftTeam, DraftActionType } from "@/types/draft";

/**
 * LoL Ranked Draft Order (20 steps)
 *
 * Ban Phase 1: B R B R B R        (steps 0-5)
 * Pick Phase 1: B RR BB R         (steps 6-11)
 * Ban Phase 2: R B R B            (steps 12-15)
 * Pick Phase 2: R BB R            (steps 16-19)
 */

type StepDef = [DraftTeam, DraftActionType, string];

const STEP_DEFS: StepDef[] = [
  // Ban Phase 1
  ["blue", "ban", "Ban Phase 1"],
  ["red", "ban", "Ban Phase 1"],
  ["blue", "ban", "Ban Phase 1"],
  ["red", "ban", "Ban Phase 1"],
  ["blue", "ban", "Ban Phase 1"],
  ["red", "ban", "Ban Phase 1"],
  // Pick Phase 1
  ["blue", "pick", "Pick Phase 1"],
  ["red", "pick", "Pick Phase 1"],
  ["red", "pick", "Pick Phase 1"],
  ["blue", "pick", "Pick Phase 1"],
  ["blue", "pick", "Pick Phase 1"],
  ["red", "pick", "Pick Phase 1"],
  // Ban Phase 2
  ["red", "ban", "Ban Phase 2"],
  ["blue", "ban", "Ban Phase 2"],
  ["red", "ban", "Ban Phase 2"],
  ["blue", "ban", "Ban Phase 2"],
  // Pick Phase 2
  ["red", "pick", "Pick Phase 2"],
  ["blue", "pick", "Pick Phase 2"],
  ["blue", "pick", "Pick Phase 2"],
  ["red", "pick", "Pick Phase 2"],
];

export const DRAFT_SEQUENCE: DraftStep[] = STEP_DEFS.map(
  ([team, action, phaseLabel], index) => ({
    index,
    team,
    action,
    phaseLabel,
  })
);

export const TOTAL_STEPS = DRAFT_SEQUENCE.length; // 20

export const TIMER_DURATION = 30; // seconds

export const AI_DELAY_MIN = 800; // ms
export const AI_DELAY_MAX = 1500; // ms

export const AI_BAN_CANDIDATES = 12;
export const AI_PICK_CANDIDATES = 5;
