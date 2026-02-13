export const TIER_ORDER = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
] as const;

export type Tier = (typeof TIER_ORDER)[number];

export const RANK_BRACKETS = [
  { key: "ALL", label: "All Ranks", minTierIndex: 0 },
  { key: "IRON+", label: "Iron+", minTierIndex: 0 },
  { key: "BRONZE+", label: "Bronze+", minTierIndex: 1 },
  { key: "SILVER+", label: "Silver+", minTierIndex: 2 },
  { key: "GOLD+", label: "Gold+", minTierIndex: 3 },
  { key: "PLATINUM+", label: "Platinum+", minTierIndex: 4 },
  { key: "EMERALD+", label: "Emerald+", minTierIndex: 5 },
  { key: "DIAMOND+", label: "Diamond+", minTierIndex: 6 },
  { key: "MASTER+", label: "Master+", minTierIndex: 7 },
] as const;

export type RankBracketKey = (typeof RANK_BRACKETS)[number]["key"];

export const DEFAULT_RANK_BRACKET: RankBracketKey = "EMERALD+";

/**
 * Returns the list of tiers that are >= the given bracket.
 * e.g. "EMERALD+" → ["EMERALD", "DIAMOND", "MASTER", "GRANDMASTER", "CHALLENGER"]
 * "ALL" returns all tiers.
 */
export function getTiersForBracket(bracketKey: string): Tier[] {
  const bracket = RANK_BRACKETS.find((b) => b.key === bracketKey);
  if (!bracket || bracketKey === "ALL") {
    return [...TIER_ORDER];
  }
  return TIER_ORDER.slice(bracket.minTierIndex);
}
