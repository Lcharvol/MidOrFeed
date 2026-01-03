"use client";

import { useState, useEffect, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SearchIcon, Loader2Icon, ClockIcon } from "lucide-react";
import { useSummonerSearch } from "@/lib/hooks/use-summoner-search";
import { useI18n } from "@/lib/i18n-context";
import { RIOT_REGIONS } from "@/lib/riot-regions";
import { cn } from "@/lib/utils";

interface SummonerSearchBarProps {
  className?: string;
  showRecentSearches?: boolean;
}

export function SummonerSearchBar({
  className,
  showRecentSearches = true,
}: SummonerSearchBarProps) {
  const { t } = useI18n();
  const [isFocused, setIsFocused] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    searchQuery,
    setSearchQuery,
    searchRegion,
    setSearchRegion,
    isSearching,
    searchResults,
    recentSearches,
    search,
    navigateToResult,
    handleRecentClick,
  } = useSummonerSearch({
    onNavigate: () => setIsFocused(false),
  });

  // Track debounce state for visual feedback
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsDebouncing(true);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        setIsDebouncing(false);
      }, 300);
    } else {
      setIsDebouncing(false);
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Get region label for placeholder
  const currentRegion = RIOT_REGIONS.find((r) => r.value === searchRegion);
  const regionTag = currentRegion?.value.toUpperCase().replace(/\d/g, "") || "EUW";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      search();
    }
  };

  const showDropdown = isFocused && (searchResults.length > 0 || (showRecentSearches && recentSearches.length > 0 && searchQuery.length === 0));

  return (
    <div ref={containerRef} className={cn("relative w-full", className)}>
      {/* Main search bar */}
      <div
        className={cn(
          "flex items-center h-12 rounded-lg border bg-background/95 backdrop-blur transition-all overflow-hidden",
          isFocused ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-border/80"
        )}
      >
        {/* Region selector */}
        <Select value={searchRegion} onValueChange={setSearchRegion}>
          <SelectTrigger className="!h-12 w-[110px] shrink-0 border-0 border-r border-border/50 rounded-none bg-transparent focus:ring-0 focus:ring-offset-0 text-sm shadow-none">
            <SelectValue placeholder="Region" />
          </SelectTrigger>
          <SelectContent className="z-[100]">
            {RIOT_REGIONS.map((region) => (
              <SelectItem key={region.value} value={region.value}>
                {region.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search input */}
        <div className="flex-1 flex items-center h-full px-3 gap-2">
          <div className="relative size-4 shrink-0">
            {isDebouncing ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="size-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
              </div>
            ) : (
              <SearchIcon className="size-4 text-muted-foreground" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onKeyDown={handleKeyDown}
            placeholder={`${t("homeSearch.placeholder") || "Game name"} + #${regionTag}`}
            className="flex-1 h-full bg-transparent border-0 outline-none text-sm placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Search button */}
        <button
          onClick={search}
          disabled={isSearching || searchQuery.length < 2}
          className={cn(
            "h-full px-5 bg-primary text-primary-foreground text-sm font-medium transition-colors",
            "hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed",
            "flex items-center justify-center gap-2"
          )}
        >
          {isSearching ? (
            <Loader2Icon className="size-4 animate-spin" />
          ) : (
            <>
              <SearchIcon className="size-4" />
              <span className="hidden sm:inline">{t("homeSearch.search") || "Search"}</span>
            </>
          )}
        </button>
      </div>

      {/* Dropdown with results and recent searches */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1.5 rounded-lg border border-border bg-background shadow-lg z-[100] overflow-hidden">
          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="p-1.5">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                {t("homeSearch.results") || "Results"}
              </div>
              {searchResults.map((result) => (
                <button
                  key={result.puuid}
                  onClick={() => navigateToResult(result)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {result.gameName || "Unknown"}
                      {result.tagLine && (
                        <span className="text-muted-foreground">#{result.tagLine}</span>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {result.region.toUpperCase()}
                      {typeof result.stats?.totalMatches === "number" &&
                        ` - ${result.stats.totalMatches} matches`}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Recent searches */}
          {showRecentSearches && recentSearches.length > 0 && searchQuery.length === 0 && (
            <div className={cn("p-1.5", searchResults.length > 0 && "border-t border-border")}>
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <ClockIcon className="size-3" />
                {t("homeSearch.recentSearches") || "Recent searches"}
              </div>
              {recentSearches.slice(0, 5).map((recent) => (
                <button
                  key={`${recent.gameName}#${recent.tagLine}@${recent.region}`}
                  onClick={() => handleRecentClick(recent)}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-muted transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {recent.gameName}
                      <span className="text-muted-foreground">#{recent.tagLine}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {recent.region.toUpperCase()}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
