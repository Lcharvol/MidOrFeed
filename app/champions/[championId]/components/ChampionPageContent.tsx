"use client";

import { Suspense, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ChampionEntity, TierListChampionStats } from "@/types";
import type { ChampionAbility } from "@/lib/champions/get-champion-abilities";
import { useChampionSummary } from "@/app/champions/hooks/useChampionSummary";
import { useI18n } from "@/lib/i18n-context";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChampionHero } from "./ChampionHero";
import { ChampionStatsSection } from "./ChampionStatsSection";
import { ChampionResourcesSection } from "./ChampionResourcesSection";
import { LazyLoadingFallback } from "@/lib/lazy-components";
import dynamic from "next/dynamic";

// Lazy load les sections lourdes qui ne sont pas toujours visibles
const ChampionAbilitiesSection = dynamic(
  () =>
    import("./ChampionAbilitiesSection").then((mod) => ({
      default: mod.ChampionAbilitiesSection,
    })),
  { loading: () => <LazyLoadingFallback />, ssr: true }
);

const ChampionCountersSection = dynamic(
  () =>
    import("./ChampionCountersSection").then((mod) => ({
      default: mod.ChampionCountersSection,
    })),
  { loading: () => <LazyLoadingFallback />, ssr: true }
);

const ChampionBuildSection = dynamic(
  () =>
    import("./ChampionBuildSection").then((mod) => ({
      default: mod.ChampionBuildSection,
    })),
  { loading: () => <LazyLoadingFallback />, ssr: true }
);

const ChampionRunesSection = dynamic(
  () =>
    import("./ChampionRunesSection").then((mod) => ({
      default: mod.ChampionRunesSection,
    })),
  { loading: () => <LazyLoadingFallback />, ssr: true }
);

const ChampionAdviceSection = dynamic(
  () =>
    import("./ChampionAdviceSection").then((mod) => ({
      default: mod.ChampionAdviceSection,
    })),
  { loading: () => <LazyLoadingFallback />, ssr: true }
);

const ChampionLeadershipSection = dynamic(
  () =>
    import("./ChampionLeadershipSection").then((mod) => ({
      default: mod.ChampionLeadershipSection,
    })),
  { loading: () => <LazyLoadingFallback />, ssr: true }
);

const ChampionGuidesSection = dynamic(
  () =>
    import("./ChampionGuidesSection").then((mod) => ({
      default: mod.ChampionGuidesSection,
    })),
  { loading: () => <LazyLoadingFallback />, ssr: true }
);

const placeholderStyle =
  "flex min-h-[240px] items-center justify-center rounded-2xl border border-border/50 bg-muted/10 text-sm text-muted-foreground text-center";

const TAB_KEYS = [
  "abilities",
  "counters",
  "build",
  "items",
  "leadership",
  "guides",
] as const;

type TabKey = (typeof TAB_KEYS)[number];

const DEFAULT_TAB: TabKey = "abilities";

const normalizeTab = (value?: string | null): TabKey =>
  TAB_KEYS.includes(value as TabKey) ? (value as TabKey) : DEFAULT_TAB;

type ChampionPageContentProps = {
  champion: ChampionEntity;
  stats?: TierListChampionStats;
  splashUrl: string;
  abilities: ChampionAbility[];
  maxHpReference: number;
  maxMpReference: number;
};

type ChampionStrategicTabsProps = {
  champion: ChampionEntity;
  abilities: ChampionAbility[];
};

