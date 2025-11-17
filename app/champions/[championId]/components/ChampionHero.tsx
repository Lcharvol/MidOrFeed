'use client';

import Image from 'next/image';
import { ColorBadge } from '@/components/ui/badge';
import { TierBadge } from '@/components/TierBadge';
import type { ChampionEntity } from '@/types';
import type { ChampionSummary } from '@/app/champions/hooks/useChampionSummary';
import { cn } from '@/lib/utils';

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const formatNumber = (value: number) =>
  value.toLocaleString('fr-FR', {
    maximumFractionDigits: value < 10 ? 1 : value < 100 ? 1 : 0,
  });

const ProgressBar = ({
  label,
  baseValue,
  perLevelValue,
  level18Value,
  reference,
  color,
}: {
  label: string;
  baseValue: number;
  perLevelValue?: number;
  level18Value: number;
  reference: number;
  color: 'emerald' | 'sky';
}) => {
  const ratio = clamp(reference > 0 ? level18Value / reference : 0, 0, 1);

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center justify-between gap-1 text-xs uppercase tracking-wide text-muted-foreground">
        <span>{label}</span>
        <span className="font-semibold text-foreground">
          {formatNumber(baseValue)}
          {perLevelValue && perLevelValue !== 0 ? (
            <span className="ml-2 font-normal text-muted-foreground">
              (+{formatNumber(perLevelValue)} / niv)
            </span>
          ) : null}
        </span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted/40">
        <div
          className={cn('h-full rounded-full transition-all duration-300', {
            'bg-emerald-500/70': color === 'emerald',
            'bg-sky-500/70': color === 'sky',
          })}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-[0.65rem] text-muted-foreground/80">
        <span>Niv 18 : {formatNumber(level18Value)}</span>
        <span>Réf. max : {formatNumber(reference)}</span>
      </div>
    </div>
  );
};

type ChampionHeroProps = {
  champion: ChampionEntity;
  summary: ChampionSummary;
  splashUrl: string;
  maxHpReference: number;
  maxMpReference: number;
};

export const ChampionHero = ({
  champion,
  summary,
  splashUrl,
  maxHpReference,
  maxMpReference,
}: ChampionHeroProps) => {
  const RoleIcon = summary.roleMeta.Icon;
  const usesMana = champion.mp !== null;
  const manaBase = champion.mp ?? 0;
  const manaPerLevel = champion.mpPerLevel ?? 0;

  const hpLevel18 = champion.hp + champion.hpPerLevel * 17;
  const mpLevel18 = usesMana ? manaBase + manaPerLevel * 17 : 0;

  const effectiveHpReference = Math.max(maxHpReference, hpLevel18);
  const effectiveMpReference = usesMana
    ? Math.max(maxMpReference, mpLevel18, 1)
    : maxMpReference;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-background shadow-xl">
      <Image
        src={splashUrl}
        alt={`Illustration de ${champion.name}`}
        width={640}
        height={360}
        className="h-auto w-full object-cover"
        priority
      />
      <div className="space-y-5 p-6">
        <div className="space-y-1">
          <h1 id="champion-heading" className="text-3xl font-bold tracking-tight text-foreground">
            {champion.name}
          </h1>
          <p className="text-sm text-muted-foreground">{champion.title}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <ColorBadge
            variant="subtle"
            emphasis="info"
            leadingIcon={<RoleIcon className="size-4" aria-hidden="true" />}
          >
            {summary.roleMeta.label}
          </ColorBadge>
          <TierBadge tier={summary.tier} variant="subtle" />
          {summary.score !== null ? (
            <ColorBadge variant="subtle" emphasis={summary.scoreEmphasis}>
              Score {summary.scoreLabel}
            </ColorBadge>
          ) : null}
        </div>

        <div className="space-y-5 rounded-xl border border-border/50 bg-muted/20 p-4">
          <ProgressBar
            label="Points de vie"
            baseValue={champion.hp}
            perLevelValue={champion.hpPerLevel}
            level18Value={hpLevel18}
            reference={effectiveHpReference}
            color="emerald"
          />
          {usesMana ? (
            <ProgressBar
              label="Mana"
              baseValue={manaBase}
              perLevelValue={manaPerLevel}
              level18Value={mpLevel18}
              reference={effectiveMpReference}
              color="sky"
            />
          ) : (
            <p className="rounded-lg bg-background/70 px-3 py-2 text-xs font-medium text-muted-foreground">
              Ce champion n’utilise pas de ressource de mana.
            </p>
          )}
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span className="rounded-full bg-background/80 px-3 py-1 font-medium">
              ATQ {champion.attack.toFixed(0)}
            </span>
            <span className="rounded-full bg-background/80 px-3 py-1 font-medium">
              DEF {champion.defense.toFixed(0)}
            </span>
            <span className="rounded-full bg-background/80 px-3 py-1 font-medium">
              MAG {champion.magic.toFixed(0)}
            </span>
            <span className="rounded-full bg-background/80 px-3 py-1 font-medium">
              Difficulté {champion.difficulty.toFixed(0)}
            </span>
          </div>
        </div>

        {champion.blurb ? (
          <p className="text-sm leading-relaxed text-muted-foreground/90">{champion.blurb}</p>
        ) : null}
      </div>
    </div>
  );
};
