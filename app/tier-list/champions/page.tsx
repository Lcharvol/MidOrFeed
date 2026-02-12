"use client";

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
import { TierListFilters } from "./components/TierListFilters";
import { TierListTable } from "./components/TierListTable";
import { useChampionTierList } from "./hooks/useChampionTierList";
import type { TierListMetrics } from "@/types";

const ChampionsPage = () => {
  const { state, actions, derived } = useChampionTierList();

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

      <TierListHero metrics={metrics} />

      <section className="space-y-4">
        <TierListFilters
          state={state}
          actions={actions}
          filtersActive={derived.filtersActive}
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
