"use client";

import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/ui/page-hero";
import { MATCHES_FETCH_LIMIT } from "@/constants/matches";
import type { TierListMetrics } from "@/types";
import {
  formatNumber,
  formatPercentage,
  PATCH_VERSION,
  getWinRateEmphasis,
} from "../utils";

type TierListHeroProps = {
  metrics: TierListMetrics;
};

export const TierListHero = ({ metrics }: TierListHeroProps) => {
  const {
    totalMatches,
    reliableChampionCount,
    averageWinRate,
    formattedLastUpdated,
    championsCount,
  } = metrics;

  return (
    <PageHero
      title="LoL Tier List"
      description={
        <>
          Analyse des performances compétitives basée sur{" "}
          {formatNumber(totalMatches)} parties récentes. Classement mis à jour
          automatiquement à partir des données de matchs collectées.
        </>
      }
      badge={
        <Badge
          variant="outline"
          className="w-fit rounded-full border-border/60 bg-background/70 px-3 py-1 text-xs font-medium uppercase text-primary"
        >
          Patch {PATCH_VERSION}
        </Badge>
      }
      metaItems={[
        <>Dernière mise à jour&nbsp;: {formattedLastUpdated}</>,
        <>Champions analysés&nbsp;: {formatNumber(championsCount)}</>,
        <>
          Champions fiables (≥{MATCHES_FETCH_LIMIT} matchs)&nbsp;:{" "}
          {formatNumber(reliableChampionCount)}
        </>,
      ]}
      metrics={[
        {
          label: "Win Rate moyen",
          value: formatPercentage(averageWinRate),
          emphasis: getWinRateEmphasis(averageWinRate),
        },
        {
          label: "Total Matches",
          value: formatNumber(totalMatches),
          emphasis: totalMatches > 5000 ? "info" : "neutral",
        },
        {
          label: "Champions fiables",
          value: formatNumber(reliableChampionCount),
          emphasis:
            reliableChampionCount >= 20
              ? "positive"
              : reliableChampionCount >= 10
              ? "info"
              : "warning",
        },
      ]}
    />
  );
};
