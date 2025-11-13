'use client';

import type { ChampionSummary } from '@/app/champions/hooks/useChampionSummary';

const baseStatClasses = 'flex items-center justify-between rounded-lg bg-background/70 px-4 py-3';

const characteristicClasses = 'rounded-lg bg-background/80 px-4 py-3';

type ChampionCharacteristicsSectionProps = {
  summary: ChampionSummary;
};

export const ChampionCharacteristicsSection = ({ summary }: ChampionCharacteristicsSectionProps) => (
  <section
    aria-label="Caractéristiques"
    className="rounded-xl border border-border/60 bg-muted/30 p-6 shadow-sm"
  >
    <h2 className="text-lg font-semibold text-foreground">Caractéristiques générales</h2>
    <div className="grid gap-3 py-4 sm:grid-cols-2">
      {summary.baseStats.map((entry) => (
        <div key={entry.label} className={baseStatClasses}>
          <span className="text-sm font-medium text-muted-foreground">{entry.label}</span>
          <span className="text-base font-semibold text-foreground">{entry.value}</span>
        </div>
      ))}
    </div>
    <div className="grid gap-3 sm:grid-cols-2">
      {summary.characteristics.map((entry) => (
        <div key={entry.label} className={characteristicClasses}>
          <p className="text-xs font-semibold uppercase text-muted-foreground">{entry.label}</p>
          <p className="text-sm text-foreground">{entry.value}</p>
        </div>
      ))}
    </div>
  </section>
);
