"use client";

import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/ui/page-hero";
import type { TierListMetrics } from "@/types";
import { formatNumber, PATCH_VERSION } from "../utils";
import { useI18n } from "@/lib/i18n-context";

type TierListHeroProps = {
  metrics: TierListMetrics;
};

export const TierListHero = ({ metrics }: TierListHeroProps) => {
  const { t } = useI18n();
  const { totalMatches, formattedLastUpdated, championsCount } = metrics;

  return (
    <>
      <PageHero
        title={t("tierListChampions.heroTitle")}
        description={
          <>
            {t("tierListChampions.heroDescription").replace("{count}", formatNumber(totalMatches))}
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
          <>{t("tierListChampions.lastUpdate")}&nbsp;: {formattedLastUpdated}</>,
          <>{t("tierListChampions.championsAnalyzed")}&nbsp;: {formatNumber(championsCount)}</>,
        ]}
      />
      <div className="mt-4 text-sm text-muted-foreground">
        <strong className="text-foreground">
          {t("tierListChampions.totalMatchesAnalyzed")}&nbsp;:
        </strong>{" "}
        {formatNumber(totalMatches)}
      </div>
    </>
  );
};
