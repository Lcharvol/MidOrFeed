import type { RecentMatchEntry } from "../RecentMatchesSection";
import type { SummaryStats, ChampionStat, RoleData } from "./types";
import { ROLE_ORDER, ROLE_LABELS } from "./constants";

export const calculateSummaryStats = (
  matches: RecentMatchEntry[]
): SummaryStats | null => {
  if (matches.length === 0) {
    return null;
  }

  const wins = matches.filter((m) => m.win).length;
  const losses = matches.length - wins;
  const winRate = (wins / matches.length) * 100;

  const totalKills = matches.reduce((acc, m) => acc + m.kills, 0);
  const totalDeaths = matches.reduce((acc, m) => acc + m.deaths, 0);
  const totalAssists = matches.reduce((acc, m) => acc + m.assists, 0);

  const avgKills = totalKills / matches.length;
  const avgDeaths = totalDeaths / matches.length;
  const avgAssists = totalAssists / matches.length;
  const kdaRatio =
    totalDeaths === 0
      ? totalKills + totalAssists
      : (totalKills + totalAssists) / totalDeaths;
  const pKill =
    totalKills + totalAssists === 0
      ? 0
      : (totalKills / (totalKills + totalAssists)) * 100;

  return {
    total: matches.length,
    wins,
    losses,
    winRate,
    kills: avgKills,
    deaths: avgDeaths,
    assists: avgAssists,
    kdaRatio,
    pKill,
  };
};

export const calculateChampionStats = (
  matches: RecentMatchEntry[]
): ChampionStat[] => {
  const statsMap = new Map<
    string,
    {
      wins: number;
      losses: number;
      kills: number;
      deaths: number;
      assists: number;
    }
  >();

  matches.forEach((match) => {
    const existing = statsMap.get(match.championId) || {
      wins: 0,
      losses: 0,
      kills: 0,
      deaths: 0,
      assists: 0,
    };

    if (match.win) {
      existing.wins++;
    } else {
      existing.losses++;
    }
    existing.kills += match.kills;
    existing.deaths += match.deaths;
    existing.assists += match.assists;

    statsMap.set(match.championId, existing);
  });

  return Array.from(statsMap.entries())
    .map(([championId, stats]) => {
      const winRate =
        stats.wins + stats.losses === 0
          ? 0
          : (stats.wins / (stats.wins + stats.losses)) * 100;
      const kdaRatio =
        stats.deaths === 0
          ? stats.kills + stats.assists
          : (stats.kills + stats.assists) / stats.deaths;
      return {
        championId,
        wins: stats.wins,
        losses: stats.losses,
        winRate,
        kdaRatio,
      };
    })
    .sort((a, b) => b.wins + b.losses - (a.wins + a.losses))
    .slice(0, 3);
};

export const calculateRoleData = (
  rolePerformance: Array<{
    role: string;
    stats: { played: number };
  }>
): RoleData[] => {
  return ROLE_ORDER.map((role) => {
    const roleEntry = rolePerformance.find((r) => r.role === role);
    const maxGames = Math.max(...rolePerformance.map((r) => r.stats.played), 1);
    const games = roleEntry?.stats.played || 0;
    return {
      role: ROLE_LABELS[role] || role,
      games,
      percentage: (games / maxGames) * 100,
    };
  });
};
