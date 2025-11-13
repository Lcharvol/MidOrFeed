'use client';

import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const formatNumber = (value: number, digits = 1) =>
  value.toLocaleString('fr-FR', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

const formatLargeNumber = (value: number) =>
  value.toLocaleString('fr-FR', {
    maximumFractionDigits: 0,
  });

type HighlightEntry = {
  label: string;
  value: string;
  hint?: string;
};

type PerformanceHighlightsProps = {
  entries: HighlightEntry[];
  averages?: {
    kills: number;
    deaths: number;
    assists: number;
    damage: number;
    gold: number;
    vision: number;
  };
  averageDurationLabel?: string | null;
};

export const PerformanceHighlights = ({
  entries,
  averages,
  averageDurationLabel,
}: PerformanceHighlightsProps) => {
  // Filtrer les entrées pour exclure Éliminations, Morts et Assistances (affichées dans le radar chart)
  const filteredEntries = useMemo(() => {
    const excludedLabels = ['Éliminations', 'Morts', 'Assistances'];
    return entries.filter((entry) => !excludedLabels.includes(entry.label));
  }, [entries]);

  return (
    <Card className="border-border/70 bg-background/90 shadow-sm">
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm font-semibold text-foreground">
          Impact moyen par partie
        </CardTitle>
        <CardDescription className="text-xs">
          Indicateurs clés calculés sur vos dernières parties analysées.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pb-3 pt-0">
        {filteredEntries.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-3">
            {filteredEntries.map((entry) => (
              <div
                key={entry.label}
                className="rounded-lg border border-border/60 bg-background/80 px-3 py-2"
              >
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                  {entry.label}
                </p>
                <p className="mt-0.5 text-lg font-semibold text-foreground">
                  {entry.value}
                </p>
                {entry.hint ? (
                  <p className="mt-0.5 text-xs text-muted-foreground">{entry.hint}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        {averageDurationLabel ? (
          <p className="text-right text-xs text-muted-foreground">
            Durée moyenne des parties :
            <span className="ml-1 font-semibold text-foreground">
              {averageDurationLabel}
            </span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
};

export const buildPerformanceEntries = (
  averages: {
    kills: number;
    deaths: number;
    assists: number;
    damage: number;
    gold: number;
    vision: number;
  }
): HighlightEntry[] => [
  {
    label: 'Éliminations',
    value: formatNumber(averages.kills),
    hint: 'Par partie',
  },
  {
    label: 'Morts',
    value: formatNumber(averages.deaths),
    hint: 'Par partie',
  },
  {
    label: 'Assistances',
    value: formatNumber(averages.assists),
    hint: 'Par partie',
  },
  {
    label: 'Dégâts aux champions',
    value: formatLargeNumber(averages.damage),
    hint: 'Par match',
  },
  {
    label: 'Golds gagnés',
    value: formatLargeNumber(averages.gold),
    hint: 'Par match',
  },
  {
    label: 'Score de vision',
    value: formatNumber(averages.vision),
    hint: 'Par partie',
  },
];
