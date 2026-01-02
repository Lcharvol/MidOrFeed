'use client';

import { useMemo } from 'react';
import { Loader2Icon } from 'lucide-react';
import { useCounterPicks } from '@/lib/hooks/use-counter-picks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CounterPickSummaryCard } from '@/app/counter-picks/components/CounterPickSummaryCard';
import { CounterPickTips } from '@/app/counter-picks/components/CounterPickTips';
import { CounterPickTable } from '@/app/counter-picks/components/CounterPickTable';

const sectionTitleClass = 'text-lg font-semibold text-foreground';
const sectionWrapperClass = 'space-y-6';

const EmptyState = ({ message }: { message: string }) => (
  <Card className="border-amber-500/40 bg-amber-500/10">
    <CardHeader>
      <CardTitle>Données indisponibles</CardTitle>
      <CardDescription>{message}</CardDescription>
    </CardHeader>
  </Card>
);

type ChampionCountersSectionProps = {
  championId: string;
  championName: string;
};

export const ChampionCountersSection = ({
  championId,
  championName,
}: ChampionCountersSectionProps) => {
  const {
    championNameMap,
    mode,
    counterData,
    pairs,
    summary,
    tips,
    isLoading,
    error,
  } = useCounterPicks(championId);

  const resolvedChampionName = useMemo(
    () => championNameMap.get(championId) ?? championName ?? championId,
    [championId, championName, championNameMap]
  );

  if (isLoading) {
    return (
      <Card aria-live="polite">
        <CardContent className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
          Analyse des contre-picks en cours…
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/30 bg-red-500/10" aria-live="polite">
        <CardHeader>
          <CardTitle>Analyse indisponible</CardTitle>
          <CardDescription>
            Impossible de récupérer les contre-picks pour le moment. Réessaie plus tard.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!counterData || pairs.length === 0 || !summary) {
    return (
      <EmptyState message="Nous n'avons pas encore assez de matchs pour proposer une analyse fiable." />
    );
  }

  const summaryHeadingId = 'summary-counter-picks';
  const tableHeadingId = 'table-counter-picks';

  return (
    <div className={sectionWrapperClass} aria-live="polite">
      <section aria-labelledby={summaryHeadingId} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 id={summaryHeadingId} className={sectionTitleClass}>
            Résumé des contres pour {resolvedChampionName}
          </h3>
        </div>
        <CounterPickSummaryCard
          championId={championId}
          championName={resolvedChampionName}
          championNameMap={championNameMap}
          summary={summary}
        />
      </section>

      {tips.length > 0 ? (
        <section aria-label="Conseils rapides" className="space-y-3">
          <h3 className={sectionTitleClass}>Conseils rapides</h3>
          <CounterPickTips championName={resolvedChampionName} tips={tips} />
        </section>
      ) : null}

      <section aria-labelledby={tableHeadingId} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 id={tableHeadingId} className={sectionTitleClass}>
            Classement des meilleurs contres
          </h3>
          <span className="text-xs text-muted-foreground">
            {pairs.length} matchup{pairs.length > 1 ? 's' : ''} analysé{pairs.length > 1 ? 's' : ''}
          </span>
        </div>
        <CounterPickTable
          championName={resolvedChampionName}
          pairs={pairs}
          championNameMap={championNameMap}
          mode={mode}
        />
      </section>
    </div>
  );
};
