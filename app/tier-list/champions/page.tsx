"use client";

import { useState } from "react";
import Link from "next/link";
import { HomeIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { TierListHero } from "./components/TierListHero";
import { TierListFilters, type ViewMode } from "./components/TierListFilters";
import { TierListTable } from "./components/TierListTable";
import { TierListGrid } from "./components/TierListGrid";
import { useChampionTierList } from "./hooks/useChampionTierList";
import { usePatches } from "@/lib/hooks/use-patches";
import type { TierListMetrics } from "@/types";

const ChampionsPage = () => {
  const { state, actions, derived } = useChampionTierList();
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const { patches, isLoading: patchesLoading } = usePatches();

  const metrics: TierListMetrics = {
    totalMatches: derived.totalMatches,
    formattedLastUpdated: derived.formattedLastUpdated,
    championsCount: derived.championsWithStats.length,
  };

  return (
    <div className="container mx-auto px-4 py-10 space-y-10">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/"><HomeIcon className="size-4" /></Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Tier List Champions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <TierListHero metrics={metrics} selectedPatch={state.selectedPatch} />

      <section className="space-y-4">
        <TierListFilters
          state={state}
          actions={actions}
          filtersActive={derived.filtersActive}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          patches={patches}
          patchesLoading={patchesLoading}
        />

        {viewMode === "table" ? (
          <TierListTable
            champions={derived.sortedChampions}
            sortColumn={state.sortColumn}
            sortDirection={state.sortDirection}
            onSort={actions.handleSort}
            totalMatches={derived.totalMatches}
            isLoading={derived.isLoading}
            error={derived.error}
          />
        ) : (
          <TierListGrid
            champions={derived.sortedChampions}
            isLoading={derived.isLoading}
            error={derived.error}
          />
        )}
      </section>
    </div>
  );
};

export default ChampionsPage;
