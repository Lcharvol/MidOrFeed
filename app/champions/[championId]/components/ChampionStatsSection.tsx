'use client';

import type { ChampionSummary } from '@/app/champions/hooks/useChampionSummary';
import { cn } from '@/lib/utils';

type EmphasisKey = 'neutral' | 'info' | 'positive' | 'warning' | 'danger';

const gradientByEmphasis: Record<EmphasisKey, string> = {
  neutral:
    'from-background via-muted/30 to-background',
  info:
    'from-info-muted/60 via-info-muted/30 to-background dark:from-info-muted/40 dark:via-info-muted/20 dark:to-background',
  positive:
    'from-success-muted/60 via-success-muted/30 to-background dark:from-success-muted/40 dark:via-success-muted/20 dark:to-background',
  warning:
    'from-warning-muted/60 via-warning-muted/30 to-background dark:from-warning-muted/40 dark:via-warning-muted/20 dark:to-background',
  danger:
    'from-danger-muted/60 via-danger-muted/30 to-background dark:from-danger-muted/40 dark:via-danger-muted/20 dark:to-background',
};

const borderByEmphasis: Record<EmphasisKey, string> = {
  neutral: 'border-border/70',
  info: 'border-info/40',
  positive: 'border-success/40',
  warning: 'border-warning/40',
  danger: 'border-danger/40',
};

type ChampionStatsSectionProps = {
  summary: ChampionSummary;
};

export const ChampionStatsSection = ({ summary }: ChampionStatsSectionProps) => (
  <section aria-label="Statistiques principales" className="space-y-2.5">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {summary.statsTiles.map((tile, index) => (
        <div
          key={tile.key}
          className={cn(
            'relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 shadow-md shadow-black/10 backdrop-blur-sm transition duration-300 ease-out hover:-translate-y-0.5 hover:shadow-black/20 dark:shadow-black/20 dark:hover:shadow-black/30',
            gradientByEmphasis[(tile.emphasis as EmphasisKey) ?? 'neutral'],
            borderByEmphasis[(tile.emphasis as EmphasisKey) ?? 'neutral'],
            tile.subdued && 'opacity-90 hover:opacity-100'
          )}
          style={{ transitionDelay: `${index * 40}ms` }}
        >
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-700/80 dark:text-white/60">
              {tile.label}
            </p>
            <p className="text-2xl font-semibold text-slate-900 dark:text-white drop-shadow-sm">
              {tile.value}
            </p>
            {tile.hint ? (
              <p className="text-[11px] leading-relaxed text-slate-600/80 dark:text-white/70">
                {tile.hint}
              </p>
            ) : null}
          </div>
          {tile.subdued ? (
            <div className="mt-3 rounded-lg border border-slate-900/10 bg-slate-900/5 px-2.5 py-1.5 text-[10px] font-medium text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-white/70">
              Données indicatives (échantillon faible)
            </div>
          ) : null}
          <div className="pointer-events-none absolute inset-0 rounded-2xl border border-white/30 dark:border-white/10" />
        </div>
      ))}
    </div>
    {!summary.hasReliableStats ? (
      <p className="text-xs text-muted-foreground/80">
        Certaines statistiques sont basées sur un faible nombre de parties et peuvent varier fortement.
      </p>
    ) : null}
  </section>
);
