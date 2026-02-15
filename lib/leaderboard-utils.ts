export const TIER_LABEL: Record<string, string> = {
  CHALLENGER: "Challenger",
  GRANDMASTER: "Grandmaster",
  MASTER: "Master",
};

export const TIER_TEXT: Record<string, string> = {
  CHALLENGER: "text-tier-challenger",
  GRANDMASTER: "text-tier-grandmaster",
  MASTER: "text-tier-master",
};

export const TIER_BORDER: Record<string, string> = {
  CHALLENGER: "border-tier-challenger/30",
  GRANDMASTER: "border-tier-grandmaster/30",
  MASTER: "border-tier-master/30",
};

export const TIER_GRADIENT: Record<string, string> = {
  CHALLENGER: "from-tier-challenger/10",
  GRANDMASTER: "from-tier-grandmaster/10",
  MASTER: "from-tier-master/10",
};

export function computeWinRate(wins: number, losses: number): string {
  const total = wins + losses;
  return total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
}

export function getWinRateColor(wr: number): "positive" | "neutral" | "danger" {
  if (wr >= 55) return "positive";
  if (wr >= 50) return "neutral";
  return "danger";
}
