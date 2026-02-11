"use client";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2Icon, SearchIcon } from "lucide-react";
import { useSummonerSearch } from "@/lib/hooks/use-summoner-search";
import { RIOT_REGIONS } from "@/lib/riot-regions";

export function HeaderSearch({
  isSearchOpen,
  setIsSearchOpen,
}: {
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}) {
  const {
    searchQuery,
    setSearchQuery,
    searchRegion,
    setSearchRegion,
    isSearching,
    searchResults,
    recentSearches,
    search: performFullSearch,
    navigateToResult,
    handleRecentClick,
  } = useSummonerSearch({
    onNavigate: () => setIsSearchOpen(false),
  });

  return (
    <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 hover:bg-muted/60"
        >
          <SearchIcon className="size-5" />
          <span className="sr-only">Rechercher</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[360px] p-0"
        align="end"
        sideOffset={12}
      >
        <Command shouldFilter={false}>
          <div className="flex items-center gap-3 px-4 py-3 bg-background/80 backdrop-blur rounded-t-xl shadow-sm ring-1 ring-border/30">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/12 text-primary">
              <SearchIcon className="size-4" />
            </div>
            <CommandInput
              placeholder="Rechercher un invocateur..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  performFullSearch();
                }
              }}
            />
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-3 bg-background/70 backdrop-blur">
            <span className="text-xs text-muted-foreground">Région</span>
            <Select value={searchRegion} onValueChange={setSearchRegion}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Région" />
              </SelectTrigger>
              <SelectContent>
                {RIOT_REGIONS.map((regionOption) => (
                  <SelectItem
                    key={regionOption.value}
                    value={regionOption.value}
                  >
                    {regionOption.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <CommandList>
            <CommandEmpty>
              {searchQuery.length >= 2
                ? "Aucun invocateur trouvé."
                : "Tapez au moins deux caractères pour rechercher."}
            </CommandEmpty>
            {searchResults.length > 0 && (
              <CommandGroup heading="Résultats">
                {searchResults.map((result) => (
                  <CommandItem
                    key={result.puuid}
                    value={result.puuid}
                    onSelect={() => navigateToResult(result)}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-background/80 hover:border-primary/40 hover:bg-background transition-colors"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {result.gameName ?? "Inconnu"}
                        {result.tagLine && (
                          <span className="text-muted-foreground">
                            #{result.tagLine}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {result.region.toUpperCase()}
                        {typeof result.stats?.totalMatches === "number" &&
                          ` • ${result.stats.totalMatches} matchs`}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {recentSearches.length > 0 && (
              <CommandGroup heading="Recherches récentes">
                {recentSearches.map((recent) => (
                  <CommandItem
                    key={`${recent.gameName}#${recent.tagLine}@${recent.region}`}
                    value={`${recent.gameName}#${recent.tagLine}`}
                    onSelect={() => handleRecentClick(recent)}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {recent.gameName}
                        <span className="text-muted-foreground">
                          #{recent.tagLine}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {recent.region.toUpperCase()}
                      </span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
          <div className="border-t px-3 py-2">
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={() => performFullSearch()}
              disabled={isSearching || searchQuery.length < 2}
            >
              {isSearching ? (
                <>
                  <Loader2Icon className="mr-2 size-4 animate-spin" />
                  Recherche...
                </>
              ) : (
                <>
                  <SearchIcon className="mr-2 size-4" />
                  Rechercher
                </>
              )}
            </Button>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
