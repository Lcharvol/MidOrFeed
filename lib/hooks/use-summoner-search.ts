"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useRecentSearch, type RecentSearch } from "./use-recent-search";

type SearchResult = {
  puuid: string;
  gameName?: string;
  tagLine?: string;
  region: string;
  profileIconId?: number;
  stats?: { totalMatches?: number };
};

type UseSummonerSearchOptions = {
  onSearchStart?: () => void;
  onSearchEnd?: () => void;
  onNavigate?: () => void;
  defaultRegion?: string;
};

export function useSummonerSearch(options: UseSummonerSearchOptions = {}) {
  const {
    onSearchStart,
    onSearchEnd,
    onNavigate,
    defaultRegion = "euw1",
  } = options;

  const router = useRouter();
  const { recentSearches, addRecentSearch } = useRecentSearch();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchRegion, setSearchRegion] = useState(defaultRegion);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

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
        result.puuid
      );

      setSearchQuery("");
      setSearchResults([]);
      onNavigate?.();

      router.push(`/summoners/${result.puuid}/overview?region=${result.region}`);
    },
    [addRecentSearch, router, onNavigate]
  );

  // Perform full search via Riot API
  const performSearch = useCallback(
    async (query: string, region: string) => {
      const trimmed = query.trim();
      if (!trimmed || trimmed.length < 2) {
        toast.error("Entrez au moins 2 caractères");
        return;
      }

      // Parse gameName#tagLine format
      const hashIndex = trimmed.lastIndexOf("#");
      if (hashIndex === -1 || hashIndex === 0 || hashIndex === trimmed.length - 1) {
        toast.error("Format invalide. Utilisez: Nom#Tag");
        return;
      }

      const gameName = trimmed.slice(0, hashIndex).trim();
      const tagLine = trimmed.slice(hashIndex + 1).trim();

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
          body: JSON.stringify({
            gameName,
            tagLine,
            region,
          }),
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

  // Clear search state
  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
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

    // Actions
    search,
    performSearch,
    navigateToResult,
    handleRecentClick,
    clearSearch,
  };
}
