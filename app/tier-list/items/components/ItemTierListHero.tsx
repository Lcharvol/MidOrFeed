"use client";

import { Badge } from "@/components/ui/badge";
import { PageHero } from "@/components/ui/page-hero";
import { formatNumber, PATCH_VERSION } from "../../champions/utils";
import { useI18n } from "@/lib/i18n-context";

type ItemTierListHeroProps = {
  totalMatches: number;
  itemsCount: number;
  formattedLastUpdated: string;
};

export const ItemTierListHero = ({
  totalMatches,
  itemsCount,
  formattedLastUpdated,
}: ItemTierListHeroProps) => {
  const { t } = useI18n();

  return (
    <>
      <PageHero
        title={t("tierListItems.heroTitle")}
        description={
          <>
            {t("tierListItems.heroDescription").replace(
              "{count}",
              formatNumber(totalMatches)
            )}
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
          <>
            {t("tierListItems.lastUpdate")}&nbsp;: {formattedLastUpdated}
          </>,
          <>
            {t("tierListItems.itemsAnalyzed")}&nbsp;:{" "}
            {formatNumber(itemsCount)}
          </>,
        ]}
      />
      <div className="mt-4 text-sm text-muted-foreground">
        <strong className="text-foreground">
          {t("tierListItems.totalMatchesAnalyzed")}&nbsp;:
        </strong>{" "}
        {formatNumber(totalMatches)}
      </div>
    </>
  );
};
