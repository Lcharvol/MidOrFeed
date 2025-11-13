'use client';

import Image from 'next/image';
import { ChevronRightIcon, Loader2Icon } from 'lucide-react';
import { useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  BuildItemReference,
  ChampionBuildItemStat,
  ChampionBuildVariant,
} from '@/types';
import { useChampionBuild } from '@/lib/hooks/use-champion-build';
import { cn } from '@/lib/utils';

type ChampionBuildSectionProps = {
  championId: string;
  championName: string;
};

const formatPercentage = (value: number) =>
  `${(value * 100).toFixed(value >= 0.1 ? 1 : 2)}%`;

const formatCount = (value: number) =>
  value.toLocaleString('fr-FR', { maximumFractionDigits: 0 });

const formatUpdatedAt = (isoDate: string | null) => {
  if (!isoDate) {
    return 'Analyse mise à jour récemment';
  }
  const date = new Date(isoDate);
  return `Derniers matchs analysés le ${date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`;
};

const BuildItemIcon = ({
  item,
  size = 38,
  className,
}: {
  item: BuildItemReference;
  size?: number;
  className?: string;
}) => {
  const dimension = size;
  const placeholder = item.name.slice(0, 1).toUpperCase();
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-md border border-border/60 bg-background/80',
        className
      )}
      style={{ width: dimension, height: dimension }}
    >
      {item.image ? (
        <Image
          src={item.image}
          alt={item.name}
          width={dimension}
          height={dimension}
          className="rounded object-cover"
        />
      ) : (
        <span className="text-xs font-semibold text-muted-foreground">
          {placeholder}
        </span>
      )}
    </div>
  );
};

const ItemStatRow = ({ item }: { item: ChampionBuildItemStat }) => (
  <TableRow>
    <TableCell>
      <div className="flex items-center gap-3">
        <BuildItemIcon item={item} />
        <div>
          <p className="text-[13px] font-semibold text-foreground">{item.name}</p>
          <p className="text-[11px] text-muted-foreground">{formatCount(item.picks)} parties</p>
        </div>
      </div>
    </TableCell>
    <TableCell className="text-right text-[13px] font-semibold text-foreground">
      {formatPercentage(item.pickRate)}
    </TableCell>
    <TableCell className="text-right text-[13px] text-emerald-500">
      {formatPercentage(item.winRate)}
    </TableCell>
  </TableRow>
);

const VariantRow = ({ variant }: { variant: ChampionBuildVariant }) => (
  <TableRow>
    <TableCell>
      <div className="flex flex-wrap items-center gap-1.5">
        {variant.items.map((item, index) => (
          <div key={`${variant.items.map(({ itemId }) => itemId).join('-')}-${item.itemId}`} className="flex items-center gap-1.5">
            <BuildItemIcon item={item} />
            {index < variant.items.length - 1 ? (
              <ChevronRightIcon className="size-4 text-muted-foreground/70" aria-hidden="true" />
            ) : null}
          </div>
        ))}
      </div>
    </TableCell>
    <TableCell className="text-right text-[13px] font-semibold text-foreground">
      {formatPercentage(variant.pickRate)}
    </TableCell>
    <TableCell className="text-right text-[13px] text-emerald-500">
      {formatPercentage(variant.winRate)}
    </TableCell>
  </TableRow>
);

const LoadingState = () => (
  <Card>
    <CardContent className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
      <Loader2Icon className="size-5 animate-spin" />
      <span>Analyse des builds en cours…</span>
    </CardContent>
  </Card>
);

const ErrorState = ({ message }: { message: string }) => (
  <Card className="border-red-500/40 bg-red-500/10">
    <CardHeader>
      <CardTitle className="text-base font-semibold text-red-600">
        Impossible d’afficher le build recommandé
      </CardTitle>
      <CardDescription className="text-sm text-red-600/80">
        {message}
      </CardDescription>
    </CardHeader>
  </Card>
);

const EmptyState = ({ championName }: { championName: string }) => (
  <Card className="border-amber-500/40 bg-amber-500/10">
    <CardHeader>
      <CardTitle className="text-base font-semibold text-amber-700">
        Données insuffisantes
      </CardTitle>
      <CardDescription className="text-sm text-amber-700/80">
        Nous n’avons pas encore assez de parties récentes pour proposer un build
        fiable pour {championName}.
      </CardDescription>
    </CardHeader>
  </Card>
);

export const ChampionBuildSection = ({
  championId,
  championName,
}: ChampionBuildSectionProps) => {
  const { build, isLoading, error } = useChampionBuild(championId);

  const summary = useMemo(() => {
    if (!build) {
      return {
        subtitle: `Analyse automatique des builds pour ${championName}`,
        details: null as string | null,
      };
    }
    const detail =
      build.sampleSize > 0
        ? `${formatCount(build.sampleSize)} parties analysées · ${formatUpdatedAt(build.lastMatchAt)}`
        : null;
    return {
      subtitle: `Optimise ton build sur ${championName} avec les données des dernières parties classées.`,
      details: detail,
    };
  }, [build, championName]);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={error} />;
  }

  if (!build || build.sampleSize === 0) {
    return <EmptyState championName={championName} />;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold text-foreground">Builds recommandés</h3>
        <p className="text-[13px] text-muted-foreground">{summary.subtitle}</p>
        {summary.details ? (
          <p className="text-[11px] text-muted-foreground/80">{summary.details}</p>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="border border-border/60 bg-background/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Builds de base</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Combinaisons d’objets les plus jouées.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            {build.popularBuilds.length > 0 ? (
              <Table className="text-[13px]">
                <TableHeader>
                  <TableRow className="border-border/60 bg-background/60">
                    <TableHead>Build</TableHead>
                    <TableHead className="text-right">Sélection</TableHead>
                    <TableHead className="text-right">Victoire</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {build.popularBuilds.map((variant) => (
                    <VariantRow key={variant.items.map((item) => item.itemId).join('-')} variant={variant} />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                Pas encore assez de données pour proposer un build complet.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-border/60 bg-background/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Objets clés</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Les objets les plus performants pour {championName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="border-border/60 bg-background/60">
                  <TableHead>Objet</TableHead>
                  <TableHead className="text-right">Sélection</TableHead>
                  <TableHead className="text-right">Victoire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {build.coreItems.map((item) => (
                  <ItemStatRow key={`core-${item.itemId}`} item={item} />
                ))}
                {build.situationalItems.length > 0 ? (
                  <TableRow className="bg-muted/10">
                    <TableCell colSpan={3} className="py-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                      Objets situationnels
                    </TableCell>
                  </TableRow>
                ) : null}
                {build.situationalItems.map((item) => (
                  <ItemStatRow key={`situational-${item.itemId}`} item={item} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {build.bootOptions.length > 0 ? (
        <Card className="border border-border/60 bg-background/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-foreground">Bottes favorites</CardTitle>
          </CardHeader>
          <CardContent className="pb-2">
            <Table className="text-[13px]">
              <TableHeader>
                <TableRow className="border-border/60 bg-background/60">
                  <TableHead>Bottes</TableHead>
                  <TableHead className="text-right">Sélection</TableHead>
                  <TableHead className="text-right">Victoire</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {build.bootOptions.map((item) => (
                  <ItemStatRow key={`boots-${item.itemId}`} item={item} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
};


