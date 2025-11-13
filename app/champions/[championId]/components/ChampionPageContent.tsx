'use client';

import { Suspense, useEffect, useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ChampionEntity, TierListChampionStats } from '@/types';
import type { ChampionAbility } from '@/lib/champions/get-champion-abilities';
import { useChampionSummary } from '@/app/champions/hooks/useChampionSummary';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChampionHero } from './ChampionHero';
import { ChampionStatsSection } from './ChampionStatsSection';
import { ChampionResourcesSection } from './ChampionResourcesSection';
import { ChampionAbilitiesSection } from './ChampionAbilitiesSection';
import { ChampionCountersSection } from './ChampionCountersSection';
import { ChampionBuildSection } from './ChampionBuildSection';
import { ChampionAdviceSection } from './ChampionAdviceSection';

const placeholderStyle =
  'flex min-h-[240px] items-center justify-center rounded-2xl border border-border/50 bg-muted/10 text-sm text-muted-foreground text-center';

const TAB_KEYS = ['abilities', 'counters', 'build', 'items'] as const;

type TabKey = (typeof TAB_KEYS)[number];

const DEFAULT_TAB: TabKey = 'abilities';

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const queryTab = useMemo(() => normalizeTab(searchParams.get('section')), [searchParams]);
  const [activeTab, setActiveTab] = useState<TabKey>(queryTab);

  useEffect(() => {
    setActiveTab(queryTab);
  }, [queryTab]);

  const handleTabChange = (value: string) => {
    const nextTab = normalizeTab(value);
    setActiveTab(nextTab);

    const params = new URLSearchParams(searchParams.toString());
    if (nextTab === DEFAULT_TAB) {
      params.delete('section');
    } else {
      params.set('section', nextTab);
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
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Détails stratégiques</h2>
            <p className="text-sm text-muted-foreground">
              Explore les compétences, contres et options de build pour maîtriser {champion.name}.
            </p>
          </div>
          <TabsList>
            <TabsTrigger value="abilities">Compétences</TabsTrigger>
            <TabsTrigger value="counters">Contres</TabsTrigger>
            <TabsTrigger value="build">Build</TabsTrigger>
            <TabsTrigger value="items">Objets</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="abilities">
          <ChampionAbilitiesSection abilities={abilities} championName={champion.name} />
        </TabsContent>

        <TabsContent value="counters">
          <ChampionCountersSection
            championId={champion.championId}
            championName={champion.name}
          />
        </TabsContent>

        <TabsContent value="build">
          <ChampionBuildSection
            championId={champion.championId}
            championName={champion.name}
          />
        </TabsContent>

        <TabsContent value="items">
          <div className={placeholderStyle}>
            Les objets clés seront affichés ici prochainement.
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TabsFallback = ({ championName }: { championName: string }) => (
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
      </div>
    </div>
    <div className="mt-6 flex min-h-[240px] items-center justify-center rounded-xl border border-dashed border-border/50 bg-muted/20 text-sm text-muted-foreground">
      Chargement des détails stratégiques pour {championName}...
    </div>
  </div>
);

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
      <ChampionAdviceSection championId={champion.championId} championName={champion.name} />
      <ChampionResourcesSection championId={champion.championId} championName={champion.name} />
    </div>
  );
};
