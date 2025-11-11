export const ROLE_PRIORITY = [
  "TOP",
  "JUNGLE",
  "MIDDLE",
  "BOTTOM",
  "UTILITY",
] as const;

export type CompositionRole = (typeof ROLE_PRIORITY)[number];

const ROLE_ALIASES: Record<string, CompositionRole | null> = {
  TOP_LANE: "TOP",
  SOLO_TOP: "TOP",
  JUNGLE_LANE: "JUNGLE",
  MID: "MIDDLE",
  MID_LANE: "MIDDLE",
  MIDDLE_LANE: "MIDDLE",
  BOT: "BOTTOM",
  BOT_LANE: "BOTTOM",
  BOTTOM_LANE: "BOTTOM",
  ADC: "BOTTOM",
  AD_CARRY: "BOTTOM",
  CARRY: "BOTTOM",
  DUO_CARRY: "BOTTOM",
  SUPPORT: "UTILITY",
  DUO_SUPPORT: "UTILITY",
  UTILITY_LANE: "UTILITY",
  SOLO: null,
  DUO: null,
  NONE: null,
};

const LANE_ALIASES: Record<string, CompositionRole | null> = {
  TOP: "TOP",
  JUNGLE: "JUNGLE",
  MID: "MIDDLE",
  MIDDLE: "MIDDLE",
  BOTTOM: "BOTTOM",
  BOT: "BOTTOM",
  SUPPORT: "UTILITY",
  UTILITY: "UTILITY",
  NONE: null,
};

export const ROLE_LABELS: Record<CompositionRole, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "ADC",
  UTILITY: "Support",
};

export const normalizeRole = (
  role?: string | null
): CompositionRole | null => {
  if (!role) return null;
  const upper = role.trim().toUpperCase();
  if ((ROLE_PRIORITY as readonly string[]).includes(upper)) {
    return upper as CompositionRole;
  }
  const alias = ROLE_ALIASES[upper];
  return alias ?? null;
};

export const normalizeLane = (
  lane?: string | null
): CompositionRole | null => {
  if (!lane) return null;
  const upper = lane.trim().toUpperCase();
  if ((ROLE_PRIORITY as readonly string[]).includes(upper)) {
    return upper as CompositionRole;
  }
  const alias = LANE_ALIASES[upper];
  return alias ?? null;
};

export const resolveChampionRole = (
  role?: string | null,
  lane?: string | null
): CompositionRole | null =>
  normalizeRole(role) ?? normalizeLane(lane);
