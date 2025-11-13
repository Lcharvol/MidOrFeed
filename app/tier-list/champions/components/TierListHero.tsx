"use client";

import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/ui/page-hero";
import type { TierListMetrics } from "@/types";
import { formatNumber, PATCH_VERSION } from "../utils";

type TierListHeroProps = {
  metrics: TierListMetrics;
};

export const TierListHero = ({ metrics }: TierListHeroProps) => {
  const { totalMatches, formattedLastUpdated, championsCount } = metrics;

  return (
    <>
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
        ]}
      />
      <div className="mt-4 text-sm text-muted-foreground">
        <strong className="text-foreground">
          Totale des matches analysé&nbsp;:
        </strong>{" "}
        {formatNumber(totalMatches)}
      </div>
    </>
  );
};
