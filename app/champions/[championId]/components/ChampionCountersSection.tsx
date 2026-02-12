'use client';

import { useMemo } from 'react';
import { Loader2Icon, BarChart3Icon, TrophyIcon, SwordsIcon } from 'lucide-react';
import { useCounterPicks } from '@/lib/hooks/use-counter-picks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { StatTile } from '@/components/ui/stat-tile';
import { ChampionIcon } from '@/components/ChampionIcon';
import { CounterPickPodium } from '@/app/counter-picks/components/CounterPickPodium';
import { CounterPickTable } from '@/app/counter-picks/components/CounterPickTable';
import { formatPercent, formatNumber } from '@/app/counter-picks/utils';
import { useI18n } from '@/lib/i18n-context';

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
  const { t } = useI18n();
  const {
    championNameMap,
    mode,
    counterData,
    pairs,
    summary,
    isLoading,
    error,
  } = useCounterPicks(championId);

  const resolvedChampionName = useMemo(
    () => championNameMap.get(championId) ?? championName ?? championId,
    [championId, championName, championNameMap]
  );

  const bestCounterName = summary?.bestCounterId
    ? championNameMap.get(summary.bestCounterId) ?? summary.bestCounterId
    : null;

  if (isLoading) {
    return (
      <Card aria-live="polite">
        <CardContent className="flex items-center justify-center gap-3 py-12 text-muted-foreground">
          <Loader2Icon className="size-5 animate-spin" />
          {t("counterPicks.loading")}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-red-500/30 bg-red-500/10" aria-live="polite">
        <CardHeader>
          <CardTitle>{t("counterPicks.errorLoading")}</CardTitle>
          <CardDescription>
            {t("counterPicks.errorGeneric").replace("{championName}", resolvedChampionName)}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!counterData || pairs.length === 0 || !summary) {
    return (
      <EmptyState message={t("counterPicks.insufficientDataDescription").replace("{championName}", resolvedChampionName)} />
    );
  }

  const summaryHeadingId = 'summary-counter-picks';
  const tableHeadingId = 'table-counter-picks';

  return (
    <div className={sectionWrapperClass} aria-live="polite">
      <section aria-labelledby={summaryHeadingId} className="space-y-4">
        <h3 id={summaryHeadingId} className={sectionTitleClass}>
          {t("counterPicks.counterTitle").replace("{championName}", resolvedChampionName)}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile
            label={t("counterPicks.overallWinRate")}
            value={formatPercent(summary.overallWinRate)}
            hint={`${formatNumber(summary.championWins)} V / ${formatNumber(summary.championLosses)} D`}
            icon={<BarChart3Icon className="size-5" />}
            emphasis={summary.overallWinRate >= 0.5 ? "positive" : "danger"}
            dense
          />
          <StatTile
            label={t("counterPicks.bestCounter")}
            value={
              bestCounterName ? (
                <span className="flex items-center gap-2">
                  <ChampionIcon
                    championId={summary.bestCounterId!}
                    size={24}
                    shape="circle"
                    className="border border-success/30"
                  />
                  {bestCounterName}
                </span>
              ) : (
                "—"
              )
            }
            icon={<TrophyIcon className="size-5" />}
            emphasis="positive"
            dense
          />
          <StatTile
            label={t("counterPicks.reliableMatchups")}
            value={summary.reliableMatchups}
            hint={t("counterPicks.matchesAnalyzed").replace("{count}", formatNumber(summary.gamesAnalysed))}
            icon={<SwordsIcon className="size-5" />}
            emphasis="info"
            dense
          />
        </div>
      </section>

      <CounterPickPodium pairs={pairs} championNameMap={championNameMap} />

      <section aria-labelledby={tableHeadingId} className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 id={tableHeadingId} className={sectionTitleClass}>
            {t("counterPicks.counterRanking")}
          </h3>
          <span className="text-xs text-muted-foreground">
            {t("counterPicks.matchupsCount").replace("{count}", String(pairs.length))}
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
