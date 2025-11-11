"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  FilterIcon,
  GlobeIcon,
  SparklesIcon,
  SwordsIcon,
} from "lucide-react";
import { ROLE_FILTER_OPTIONS } from "../utils";
import type { TierListActions, TierListState } from "../hooks/useChampionTierList";

type TierListFiltersProps = {
  state: TierListState;
  actions: TierListActions;
  filtersActive: boolean;
  isWinRateSort: boolean;
};

export const TierListFilters = ({
  state,
  actions,
  filtersActive,
  isWinRateSort,
}: TierListFiltersProps) => {
  const {
    searchTerm,
    roleFilter,
    reliabilityOnly,
    eliteOnly,
  } = state;

  const {
    setSearchTerm,
    setRoleFilter,
    setReliabilityOnly,
    toggleEliteOnly,
    resetFilters,
    toggleWinRateSort,
  } = actions;

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-muted/30 p-4">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant={filtersActive ? "default" : "outline"}
            size="sm"
            className="gap-2 rounded-full border-border/60 bg-background/70 text-xs font-medium"
          >
            <FilterIcon className="size-4" />
            Filtres
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 space-y-4 p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Champions fiables</span>
            <Switch
              checked={reliabilityOnly}
              onCheckedChange={setReliabilityOnly}
            />
          </div>
          <Separator />
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Rôle principal
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant={roleFilter === "ALL" ? "default" : "outline"}
                className="justify-start gap-2"
                onClick={() => setRoleFilter("ALL")}
              >
                Tous les rôles
              </Button>
              {ROLE_FILTER_OPTIONS.map(({ key, label, Icon }) => (
                <Button
                  key={key}
                  size="sm"
                  variant={roleFilter === key ? "default" : "outline"}
                  className="justify-start gap-2"
                  onClick={() => setRoleFilter(key)}
                >
                  <Icon className="size-4" />
                  {label}
                </Button>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button
        variant={eliteOnly ? "default" : "outline"}
        size="sm"
        className="gap-2 rounded-full border-border/60 bg-background/70 text-xs font-medium"
        onClick={toggleEliteOnly}
        title="Afficher uniquement les champions S / S+"
      >
        <SparklesIcon className="size-4" /> Emerald +
      </Button>

      <Button
        variant={isWinRateSort ? "default" : "outline"}
        size="sm"
        className="gap-2 rounded-full border-border/60 bg-background/70 text-xs font-medium"
        onClick={toggleWinRateSort}
      >
        <SwordsIcon className="size-4" /> Ranked Solo
      </Button>

      <Button
        variant={filtersActive || isWinRateSort ? "default" : "outline"}
        size="sm"
        className="gap-2 rounded-full border-border/60 bg-background/70 text-xs font-medium"
        onClick={resetFilters}
      >
        <GlobeIcon className="size-4" /> Global
      </Button>

      <div className="ml-auto flex w-full items-center gap-2 sm:w-64">
        <Input
          placeholder="Rechercher un champion..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="rounded-full bg-background/80"
        />
      </div>
    </div>
  );
};