const ChampionStrategicTabs = ({
  champion,
  abilities,
}: ChampionStrategicTabsProps) => {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const queryTab = useMemo(
    () => normalizeTab(searchParams.get("section")),
    [searchParams]
  );
  const [activeTab, setActiveTab] = useState<TabKey>(queryTab);

  useEffect(() => {
    setActiveTab(queryTab);
  }, [queryTab]);

  const handleTabChange = (value: string) => {
    const nextTab = normalizeTab(value);
    setActiveTab(nextTab);

    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === DEFAULT_TAB) {
      params.delete("section");
    } else {
      params.set("section", nextTab);
    }

    startTransition(() => {
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    });
  };

  return (
    <div className="rounded-2xl border border-border/60 bg-background/70 p-4 shadow-lg shadow-black/20">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {t("championDetails.strategicDetails")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("championDetails.strategicDescription").replace(
                "{championName}",
                champion.name
              )}
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="abilities">
              {t("championDetails.abilities")}
            </TabsTrigger>
            <TabsTrigger value="counters">
              {t("championDetails.counters")}
            </TabsTrigger>
            <TabsTrigger value="build">
              {t("championDetails.build")}
            </TabsTrigger>
            <TabsTrigger value="items">
              {t("championDetails.items")}
            </TabsTrigger>
            <TabsTrigger value="leadership">
              {t("championDetails.leadership")}
            </TabsTrigger>
            <TabsTrigger value="guides">
              Guides
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="abilities">
          <ChampionAbilitiesSection
            abilities={abilities}
            championName={champion.name}
          />
        </TabsContent>

        <TabsContent value="counters">
          <ChampionCountersSection
            championId={champion.championId}
            championName={champion.name}
          />
        </TabsContent>

        <TabsContent value="build">
          <ChampionRunesSection
            championId={champion.championId}
            championName={champion.name}
          />
        </TabsContent>

        <TabsContent value="items">
          <ChampionBuildSection
            championId={champion.championId}
            championName={champion.name}
          />
        </TabsContent>

        <TabsContent value="leadership">
          <ChampionLeadershipSection
            championId={champion.championId}
            championName={champion.name}
          />
        </TabsContent>

        <TabsContent value="guides">
          <ChampionGuidesSection
            championId={champion.championId}
            championName={champion.name}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TabsFallback = ({ championName }: { championName: string }) => {
  const { t } = useI18n();
  return (
    <div className="rounded-2xl border border-border/60 bg-background/60 p-4 shadow-lg shadow-black/10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="h-5 w-40 animate-pulse rounded bg-muted/60" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted/40" />
        </div>
        <div className="flex gap-2">
          <span className="h-9 w-20 animate-pulse rounded-md bg-muted/40" />
          <span className="h-9 w-20 animate-pulse rounded-md bg-muted/40" />
          <span className="h-9 w-20 animate-pulse rounded-md bg-muted/40" />
          <span className="h-9 w-20 animate-pulse rounded-md bg-muted/40" />
          <span className="h-9 w-20 animate-pulse rounded-md bg-muted/40" />
          <span className="h-9 w-20 animate-pulse rounded-md bg-muted/40" />
        </div>
      </div>
      <div className="mt-6 flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/20 text-sm text-muted-foreground">
        {t("championDetails.loadingStrategicDetails").replace(
          "{championName}",
          championName
        )}
      </div>
    </div>
  );
};

export const ChampionPageContent = ({
  champion,
  stats,
  splashUrl,
  abilities,
  maxHpReference,
  maxMpReference,
}: ChampionPageContentProps) => {
  const summary = useChampionSummary(champion, stats);
  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[320px_1fr]">
        <ChampionHero
          champion={champion}
          summary={summary}
          splashUrl={splashUrl}
          maxHpReference={maxHpReference}
          maxMpReference={maxMpReference}
        />
        <article className="space-y-6">
          <ChampionStatsSection summary={summary} />
          <Suspense fallback={<TabsFallback championName={champion.name} />}>
            <ChampionStrategicTabs champion={champion} abilities={abilities} />
          </Suspense>
        </article>
      </section>
      <ChampionAdviceSection
        championId={champion.championId}
        championName={champion.name}
      />
      <ChampionResourcesSection
        championId={champion.championId}
        championName={champion.name}
      />
    </div>
  );
};
