"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRecentSearch, type RecentSearch } from "./use-recent-search";

type SearchResult = {
  puuid: string;
  gameName?: string | null;
  tagLine?: string | null;
  region: string;
  profileIconId?: number | null;
  level?: number | null;
  stats?: { totalMatches?: number; winRate?: number; avgKDA?: number };
};

type PartialSearchResults = {
  results: SearchResult[];
  query: string;
  isNoResults: boolean;
};

type UseSummonerSearchOptions = {
  onSearchStart?: () => void;
  onSearchEnd?: () => void;
  onNavigate?: () => void;
  onPartialResults?: (partial: PartialSearchResults) => void;
  defaultRegion?: string;
};

export function useSummonerSearch(options: UseSummonerSearchOptions = {}) {
  const {
    onSearchStart,
    onSearchEnd,
    onNavigate,
    onPartialResults,
    defaultRegion = "euw1",
  } = options;

  const router = useRouter();
  const { recentSearches, addRecentSearch } = useRecentSearch();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchRegion, setSearchRegion] = useState(defaultRegion);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [partialSearchResults, setPartialSearchResults] =
    useState<PartialSearchResults | null>(null);

  // Local search for autocomplete
  const performLocalSearch = useCallback(
    async (query: string, region: string) => {
      if (!query || query.length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const response = await fetch("/api/search/summoners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query,
            region,
            limit: 5,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          setSearchResults(result.results || []);
        }
      } catch (error) {
        console.error("Local search error:", error);
      }
    },
    []
  );

  // Debounced local search
  useEffect(() => {
    const timer = setTimeout(() => {
      performLocalSearch(searchQuery, searchRegion);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, searchRegion, performLocalSearch]);

  // Navigate to a search result
  const navigateToResult = useCallback(
    (result: SearchResult) => {
      if (!result.puuid) return;

      addRecentSearch(
        result.gameName || result.puuid,
        result.tagLine || result.region,
        result.region,
        result.puuid,
        result.profileIconId
      );

      setSearchQuery("");
      setSearchResults([]);
      onNavigate?.();

      router.push(`/summoners/${result.puuid}/overview?region=${result.region}`);
    },
    [addRecentSearch, router, onNavigate]
  );

  // Perform partial search via local DB (no # in query)
  const performPartialSearch = useCallback(
    async (query: string, region: string) => {
      setIsSearching(true);
      onSearchStart?.();

      try {
        const response = await fetch("/api/search/summoners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, region, limit: 20 }),
        });

        if (!response.ok) {
          toast.error("Erreur lors de la recherche");
          return;
        }

        const data = await response.json();
        const results: SearchResult[] = data.results || [];

        if (results.length === 1) {
          // Single result → navigate directly
          const r = results[0];
          addRecentSearch(
            r.gameName || r.puuid,
            r.tagLine || r.region,
            r.region,
            r.puuid,
            r.profileIconId
          );
          setSearchQuery("");
          setSearchResults([]);
          setPartialSearchResults(null);
          onNavigate?.();
          router.push(`/summoners/${r.puuid}/overview?region=${r.region}`);
        } else {
          const partial: PartialSearchResults = {
            results,
            query,
            isNoResults: results.length === 0,
          };
          setPartialSearchResults(partial);
          onPartialResults?.(partial);
        }
      } catch (error) {
        console.error("Partial search error:", error);
        toast.error("Erreur lors de la recherche");
      } finally {
        setIsSearching(false);
        onSearchEnd?.();
      }
    },
    [addRecentSearch, router, onSearchStart, onSearchEnd, onNavigate, onPartialResults]
  );

  // Perform full search via Riot API (has #)
  const performRiotSearch = useCallback(
    async (query: string, region: string) => {
      const hashIndex = query.lastIndexOf("#");
      const gameName = query.slice(0, hashIndex).trim();
      const tagLine = query.slice(hashIndex + 1).trim();

      if (!gameName || !tagLine) {
        toast.error("Le nom et le tag sont requis");
        return;
      }

      setIsSearching(true);
      onSearchStart?.();

      try {
        const response = await fetch("/api/riot/search-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameName, tagLine, region }),
        });

        const result = await response.json();

        if (!response.ok) {
          toast.error(result.error || "Erreur lors de la recherche");
          return;
        }

        const data = result.data;
        if (data?.puuid) {
          addRecentSearch(
            data.gameName ?? gameName,
            data.tagLine ?? tagLine,
            region,
            data.puuid
          );

          setSearchQuery("");
          setSearchResults([]);
          setPartialSearchResults(null);
          onNavigate?.();

          router.push(`/summoners/${data.puuid}/overview?region=${region}`);
        } else {
          toast.error("Réponse invalide du serveur");
        }
      } catch (error) {
        console.error("Search error:", error);
        toast.error("Erreur lors de la recherche");
      } finally {
        setIsSearching(false);
        onSearchEnd?.();
      }
    },
    [addRecentSearch, router, onSearchStart, onSearchEnd, onNavigate]
  );

  // Main search: branch on # presence
  const performSearch = useCallback(
    async (query: string, region: string) => {
      const trimmed = query.trim();
      if (!trimmed || trimmed.length < 2) {
        toast.error("Entrez au moins 2 caractères");
        return;
      }

      const hashIndex = trimmed.lastIndexOf("#");
      const hasValidHash =
        hashIndex > 0 && hashIndex < trimmed.length - 1;

      if (hasValidHash) {
        await performRiotSearch(trimmed, region);
      } else {
        // No # or incomplete # → partial search via local DB
        const cleanQuery = hashIndex > 0 ? trimmed.slice(0, hashIndex).trim() : trimmed;
        await performPartialSearch(cleanQuery, region);
      }
    },
    [performRiotSearch, performPartialSearch]
  );

  // Search with current state values
  const search = useCallback(() => {
    performSearch(searchQuery, searchRegion);
  }, [performSearch, searchQuery, searchRegion]);

  // Handle recent search click - directly navigate using stored puuid
  const handleRecentClick = useCallback(
    (recent: RecentSearch) => {
      // If we have a puuid, navigate directly
      if (recent.puuid) {
        setSearchQuery("");
        setSearchResults([]);
        onNavigate?.();
        router.push(`/summoners/${recent.puuid}/overview?region=${recent.region}`);
        return;
      }

      // Fallback: perform search if no puuid (legacy data)
      const query = `${recent.gameName}#${recent.tagLine}`;
      setSearchQuery(query);
      setSearchRegion(recent.region);
      performSearch(query, recent.region);
    },
    [performSearch, router, onNavigate]
  );

  // Clear partial results
  const clearPartialResults = useCallback(() => {
    setPartialSearchResults(null);
  }, []);

  // Clear search state
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setPartialSearchResults(null);
  }, []);

  return {
    // State
    searchQuery,
    setSearchQuery,
    searchRegion,
    setSearchRegion,
    isSearching,
    searchResults,
    recentSearches,
    partialSearchResults,

    // Actions
    search,
    performSearch,
    navigateToResult,
    handleRecentClick,
    clearSearch,
    clearPartialResults,
  };
}
