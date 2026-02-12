"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { GlobeIcon, TableIcon, LayoutGridIcon } from "lucide-react";
import { ITEM_TAG_OPTIONS } from "../utils";
import type {
  ItemTierListActions,
  ItemTierListState,
} from "../hooks/useItemTierList";
import { useI18n } from "@/lib/i18n-context";

export type ViewMode = "table" | "grid";

type ItemTierListFiltersProps = {
  state: ItemTierListState;
  actions: ItemTierListActions;
  filtersActive: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
};

export const ItemTierListFilters = ({
  state,
  actions,
  filtersActive,
  viewMode,
  onViewModeChange,
}: ItemTierListFiltersProps) => {
  const { t } = useI18n();
  const { searchTerm, tagFilter, tierFilter, depthFilter, reliabilityOnly } =
    state;

  const TIER_OPTIONS = [
    { value: "ALL", label: t("tierListItems.allTiers") },
    { value: "S+", label: "S+" },
    { value: "S", label: "S" },
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" },
  ] as const;

  const DEPTH_OPTIONS = [
    { value: "all", label: t("tierListItems.allTypes") },
    { value: "completed", label: t("tierListItems.completedItems") },
    { value: "component", label: t("tierListItems.components") },
  ] as const;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:p-4">
      {/* Row 1: Search (mobile first) */}
      <div className="flex w-full items-center gap-2 sm:hidden">
        <Input
          placeholder={t("tierList.items.searchItem")}
          value={searchTerm}
          onChange={(event) => actions.setSearchTerm(event.target.value)}
          className="rounded-md bg-background/80"
        />
      </div>

      {/* Row 2: Filters */}
      <div className="flex flex-wrap items-end gap-2 sm:gap-3">
        {/* Toggle vue */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">
            Vue
          </label>
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            value={viewMode}
            onValueChange={(value) => {
              if (value) onViewModeChange(value as ViewMode);
            }}
            className="h-7 sm:h-8"
          >
            <ToggleGroupItem
              value="table"
              className="px-2 sm:px-3"
              title={t("tierListItems.viewTable")}
            >
              <TableIcon className="size-3.5 sm:size-4" />
            </ToggleGroupItem>
            <ToggleGroupItem
              value="grid"
              className="px-2 sm:px-3"
              title={t("tierListItems.viewGrid")}
            >
              <LayoutGridIcon className="size-3.5 sm:size-4" />
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <Separator
          orientation="vertical"
          className="h-7 sm:h-10 hidden sm:block"
        />

        {/* Filtre par tag */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">
            {t("tierListItems.tag")}
          </label>
          <Select value={tagFilter} onValueChange={actions.setTagFilter}>
            <SelectTrigger
              size="sm"
              className="w-28 sm:w-[160px] h-7 sm:h-8 text-xs sm:text-sm"
            >
              <SelectValue placeholder={t("tierListItems.allTags")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("tierListItems.allTags")}</SelectItem>
              {ITEM_TAG_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtre par tier */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">
            {t("tierListItems.tier")}
          </label>
          <Select
            value={tierFilter}
            onValueChange={actions.setTierFilter}
          >
            <SelectTrigger
              size="sm"
              className="w-24 sm:w-[140px] h-7 sm:h-8 text-xs sm:text-sm"
            >
              <SelectValue placeholder={t("tierListItems.allTiers")} />
            </SelectTrigger>
            <SelectContent>
              {TIER_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtre par type (completed/component) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">
            {t("tierListItems.depth")}
          </label>
          <Select
            value={depthFilter}
            onValueChange={actions.setDepthFilter}
          >
            <SelectTrigger
              size="sm"
              className="w-28 sm:w-[150px] h-7 sm:h-8 text-xs sm:text-sm"
            >
              <SelectValue placeholder={t("tierListItems.allTypes")} />
            </SelectTrigger>
            <SelectContent>
              {DEPTH_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator
          orientation="vertical"
          className="h-7 sm:h-10 hidden sm:block"
        />

        {/* Toggle fiabilité */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <label
            htmlFor="item-reliability-filter"
            className="text-[10px] sm:text-xs font-medium text-muted-foreground whitespace-nowrap"
          >
            <span className="hidden sm:inline">
              {t("tierListItems.reliableItems")}
            </span>
            <span className="sm:hidden">Fiable</span>
          </label>
          <Switch
            id="item-reliability-filter"
            checked={reliabilityOnly}
            onCheckedChange={actions.setReliabilityOnly}
            className="scale-90 sm:scale-100"
          />
        </div>

        {/* Bouton Reset */}
        {filtersActive && (
          <button
            onClick={actions.resetFilters}
            className="flex items-center gap-1 sm:gap-1.5 rounded-md border border-border/60 bg-background/70 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors hover:bg-background h-7 sm:h-8"
            title={t("tierListItems.reset")}
          >
            <GlobeIcon className="size-3 sm:size-4" />
            <span className="hidden sm:inline">
              {t("tierListItems.reset")}
            </span>
          </button>
        )}

        {/* Recherche - desktop */}
        <div className="ml-auto hidden sm:flex w-64 items-center gap-2">
          <Input
            placeholder={t("tierList.items.searchItem")}
            value={searchTerm}
            onChange={(event) => actions.setSearchTerm(event.target.value)}
            className="rounded-md bg-background/80"
          />
        </div>
      </div>
    </div>
  );
};
