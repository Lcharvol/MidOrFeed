'use client';

import type { ChampionSummary } from '@/app/champions/hooks/useChampionSummary';
import { cn } from '@/lib/utils';

type EmphasisKey = 'neutral' | 'info' | 'positive' | 'warning' | 'danger';

const gradientByEmphasis: Record<EmphasisKey, string> = {
  neutral:
    'from-white/70 via-white/40 to-white/70 dark:from-zinc-800/50 dark:via-zinc-800/20 dark:to-zinc-900/50',
  info:
    'from-sky-200/60 via-sky-100/30 to-white/70 dark:from-sky-500/20 dark:via-sky-500/8 dark:to-sky-950/40',
  positive:
    'from-emerald-200/60 via-emerald-100/30 to-white/70 dark:from-emerald-500/20 dark:via-emerald-500/8 dark:to-emerald-950/40',
  warning:
    'from-amber-200/60 via-amber-100/30 to-white/70 dark:from-amber-500/20 dark:via-amber-500/8 dark:to-amber-950/40',
  danger:
    'from-rose-200/60 via-rose-100/25 to-white/70 dark:from-rose-600/25 dark:via-rose-500/10 dark:to-rose-950/40',
};

const borderByEmphasis: Record<EmphasisKey, string> = {
  neutral: 'border-zinc-200/70 dark:border-zinc-700/50',
  info: 'border-sky-300/60 dark:border-sky-500/45',
  positive: 'border-emerald-300/60 dark:border-emerald-500/45',
  warning: 'border-amber-300/60 dark:border-amber-500/50',
  danger: 'border-rose-300/60 dark:border-rose-500/50',
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
