import type { ChartConfig } from "@/components/ui/chart";

export const ROLE_ORDER = ["JUNGLE", "TOP", "MID", "ADC", "SUPPORT"];

export const ROLE_LABELS: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MID: "Mid",
  ADC: "ADC",
  SUPPORT: "Support",
};

export const createWinRateChartConfig = (
  winsColor: string,
  lossesColor: string
): ChartConfig => ({
  wins: {
    label: "Victoires",
    color: winsColor,
  },
  losses: {
    label: "Défaites",
    color: lossesColor,
  },
});

