'use client';

import { useMemo } from 'react';
import {
  computeChampionScore,
  resolveTier,
  getRoleMeta,
  formatNumber,
  formatPercentage,
  formatKDA,
  getScoreEmphasis,
  getWinRateEmphasis,
} from '@/app/tier-list/champions/utils';
import type { ChampionEntity, RoleMeta, TierListChampionStats } from '@/types';

type Emphasis = 'neutral' | 'positive' | 'warning' | 'danger' | 'info';

type StatTileDescriptor = {
  key: string;
  label: string;
  value: string;
  hint?: string;
  emphasis: Emphasis;
  subdued?: boolean;
};

type BaseStatDescriptor = {
  label: string;
  value: number;
};

type CharacteristicDescriptor = {
  label: string;
  value: string;
};

type OverviewStat = {
  label: string;
  value: string;
  emphasis: Emphasis;
};

type ChampionSummary = {
  roleMeta: RoleMeta;
  tier: string;
  score: number | null;
  scoreLabel: string;
  scoreEmphasis: Emphasis;
  statsTiles: StatTileDescriptor[];
  baseStats: BaseStatDescriptor[];
  characteristics: CharacteristicDescriptor[];
  overviewStats: OverviewStat[];
  hasStats: boolean;
  hasReliableStats: boolean;
};

export type { ChampionSummary };

export const useChampionSummary = (
  champion: ChampionEntity,
  stats?: TierListChampionStats
): ChampionSummary =>
  useMemo(() => {
    const roleMeta = getRoleMeta(stats?.topRole ?? stats?.topLane ?? null);
    const tier = resolveTier(stats);
    const score = computeChampionScore(stats);
    const scoreLabel =
      typeof score === 'number' && Number.isFinite(score) ? score.toFixed(1) : '—';
    const scoreEmphasis = getScoreEmphasis(score) as Emphasis;

    const totalGames = stats?.totalGames ?? 0;
    const totalWins = stats?.totalWins ?? 0;
    const totalLosses = stats?.totalLosses ?? 0;
    const winRateValue = stats?.winRate ?? 0;
    const kdaValue = stats?.avgKDA ?? 0;

    const reliableStats = totalGames >= 10;

    const statsTiles: StatTileDescriptor[] = [
      {
        key: 'matches',
        label: 'Matchs analysés',
        value: formatNumber(totalGames),
        hint: `${formatNumber(totalWins)} victoires · ${formatNumber(totalLosses)} défaites`,
        emphasis: 'info',
      },
      {
        key: 'winRate',
        label: 'Win rate',
        value: formatPercentage(winRateValue),
        emphasis: getWinRateEmphasis(winRateValue) as Emphasis,
        subdued: !reliableStats,
      },
      {
        key: 'kda',
        label: 'KDA moyen',
        value: formatKDA(kdaValue),
        hint: `${formatNumber(stats?.avgKills ?? 0)} / ${formatNumber(
          stats?.avgDeaths ?? 0
        )} / ${formatNumber(stats?.avgAssists ?? 0)}`,
        emphasis: 'neutral',
        subdued: !reliableStats,
      },
      {
        key: 'score',
        label: 'Score Mid or Feed',
        value: scoreLabel,
        emphasis: scoreEmphasis,
        subdued: !reliableStats,
      },
    ];

    const baseStats: BaseStatDescriptor[] = [
      { label: 'ATT', value: champion.attack },
      { label: 'DEF', value: champion.defense },
      { label: 'MAG', value: champion.magic },
      { label: 'Difficulté', value: champion.difficulty },
    ];

    const characteristics: CharacteristicDescriptor[] = [
      {
        label: 'HP',
        value: `${formatNumber(champion.hp)} (+${formatNumber(
          champion.hpPerLevel
        )} / niveau)`,
      },
      {
        label: 'Mana',
        value:
          champion.mp !== null
            ? `${formatNumber(champion.mp)} (+${formatNumber(
                champion.mpPerLevel ?? 0
              )} / niveau)`
            : '—',
      },
      {
        label: 'Attaque',
        value: `${formatNumber(champion.attackDamage)} (+${formatNumber(
          champion.attackDamagePerLevel
        )} / niveau)`,
      },
      {
        label: 'Vitesse d’attaque',
        value: `${formatNumber(champion.attackSpeed)} (+${formatNumber(
          champion.attackSpeedPerLevel
        )} / niveau)`,
      },
    ];

    const overviewStats: OverviewStat[] = [
      {
        label: 'HP',
        value: `${formatNumber(champion.hp)} / +${formatNumber(
          champion.hpPerLevel
        )}`,
        emphasis: 'neutral',
      },
      {
        label: 'Mana',
        value:
          champion.mp !== null
            ? `${formatNumber(champion.mp)} / +${formatNumber(
                champion.mpPerLevel ?? 0
              )}`
            : '—',
        emphasis: 'info',
      },
    ];

    return {
      roleMeta,
      tier,
      score,
      scoreLabel,
      scoreEmphasis,
      statsTiles,
      baseStats,
      characteristics,
      overviewStats,
      hasStats: totalGames > 0,
      hasReliableStats: reliableStats,
    } satisfies ChampionSummary;
  }, [champion, stats]);
