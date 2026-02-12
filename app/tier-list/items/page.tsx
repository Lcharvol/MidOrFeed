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
import { ItemTierListHero } from "./components/ItemTierListHero";
import {
  ItemTierListFilters,
  type ViewMode,
} from "./components/ItemTierListFilters";
import { ItemTierListTable } from "./components/ItemTierListTable";
import { ItemTierListGrid } from "./components/ItemTierListGrid";
import { useItemTierList } from "./hooks/useItemTierList";

export default function ItemsPage() {
  const { state, actions, derived } = useItemTierList();
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  return (
    <div className="container mx-auto px-4 py-10 space-y-10">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">
                <HomeIcon className="size-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Tier List Items</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <ItemTierListHero
        totalMatches={derived.totalMatches}
        itemsCount={derived.itemsWithStats.length}
        formattedLastUpdated={derived.formattedLastUpdated}
      />

      <section className="space-y-4">
        <ItemTierListFilters
          state={state}
          actions={actions}
          filtersActive={derived.filtersActive}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {viewMode === "table" ? (
          <ItemTierListTable
            items={derived.sortedItems}
            sortColumn={state.sortColumn}
            sortDirection={state.sortDirection}
            onSort={actions.handleSort}
            totalMatches={derived.totalMatches}
            isLoading={derived.isLoading}
            error={derived.error}
          />
        ) : (
          <ItemTierListGrid
            items={derived.sortedItems}
            isLoading={derived.isLoading}
            error={derived.error}
          />
        )}
      </section>
    </div>
  );
}
