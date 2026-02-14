"use client";

import { useState, useMemo } from "react";
import { SearchIcon, XIcon, CheckIcon, BanIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChampionIcon } from "@/components/ChampionIcon";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useChampions } from "@/lib/hooks/use-champions";
import { useChampionStats } from "@/lib/hooks/use-champion-stats";
import { useI18n } from "@/lib/i18n-context";
import { ROLE_ICON_MAP } from "@/components/icons/role-icons";
import type { CompositionRole } from "@/lib/compositions/roles";

const ROLE_FILTERS: { key: CompositionRole | "ALL"; iconKey?: keyof typeof ROLE_ICON_MAP }[] = [
  { key: "ALL" },
  { key: "TOP", iconKey: "TOP" },
  { key: "JUNGLE", iconKey: "JUNGLE" },
  { key: "MIDDLE", iconKey: "MIDDLE" },
  { key: "BOTTOM", iconKey: "BOTTOM" },
  { key: "UTILITY", iconKey: "UTILITY" },
];

interface ChampionGridProps {
  unavailableIds: Set<string>;
  bannedIds: Set<string>;
  onSelect: (championId: string) => void;
  disabled?: boolean;
  hoveredChampionId: string | null;
  onHover: (championId: string) => void;
}

export function ChampionGrid({
  unavailableIds,
  bannedIds,
  onSelect,
  disabled,
  hoveredChampionId,
  onHover,
}: ChampionGridProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<CompositionRole | "ALL">("ALL");
  const { champions, isLoading } = useChampions();
  const { championStats } = useChampionStats();
  const { t } = useI18n();

  // Build a map of championId -> topRole for filtering
  const championRoleMap = useMemo(() => {
    const map = new Map<string, string | null>();
    for (const stat of championStats) {
      const role = stat.topRole ?? stat.topLane ?? null;
      map.set(stat.championId, role?.toUpperCase() ?? null);
    }
    return map;
  }, [championStats]);

  const filteredChampions = useMemo(() => {
    let result = champions;

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((c) => c.name.toLowerCase().includes(lower));
    }

    if (roleFilter !== "ALL") {
      const normalizedFilter =
        roleFilter === "MIDDLE" ? ["MIDDLE", "MID"]
        : roleFilter === "BOTTOM" ? ["BOTTOM", "BOT", "ADC"]
        : roleFilter === "UTILITY" ? ["UTILITY", "SUPPORT"]
        : [roleFilter];

      result = result.filter((c) => {
        const champRole = championRoleMap.get(c.championId);
        if (!champRole) return false;
        return normalizedFilter.includes(champRole);
      });
    }

    return result;
  }, [champions, searchTerm, roleFilter, championRoleMap]);

  return (
    <div>
      {/* Search + Role filter */}
      <div className="flex items-center gap-2 mb-3">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t("draft.searchChampion")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <XIcon className="size-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>
        <div className="flex gap-0.5 border border-border/50 rounded-lg p-0.5">
          {ROLE_FILTERS.map(({ key, iconKey }) => {
            const isActive = roleFilter === key;
            const Icon = iconKey ? ROLE_ICON_MAP[iconKey] : null;
            return (
              <button
                key={key}
                onClick={() => setRoleFilter(key)}
                className={cn(
                  "flex items-center justify-center size-8 rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                title={key === "ALL" ? "All" : key}
              >
                {Icon ? (
                  <Icon className="size-4" />
                ) : (
                  <span className="text-xs font-medium">All</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
          {Array.from({ length: 30 }).map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1.5">
          {filteredChampions.map((champion) => {
            const isUnavailable = unavailableIds.has(champion.championId);
            const isBanned = bannedIds.has(champion.championId);
            const isHovered = hoveredChampionId === champion.championId;

            return (
              <button
                key={champion.id}
                onClick={() => !isUnavailable && !disabled && onSelect(champion.championId)}
                onMouseEnter={() => !isUnavailable && !disabled && onHover(champion.championId)}
                disabled={isUnavailable || disabled}
                className={cn(
                  "relative group rounded-lg overflow-hidden border transition-all duration-150",
                  isUnavailable
                    ? "opacity-30 cursor-not-allowed border-transparent"
                    : disabled
                      ? "opacity-60 cursor-not-allowed border-transparent"
                      : "hover:border-primary hover:scale-105 cursor-pointer border-transparent hover:shadow-lg",
                  isHovered && !isUnavailable && "border-primary scale-105 shadow-lg"
                )}
                title={champion.name}
              >
                <ChampionIcon
                  championId={champion.championId}
                  size={64}
                  className="w-full aspect-square"
                />
                {isBanned && (
                  <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                    <BanIcon className="size-5 text-red-300" />
                  </div>
                )}
                {isUnavailable && !isBanned && (
                  <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                    <CheckIcon className="size-5 text-primary" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="text-[8px] text-white text-center truncate">
                    {champion.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!isLoading && filteredChampions.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {t("draft.noChampionsFound")}
        </div>
      )}
    </div>
  );
}
