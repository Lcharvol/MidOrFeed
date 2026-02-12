import { useMemo, useState, useCallback } from "react";
import type {
  ItemWithStats,
  ItemStatsData,
  ItemSortColumn,
  SortDirection,
} from "@/types";
import { useItems } from "@/lib/hooks/use-items";
import { useItemStats } from "@/lib/hooks/use-item-stats";
import {
  computeItemScore,
  resolveItemTier,
  parseGoldTotal,
  parseItemTags,
  ITEM_MIN_APPEARANCES,
} from "../utils";

type TierFilter = "S+" | "S" | "A" | "B" | "C" | "D" | "ALL";
type DepthFilter = "all" | "completed" | "component";

export type ItemTierListState = {
  searchTerm: string;
  sortColumn: ItemSortColumn | null;
  sortDirection: SortDirection;
  tagFilter: string;
  tierFilter: TierFilter;
  depthFilter: DepthFilter;
  reliabilityOnly: boolean;
};

export type ItemTierListActions = {
  setSearchTerm: (value: string) => void;
  setTagFilter: (value: string) => void;
  setTierFilter: (value: TierFilter) => void;
  setDepthFilter: (value: DepthFilter) => void;
  setReliabilityOnly: (value: boolean) => void;
  resetFilters: () => void;
  handleSort: (column: ItemSortColumn) => void;
};

export type ItemTierListDerived = {
  itemsWithStats: ItemWithStats[];
  sortedItems: ItemWithStats[];
  totalMatches: number;
  formattedLastUpdated: string;
  filtersActive: boolean;
  isLoading: boolean;
  error: unknown;
};

export type UseItemTierListReturn = {
  state: ItemTierListState;
  actions: ItemTierListActions;
  derived: ItemTierListDerived;
};

export const useItemTierList = (): UseItemTierListReturn => {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<ItemSortColumn | null>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [tagFilter, setTagFilter] = useState("ALL");
  const [tierFilter, setTierFilter] = useState<TierFilter>("ALL");
  const [depthFilter, setDepthFilter] = useState<DepthFilter>("all");
  const [reliabilityOnly, setReliabilityOnly] = useState(false);

  const {
    items,
    isLoading: itemsLoading,
    error: itemsError,
  } = useItems({ limit: 1000, map: "11" });

  const {
    itemStats,
    totalUniqueMatches,
    isLoading: statsLoading,
    error: statsError,
  } = useItemStats();

  const statsMap = useMemo(() => {
    const map = new Map<string, ItemStatsData>();
    itemStats.forEach((stat) => map.set(stat.itemId, stat));
    return map;
  }, [itemStats]);

  const itemsWithStats = useMemo<ItemWithStats[]>(
    () =>
      items.map((item) => ({
        ...item,
        stats: statsMap.get(item.itemId),
      })),
    [items, statsMap]
  );

  const totalMatches = useMemo(() => {
    return totalUniqueMatches ?? 0;
  }, [totalUniqueMatches]);

  const lastUpdated = useMemo(() => {
    if (itemStats.length === 0) return null;
    const latest = itemStats.reduce((latestDate, stat) => {
      const current = new Date(stat.lastAnalyzedAt).getTime();
      return current > latestDate ? current : latestDate;
    }, 0);
    return latest ? new Date(latest) : null;
  }, [itemStats]);

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
    (column: ItemSortColumn) => {
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

  const sortedItems = useMemo(() => {
    let filtered = itemsWithStats.filter((item) => {
      const stats = item.stats;

      // Reliability filter
      if (reliabilityOnly && (stats?.totalGames ?? 0) < ITEM_MIN_APPEARANCES) {
        return false;
      }

      // Tier filter
      if (tierFilter !== "ALL") {
        const tier = resolveItemTier(stats);
        if (tier !== tierFilter) return false;
      }

      // Tag filter
      if (tagFilter !== "ALL") {
        const tags = parseItemTags(item.tags);
        if (!tags.includes(tagFilter)) return false;
      }

      // Depth filter
      if (depthFilter === "completed") {
        if (!item.depth || item.depth < 3) return false;
      } else if (depthFilter === "component") {
        if (item.depth && item.depth >= 3) return false;
      }

      // Search
      return item.name.toLowerCase().includes(searchTerm.trim().toLowerCase());
    });

    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: number | string;
        let bValue: number | string;

        if (sortColumn === "name") {
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
        } else if (sortColumn === "score") {
          aValue = computeItemScore(a.stats) ?? 0;
          bValue = computeItemScore(b.stats) ?? 0;
        } else if (sortColumn === "gold") {
          aValue = parseGoldTotal(a.gold);
          bValue = parseGoldTotal(b.gold);
        } else {
          aValue = (a.stats?.[sortColumn as keyof ItemStatsData] as number) ?? 0;
          bValue = (b.stats?.[sortColumn as keyof ItemStatsData] as number) ?? 0;
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
    itemsWithStats,
    searchTerm,
    sortColumn,
    sortDirection,
    tagFilter,
    tierFilter,
    depthFilter,
    reliabilityOnly,
  ]);

  const filtersActive =
    reliabilityOnly ||
    tagFilter !== "ALL" ||
    tierFilter !== "ALL" ||
    depthFilter !== "all";

  const resetFilters = useCallback(() => {
    setReliabilityOnly(false);
    setTagFilter("ALL");
    setTierFilter("ALL");
    setDepthFilter("all");
    setSortColumn("score");
    setSortDirection("desc");
  }, []);

  const isLoading = itemsLoading || statsLoading;
  const error = itemsError || statsError;

  return {
    state: {
      searchTerm,
      sortColumn,
      sortDirection,
      tagFilter,
      tierFilter,
      depthFilter,
      reliabilityOnly,
    },
    actions: {
      setSearchTerm,
      setTagFilter,
      setTierFilter,
      setDepthFilter,
      setReliabilityOnly,
      resetFilters,
      handleSort,
    },
    derived: {
      itemsWithStats,
      sortedItems,
      totalMatches,
      formattedLastUpdated,
      filtersActive,
      isLoading,
      error,
    },
  };
};
