import type { TierListChampionStats } from "@/types";
import type { DraftState } from "@/types/draft";
import type { CompositionRole } from "@/lib/compositions/roles";
import { normalizeRole, normalizeLane } from "@/lib/compositions/roles";
import {
  getAllUnavailableIds,
  getUnfilledRoles,
  getCurrentStep,
} from "./machine";
import { AI_BAN_CANDIDATES, AI_PICK_CANDIDATES } from "./constants";

function weightedRandom<T>(items: T[], getWeight: (item: T) => number): T {
  const total = items.reduce((sum, item) => sum + getWeight(item), 0);
  if (total <= 0) return items[0];
  let r = Math.random() * total;
  for (const item of items) {
    r -= getWeight(item);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

function resolveChampionTopRole(
  stat: TierListChampionStats
): CompositionRole | null {
  return normalizeRole(stat.topRole) ?? normalizeLane(stat.topLane);
}

export function aiSelectBan(
  state: DraftState,
  stats: TierListChampionStats[]
): string | null {
  const unavailable = getAllUnavailableIds(state);
  const available = stats
    .filter((s) => !unavailable.has(s.championId) && s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, AI_BAN_CANDIDATES);

  if (available.length === 0) return null;

  const pick = weightedRandom(available, (s) => s.score);
  return pick.championId;
}

export function aiSelectPick(
  state: DraftState,
  stats: TierListChampionStats[]
): { championId: string; role: CompositionRole } | null {
  const unavailable = getAllUnavailableIds(state);
  const redPicks = state.redPicks;
  const unfilledRoles = getUnfilledRoles(redPicks);

  if (unfilledRoles.length === 0) return null;

  // Try each unfilled role in priority order
  for (const role of unfilledRoles) {
    const candidates = stats
      .filter((s) => {
        if (unavailable.has(s.championId)) return false;
        const champRole = resolveChampionTopRole(s);
        return champRole === role;
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, AI_PICK_CANDIDATES);

    if (candidates.length > 0) {
      const pick = weightedRandom(candidates, (s) => s.score);
      return { championId: pick.championId, role };
    }
  }

  // Fallback: pick any available champion for the first unfilled role
  const fallbackRole = unfilledRoles[0];
  const fallbackCandidates = stats
    .filter((s) => !unavailable.has(s.championId) && s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, AI_PICK_CANDIDATES);

  if (fallbackCandidates.length === 0) return null;

  const pick = weightedRandom(fallbackCandidates, (s) => s.score);
  return { championId: pick.championId, role: fallbackRole };
}

export function aiAction(
  state: DraftState,
  stats: TierListChampionStats[]
): { championId: string; role?: CompositionRole } | null {
  const step = getCurrentStep(state);
  if (!step || step.team !== "red") return null;

  if (step.action === "ban") {
    const championId = aiSelectBan(state, stats);
    return championId ? { championId } : null;
  }

  return aiSelectPick(state, stats);
}
