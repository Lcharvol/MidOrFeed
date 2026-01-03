"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  GlobeIcon,
  SparklesIcon,
} from "lucide-react";
import { ROLE_FILTER_OPTIONS } from "../utils";
import type { TierListActions, TierListState } from "../hooks/useChampionTierList";
import { useI18n } from "@/lib/i18n-context";

type TierListFiltersProps = {
  state: TierListState;
  actions: TierListActions;
  filtersActive: boolean;
};

export const TierListFilters = ({
  state,
  actions,
  filtersActive,
}: TierListFiltersProps) => {
  const { t } = useI18n();
  const {
    searchTerm,
    roleFilter,
    tierFilter,
    queueTypeFilter,
    reliabilityOnly,
    eliteOnly,
  } = state;

  const {
    setSearchTerm,
    setRoleFilter,
    setTierFilter,
    setQueueTypeFilter,
    setReliabilityOnly,
    toggleEliteOnly,
    resetFilters,
  } = actions;

  const TIER_OPTIONS = [
    { value: "ALL", label: t("tierListChampions.allTiers") },
    { value: "S+", label: "S+" },
    { value: "S", label: "S" },
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
    { value: "D", label: "D" },
  ] as const;

  const QUEUE_TYPE_OPTIONS = [
    { value: "ALL", label: t("tierListChampions.allModes") },
    { value: "SOLO", label: t("summoners.rankedSolo") },
    { value: "FLEX", label: t("summoners.rankedFlex") },
  ] as const;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3 sm:p-4">
      {/* Row 1: Search (mobile first) */}
      <div className="flex w-full items-center gap-2 sm:hidden">
        <Input
          placeholder={t("tierListChampions.searchChampion")}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="rounded-md bg-background/80"
        />
      </div>

      {/* Row 2: Filters */}
      <div className="flex flex-wrap items-end gap-2 sm:gap-3">
        {/* Filtre par rôle */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">
            {t("tierListChampions.role")}
          </label>
          <ButtonGroup orientation="horizontal" className="h-7 sm:h-8">
            <Button
              size="sm"
              variant={roleFilter === "ALL" ? "default" : "outline"}
              onClick={() => setRoleFilter("ALL")}
              className="px-2 sm:px-3 text-xs"
              title={t("tierListChampions.allRoles")}
            >
              <span className="hidden sm:inline">{t("tierListChampions.allRoles")}</span>
              <span className="sm:hidden">All</span>
            </Button>
            {ROLE_FILTER_OPTIONS.map(({ key, label, Icon }) => (
              <Button
                key={key}
                size="sm"
                variant={roleFilter === key ? "default" : "outline"}
                onClick={() => setRoleFilter(key)}
                className="px-2 sm:px-3"
                title={label}
              >
                <Icon className="size-3.5 sm:size-4" />
              </Button>
            ))}
          </ButtonGroup>
        </div>

        {/* Filtre par tier */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">
            {t("tierListChampions.tier")}
          </label>
          <Select value={tierFilter} onValueChange={setTierFilter}>
            <SelectTrigger size="sm" className="w-24 sm:w-[140px] h-7 sm:h-8 text-xs sm:text-sm">
              <SelectValue placeholder={t("tierListChampions.allTiers")} />
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

        {/* Filtre par type de queue */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] sm:text-xs font-medium text-muted-foreground">
            {t("tierListChampions.gameMode")}
          </label>
          <Select value={queueTypeFilter} onValueChange={setQueueTypeFilter}>
            <SelectTrigger size="sm" className="w-24 sm:w-[160px] h-7 sm:h-8 text-xs sm:text-sm">
              <SelectValue placeholder={t("tierListChampions.allModes")} />
            </SelectTrigger>
            <SelectContent>
              {QUEUE_TYPE_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Separator orientation="vertical" className="h-7 sm:h-10 hidden sm:block" />

        {/* Toggles - wrap on mobile */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Filtre Champions fiables */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <label
              htmlFor="reliability-filter"
              className="text-[10px] sm:text-xs font-medium text-muted-foreground whitespace-nowrap"
            >
              <span className="hidden sm:inline">{t("tierListChampions.reliableChampions")}</span>
              <span className="sm:hidden">Fiable</span>
            </label>
            <Switch
              id="reliability-filter"
              checked={reliabilityOnly}
              onCheckedChange={setReliabilityOnly}
              className="scale-90 sm:scale-100"
            />
          </div>

          {/* Filtre Elite Only */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <label
              htmlFor="elite-filter"
              className="text-[10px] sm:text-xs font-medium text-muted-foreground whitespace-nowrap flex items-center gap-1"
            >
              <SparklesIcon className="size-3" />
              <span className="hidden sm:inline">{t("tierListChampions.eliteOnly")}</span>
              <span className="sm:hidden">Elite</span>
            </label>
            <Switch
              id="elite-filter"
              checked={eliteOnly}
              onCheckedChange={toggleEliteOnly}
              className="scale-90 sm:scale-100"
            />
          </div>
        </div>

        {/* Bouton Reset */}
        {filtersActive && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1 sm:gap-1.5 rounded-md border border-border/60 bg-background/70 px-2 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium transition-colors hover:bg-background h-7 sm:h-8"
            title={t("tierListChampions.reset")}
          >
            <GlobeIcon className="size-3 sm:size-4" />
            <span className="hidden sm:inline">{t("tierListChampions.reset")}</span>
          </button>
        )}

        {/* Recherche - desktop */}
        <div className="ml-auto hidden sm:flex w-64 items-center gap-2">
          <Input
            placeholder={t("tierListChampions.searchChampion")}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="rounded-md bg-background/80"
          />
        </div>
      </div>
    </div>
  );
};
