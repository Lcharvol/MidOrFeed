"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2Icon, UserIcon, ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type SearchResult = {
  puuid: string;
  gameName: string | null;
  tagLine: string | null;
  region: string;
  profileIconId?: number | null;
  level?: number | null;
  stats?: {
    totalMatches?: number;
    winRate?: number;
    avgKDA?: number;
  };
};

type PlayerSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  region: string;
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

const RECENT_SEARCHES_KEY = "compareRecentSearches";
const MAX_RECENT = 5;

type RecentPlayer = {
  puuid: string;
  gameName: string;
  tagLine: string;
  region: string;
  profileIconId?: number;
  timestamp: number;
};

const getRecentSearches = (): RecentPlayer[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT) : [];
  } catch {
    return [];
  }
};

const addRecentSearch = (player: Omit<RecentPlayer, "timestamp">) => {
  if (typeof window === "undefined") return;
  try {
    const current = getRecentSearches();
    const filtered = current.filter((p) => p.puuid !== player.puuid);
    const next = [{ ...player, timestamp: Date.now() }, ...filtered].slice(
      0,
      MAX_RECENT
    );
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
};

export const PlayerSearchInput = ({
  value,
  onChange,
  region,
  onSelect,
  placeholder = "Nom#TAG",
  className,
  disabled,
}: PlayerSearchInputProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentPlayer[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  // Search for players when input changes
  const performSearch = useCallback(
    async (query: string, searchRegion: string) => {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch("/api/search/summoners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            region: searchRegion,
            limit: 5,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          setResults(data.results || []);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      performSearch(value, region);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value, region, performSearch]);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      const gameName = result.gameName || "";
      const tagLine = result.tagLine || "";
      const displayValue = `${gameName}#${tagLine}`;

      onChange(displayValue);
      setOpen(false);

      // Save to recent searches
      if (result.gameName && result.tagLine) {
        addRecentSearch({
          puuid: result.puuid,
          gameName: result.gameName,
          tagLine: result.tagLine,
          region: result.region,
          profileIconId: result.profileIconId ?? undefined,
        });
        setRecentSearches(getRecentSearches());
      }

      onSelect?.(result);
    },
    [onChange, onSelect]
  );

  const handleRecentSelect = useCallback(
    (recent: RecentPlayer) => {
      const displayValue = `${recent.gameName}#${recent.tagLine}`;
      onChange(displayValue);
      setOpen(false);

      onSelect?.({
        puuid: recent.puuid,
        gameName: recent.gameName,
        tagLine: recent.tagLine,
        region: recent.region,
        profileIconId: recent.profileIconId,
      });
    },
    [onChange, onSelect]
  );

  const showRecent = !value && recentSearches.length > 0;
  const showResults = value.length >= 2 && results.length > 0;
  const showEmpty = value.length >= 2 && !isLoading && results.length === 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className={cn("relative", className)}>
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className="pr-8"
          />
          {isLoading && (
            <Loader2Icon className="absolute right-2.5 top-1/2 -translate-y-1/2 size-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 w-[--radix-popover-trigger-width]"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandList>
            {showRecent && (
              <CommandGroup heading="Recherches recentes">
                {recentSearches.map((recent) => (
                  <CommandItem
                    key={recent.puuid}
                    value={`${recent.gameName}#${recent.tagLine}`}
                    onSelect={() => handleRecentSelect(recent)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <ClockIcon className="size-4 text-muted-foreground" />
                    <Avatar className="size-6">
                      {recent.profileIconId ? (
                        <AvatarImage
                          src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${recent.profileIconId}.png`}
                          alt={recent.gameName}
                        />
                      ) : null}
                      <AvatarFallback className="text-xs">
                        {recent.gameName[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{recent.gameName}</span>
                      <span className="text-muted-foreground">
                        #{recent.tagLine}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground uppercase">
                      {recent.region}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {showResults && (
              <CommandGroup heading="Suggestions">
                {results.map((result) => (
                  <CommandItem
                    key={result.puuid}
                    value={`${result.gameName}#${result.tagLine}`}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-3 cursor-pointer"
                  >
                    <Avatar className="size-8">
                      {result.profileIconId ? (
                        <AvatarImage
                          src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${result.profileIconId}.png`}
                          alt={result.gameName || ""}
                        />
                      ) : null}
                      <AvatarFallback>
                        <UserIcon className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div>
                        <span className="font-medium">{result.gameName}</span>
                        <span className="text-muted-foreground">
                          #{result.tagLine}
                        </span>
                      </div>
                      {result.stats?.totalMatches ? (
                        <div className="text-xs text-muted-foreground">
                          {result.stats.totalMatches} parties
                          {result.stats.winRate !== undefined && (
                            <span className="ml-2">
                              {result.stats.winRate.toFixed(0)}% WR
                            </span>
                          )}
                        </div>
                      ) : null}
                    </div>
                    <span className="text-xs text-muted-foreground uppercase">
                      {result.region}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {showEmpty && (
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                Aucun joueur trouve dans la base de donnees.
                <br />
                <span className="text-xs">
                  Appuyez sur Entree pour rechercher via Riot API.
                </span>
              </CommandEmpty>
            )}

            {!showRecent && !showResults && !showEmpty && (
              <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                Tapez au moins 2 caracteres pour rechercher
              </CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
