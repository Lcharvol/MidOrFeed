"use client";

import { TierListHero } from "./components/TierListHero";
import { TierListFilters } from "./components/TierListFilters";
import { TierListTable } from "./components/TierListTable";
import { useChampionTierList } from "./hooks/useChampionTierList";
import type { TierListMetrics } from "@/types";

const ChampionsPage = () => {
  const { state, actions, derived } = useChampionTierList();

  const metrics: TierListMetrics = {
    totalMatches: derived.totalMatches,
    reliableChampionCount: derived.reliableChampionCount,
    averageWinRate: derived.averageWinRate,
    formattedLastUpdated: derived.formattedLastUpdated,
    championsCount: derived.championsWithStats.length,
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <TierListHero metrics={metrics} />

      <section className="space-y-4">
        <TierListFilters
          state={state}
          actions={actions}
          filtersActive={derived.filtersActive}
          isWinRateSort={derived.isWinRateSort}
        />

        <TierListTable
          champions={derived.sortedChampions}
          sortColumn={state.sortColumn}
          sortDirection={state.sortDirection}
          onSort={actions.handleSort}
          totalMatches={derived.totalMatches}
          isLoading={derived.isLoading}
          error={derived.error}
        />
      </section>
    </div>
  );
};

export default ChampionsPage;
