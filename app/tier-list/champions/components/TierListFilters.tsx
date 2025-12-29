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
    <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-muted/30 p-4">
      {/* Filtre par rôle */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {t("tierListChampions.role")}
        </label>
        <ButtonGroup orientation="horizontal" className="h-8">
          <Button
            size="sm"
            variant={roleFilter === "ALL" ? "default" : "outline"}
            onClick={() => setRoleFilter("ALL")}
            className="px-3"
            title={t("tierListChampions.allRoles")}
          >
            {t("tierListChampions.allRoles")}
          </Button>
          {ROLE_FILTER_OPTIONS.map(({ key, label, Icon }) => (
            <Button
              key={key}
              size="sm"
              variant={roleFilter === key ? "default" : "outline"}
              onClick={() => setRoleFilter(key)}
              className="px-3"
              title={label}
            >
              <Icon className="size-4" />
            </Button>
          ))}
        </ButtonGroup>
      </div>

      {/* Filtre par tier */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          {t("tierListChampions.tier")}
        </label>
        <Select value={tierFilter} onValueChange={setTierFilter}>
          <SelectTrigger size="sm" className="w-[140px]">
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
        <label className="text-xs font-medium text-muted-foreground">
          {t("tierListChampions.gameMode")}
        </label>
        <Select value={queueTypeFilter} onValueChange={setQueueTypeFilter}>
          <SelectTrigger size="sm" className="w-[160px]">
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

      <Separator orientation="vertical" className="h-10" />

      {/* Filtre Champions fiables */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="reliability-filter"
          className="text-xs font-medium text-muted-foreground whitespace-nowrap"
        >
          {t("tierListChampions.reliableChampions")}
        </label>
        <Switch
          id="reliability-filter"
          checked={reliabilityOnly}
          onCheckedChange={setReliabilityOnly}
        />
      </div>

      {/* Filtre Elite Only */}
      <div className="flex items-center gap-2">
        <label
          htmlFor="elite-filter"
          className="text-xs font-medium text-muted-foreground whitespace-nowrap flex items-center gap-1"
        >
          <SparklesIcon className="size-3" />
          {t("tierListChampions.eliteOnly")}
        </label>
        <Switch
          id="elite-filter"
          checked={eliteOnly}
          onCheckedChange={toggleEliteOnly}
        />
      </div>

      <Separator orientation="vertical" className="h-10" />

      {/* Bouton Reset */}
      {filtersActive && (
        <button
          onClick={resetFilters}
          className="flex items-center gap-1.5 rounded-md border border-border/60 bg-background/70 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-background h-8"
          title={t("tierListChampions.reset")}
        >
          <GlobeIcon className="size-4" />
          {t("tierListChampions.reset")}
        </button>
      )}

      {/* Recherche */}
      <div className="ml-auto flex w-full items-center gap-2 sm:w-64">
        <Input
          placeholder={t("tierListChampions.searchChampion")}
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="rounded-md bg-background/80"
        />
      </div>
    </div>
  );
};
