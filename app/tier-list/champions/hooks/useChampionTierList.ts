import { useMemo, useState, useCallback } from "react";
import type {
  TierListChampionWithStats,
  SortColumn,
  SortDirection,
  RoleKey,
  TierListChampionStats,
} from "@/types";
import { MATCHES_FETCH_LIMIT } from "@/constants/matches";
import { computeChampionScore, normalizeRoleKey, resolveTier } from "../utils";
import { useChampions } from "@/lib/hooks/use-champions";
import { useChampionStats } from "@/lib/hooks/use-champion-stats";

type RoleFilter = RoleKey | "ALL";

export type TierListState = {
  searchTerm: string;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
  roleFilter: RoleFilter;
  reliabilityOnly: boolean;
  eliteOnly: boolean;
};

export type TierListActions = {
  setSearchTerm: (value: string) => void;
  setRoleFilter: (value: RoleFilter) => void;
  setReliabilityOnly: (value: boolean) => void;
  toggleEliteOnly: () => void;
  resetFilters: () => void;
  handleSort: (column: SortColumn) => void;
  toggleWinRateSort: () => void;
};

export type TierListDerived = {
  championsWithStats: TierListChampionWithStats[];
  sortedChampions: TierListChampionWithStats[];
  totalMatches: number;
  reliableChampionCount: number;
  averageWinRate: number;
  formattedLastUpdated: string;
  filtersActive: boolean;
  isWinRateSort: boolean;
  isLoading: boolean;
  error: unknown;
};

export type UseChampionTierListReturn = {
  state: TierListState;
  actions: TierListActions;
  derived: TierListDerived;
};

export const useChampionTierList = (): UseChampionTierListReturn => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [reliabilityOnly, setReliabilityOnly] = useState(false);
  const [eliteOnly, setEliteOnly] = useState(false);

  const {
    champions,
    championNameMap,
    isLoading: championsLoading,
    error: championsError,
  } = useChampions();

  const {
    championStats,
    isLoading: statsLoading,
    error: statsError,
  } = useChampionStats();

  const statsMap = useMemo(() => {
    const map = new Map<string, TierListChampionStats>();
    championStats.forEach((stat) => {
      map.set(stat.championId, stat);
    });
    return map;
  }, [championStats]);

  const championsWithStats = useMemo<TierListChampionWithStats[]>(
    () =>
      champions.map((champion) => ({
        ...champion,
        stats: statsMap.get(champion.championId),
      })),
    [champions, statsMap]
  );

  const totalMatches = useMemo(
    () => championStats.reduce((acc, stat) => acc + (stat.totalGames ?? 0), 0),
    [championStats]
  );

  const reliableChampionCount = useMemo(
    () =>
      championStats.filter(
        (stat) => (stat.totalGames ?? 0) >= MATCHES_FETCH_LIMIT
      ).length,
    [championStats]
  );

  const averageWinRate = useMemo(() => {
    if (championStats.length === 0) return 0;
    const total = championStats.reduce(
      (acc, stat) => acc + (stat.winRate ?? 0),
      0
    );
    return total / championStats.length;
  }, [championStats]);

  const lastUpdated = useMemo(() => {
    if (championStats.length === 0) return null;
    const latest = championStats.reduce((latestDate, stat) => {
      const current = new Date(stat.lastAnalyzedAt).getTime();
      return current > latestDate ? current : latestDate;
    }, 0);
    return latest ? new Date(latest) : null;
  }, [championStats]);

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return "—";
    return lastUpdated.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lastUpdated]);

  const handleSort = useCallback(
    (column: SortColumn) => {
      if (sortColumn === column) {
        if (sortDirection === "asc") {
          setSortDirection("desc");
        } else if (sortDirection === "desc") {
          setSortColumn(null);
          setSortDirection(null);
        } else {
          setSortDirection("asc");
        }
      } else {
        setSortColumn(column);
        setSortDirection("asc");
      }
    },
    [sortColumn, sortDirection]
  );

  const sortedChampions = useMemo(() => {
    let filtered = championsWithStats.filter((champion) => {
      const stats = champion.stats;
      if (reliabilityOnly && (stats?.totalGames ?? 0) < MATCHES_FETCH_LIMIT) {
        return false;
      }
      if (roleFilter !== "ALL") {
        const normalizedRole = normalizeRoleKey(
          stats?.topRole ?? stats?.topLane ?? undefined
        );
        if (!normalizedRole || normalizedRole !== roleFilter) {
          return false;
        }
      }
      if (eliteOnly) {
        const tier = resolveTier(stats);
        if (!["S", "S+"].includes(tier)) {
          return false;
        }
      }
      const displayName =
        championNameMap.get(champion.championId) ?? champion.name;
      return displayName
        .toLowerCase()
        .includes(searchTerm.trim().toLowerCase());
    });

    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: number | string;
        let bValue: number | string;

        if (sortColumn === "name") {
          const aName =
            championNameMap.get(a.championId) ?? a.name ?? a.championId;
          const bName =
            championNameMap.get(b.championId) ?? b.name ?? b.championId;
          aValue = aName.toLowerCase();
          bValue = bName.toLowerCase();
        } else if (sortColumn === "score") {
          aValue = computeChampionScore(a.stats) ?? 0;
          bValue = computeChampionScore(b.stats) ?? 0;
        } else if (
          sortColumn.startsWith("avg") ||
          sortColumn === "winRate" ||
          sortColumn === "totalGames"
        ) {
          aValue =
            (a.stats?.[sortColumn as keyof TierListChampionStats] as number) ??
            0;
          bValue =
            (b.stats?.[sortColumn as keyof TierListChampionStats] as number) ??
            0;
        } else {
          aValue = a[sortColumn as keyof TierListChampionWithStats] as number;
          bValue = b[sortColumn as keyof TierListChampionWithStats] as number;
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        }
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }

    return filtered;
  }, [
    championsWithStats,
    championNameMap,
    searchTerm,
    sortColumn,
    sortDirection,
    roleFilter,
    reliabilityOnly,
    eliteOnly,
  ]);

  const filtersActive = reliabilityOnly || eliteOnly || roleFilter !== "ALL";
  const isWinRateSort = sortColumn === "winRate";

  const resetFilters = useCallback(() => {
    setReliabilityOnly(false);
    setRoleFilter("ALL");
    setEliteOnly(false);
    setSortColumn("score");
    setSortDirection("desc");
  }, []);

  const toggleEliteOnly = useCallback(
    () => setEliteOnly((previous) => !previous),
    []
  );

  const toggleWinRateSort = useCallback(() => {
    if (sortColumn === "winRate") {
      setSortColumn("score");
      setSortDirection("desc");
    } else {
      setSortColumn("winRate");
      setSortDirection("desc");
    }
  }, [sortColumn]);

  const isLoading = championsLoading || statsLoading;
  const error = championsError || statsError;

  return {
    state: {
      searchTerm,
      sortColumn,
      sortDirection,
      roleFilter,
      reliabilityOnly,
      eliteOnly,
    },
    actions: {
      setSearchTerm,
      setRoleFilter,
      setReliabilityOnly,
      toggleEliteOnly,
      resetFilters,
      handleSort,
      toggleWinRateSort,
    },
    derived: {
      championsWithStats,
      sortedChampions,
      totalMatches,
      reliableChampionCount,
      averageWinRate,
      formattedLastUpdated,
      filtersActive,
      isWinRateSort,
      isLoading,
      error,
    },
  };
};
