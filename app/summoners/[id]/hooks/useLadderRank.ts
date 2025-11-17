"use client";

import { useMemo } from "react";

type SoloRanked = {
  current: {
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
    winRate: number;
  };
} | null;

export const useLadderRank = (solo: SoloRanked) => {
  // Approximation du rang ladder basé sur le tier et LP
  const ladderRank = useMemo(() => {
    if (!solo?.current) return null;
    const tier = solo.current.tier.toUpperCase();
    const lp = solo.current.lp;

    // Approximation basée sur les statistiques générales de League of Legends
    const tierBaseRanks: Record<string, number> = {
      IRON: 1000000,
      BRONZE: 800000,
      SILVER: 600000,
      GOLD: 400000,
      PLATINUM: 200000,
      EMERALD: 100000,
      DIAMOND: 50000,
      MASTER: 10000,
      GRANDMASTER: 3000,
      CHALLENGER: 1000,
    };

    const baseRank = tierBaseRanks[tier] || 1000000;
    // Plus le LP est élevé dans le tier, meilleur est le rang
    const lpAdjustment =
      tier === "CHALLENGER" ? 0 : ((100 - lp) / 100) * baseRank * 0.3;

    return Math.max(1, Math.round(baseRank - lpAdjustment));
  }, [solo]);

  // Calcul du pourcentage du top (approximation)
  const topPercentage = useMemo(() => {
    if (!ladderRank) return null;
    // Estimation: environ 100 millions de joueurs actifs
    const estimatedTotalPlayers = 100000000;
    return ((estimatedTotalPlayers - ladderRank) / estimatedTotalPlayers) * 100;
  }, [ladderRank]);

  return {
    ladderRank,
    topPercentage,
  };
};

