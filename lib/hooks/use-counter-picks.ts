"use client";

import { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import type { CounterPickPair, CounterPickResponse } from "@/types";
import { useApiSWR } from "./swr";
import { useChampions } from "./use-champions";
import type { ApiResponse } from "@/types";
import { apiKeys } from "@/lib/api/keys";
import { validateCounterPickResponse } from "@/lib/api/schemas";

export type CounterPickSummary = {
  totalMatches: number;
  gamesAnalysed: number;
  championWins: number;
  championLosses: number;
  lastPlayed: number | null;
  overallWinRate: number;
  bestCounterId: string | null;
  bestCounterWinRate: number;
  bestCounterGames: number;
  reliableMatchups: number;
};

export const useCounterPicks = (initialChampionId: string) => {
  const [selectedChampion, setSelectedChampion] = useState(
    initialChampionId ?? ""
  );

  const {
    championSummaries,
    championNameMap,
    resolveName,
    isLoading: championsLoading,
    error: championsError,
  } = useChampions();

  const {
    data,
    isLoading: counterLoading,
    error: counterError,
    mutate,
    isValidating,
  } = useApiSWR<ApiResponse<CounterPickResponse>>(
    selectedChampion ? apiKeys.counterPicks(selectedChampion) : null,
    {
      refreshInterval: 120_000,
      revalidateOnFocus: false,
      revalidateIfStale: true,
    }
  );

  const validation = useMemo(
    () => (data ? validateCounterPickResponse(data) : null),
    [data]
  );

  const counterData = useMemo(() => {
    if (!validation || !validation.ok) return null;
    return validation.value;
  }, [validation]);

  const pairs = useMemo<CounterPickPair[]>(
    () => (counterData ? counterData.pairs : []),
    [counterData]
  );

  const summary = useMemo<CounterPickSummary | null>(() => {
    if (!counterData || pairs.length === 0) return null;

    const aggregates = pairs.reduce(
      (acc, pair) => ({
        games: acc.games + pair.games,
        championWins: acc.championWins + pair.losses,
        championLosses: acc.championLosses + pair.wins,
        lastPlayed: Math.max(acc.lastPlayed, Number(pair.lastPlayedAt)),
      }),
      { games: 0, championWins: 0, championLosses: 0, lastPlayed: 0 }
    );

    const best = pairs[0];

    return {
      totalMatches: counterData.totalMatches,
      gamesAnalysed: aggregates.games,
      championWins: aggregates.championWins,
      championLosses: aggregates.championLosses,
      lastPlayed: aggregates.lastPlayed > 0 ? aggregates.lastPlayed : null,
      overallWinRate:
        aggregates.games > 0 ? aggregates.championWins / aggregates.games : 0,
      bestCounterId: best?.enemyChampionId ?? null,
      bestCounterWinRate: best?.winRate ?? 0,
      bestCounterGames: best?.games ?? 0,
      reliableMatchups: pairs.length,
    };
  }, [counterData, pairs]);

  const tips = useMemo(() => {
    if (!counterData || pairs.length === 0) return [] as string[];
    const top = pairs[0];
    const second = pairs[1];
    const third = pairs[2];
    return [
      top
        ? `Priorise l’interdiction ou le couter pick de ${resolveName(
            top.enemyChampionId
          )}, qui affiche ${(top.winRate * 100).toFixed(1)}% de victoires sur ${
            top.games
          } matchs.`
        : null,
      second
        ? `${resolveName(
            second.enemyChampionId
          )} domine les matchs prolongés (${(second.winRate * 100).toFixed(
            1
          )}%). Prends l’avantage tôt ou évite les teamfights prolongés.`
        : null,
      third
        ? `Les junglers agressifs comme ${resolveName(
            third.enemyChampionId
          )} punissent dès le niveau 3. Prévois de la vision profonde et un plan défensif.`
        : null,
    ].filter(Boolean) as string[];
  }, [counterData, pairs, resolveName]);

  const handleChampionChange = useCallback(
    (championId: string) => {
      if (!championNameMap.has(championId)) {
        toast.error(
          "Champion introuvable. Utilise le sélecteur pour choisir un champion."
        );
        return;
      }
      setSelectedChampion(championId);
    },
    [championNameMap]
  );

  return {
    championSummaries,
    championNameMap,
    selectedChampion,
    setSelectedChampion: handleChampionChange,
    counterData,
    pairs,
    summary,
    tips,
    isLoading: championsLoading || counterLoading,
    isValidating,
    error:
      championsError ||
      counterError ||
      (validation && !validation.ok ? validation.error : undefined),
    mutate,
  };
};
