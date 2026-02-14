"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { createLogger } from "@/lib/logger";

const logger = createLogger("summoners-search");
import { toast } from "sonner";
import { useRecentSearch } from "@/lib/hooks/use-recent-search";
import { useI18n } from "@/lib/i18n-context";
import { HeroSearchSection } from "./components/HeroSearchSection";
import { LinkedAccountCard } from "./components/LinkedAccountCard";
import { RecentSearches } from "./components/RecentSearches";
import { FeatureCards } from "./components/FeatureCards";
import { QuickLinks } from "./components/QuickLinks";
import { SearchResultsList } from "./components/SearchResultsList";

type PartialResults = {
  results: Array<{
    puuid: string;
    gameName?: string | null;
    tagLine?: string | null;
    region: string;
    profileIconId?: number | null;
    level?: number | null;
    stats?: { totalMatches?: number; winRate?: number; avgKDA?: number };
  }>;
  query: string;
  isNoResults: boolean;
};

export default function SummonersPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("euw1");
  const [isSearching, setIsSearching] = useState(false);
  const [formatHint, setFormatHint] = useState<string | null>(null);
  const [partialResults, setPartialResults] = useState<PartialResults | null>(null);
  const { recentSearches } = useRecentSearch();

  const hasLinkedAccount = user?.leagueAccount?.puuid && user?.leagueAccount?.riotRegion;

  // Perform partial search (no #) via local DB
  const performPartialSearch = useCallback(
    async (searchQuery: string, searchRegion: string) => {
      setIsSearching(true);
      setFormatHint(null);

      try {
        const response = await fetch("/api/search/summoners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery, region: searchRegion, limit: 20 }),
        });

        if (!response.ok) {
          toast.error(t("summonerPage.searchError"));
          return;
        }

        const data = await response.json();
        const results = data.results || [];

        if (results.length === 1) {
          // Single result → navigate directly
          const r = results[0];
          router.push(`/summoners/${r.puuid}/overview?region=${r.region}`);
        } else {
          setPartialResults({
            results,
            query: searchQuery,
            isNoResults: results.length === 0,
          });
        }
      } catch (error) {
        logger.error("Partial search error", error as Error);
        toast.error(t("summonerPage.searchError"));
      } finally {
        setIsSearching(false);
      }
    },
    [router]
  );

  // Perform Riot API search (has #)
  const performRiotSearch = useCallback(
    async (searchQuery: string, searchRegion: string) => {
      const hashIndex = searchQuery.lastIndexOf("#");
      const gameName = searchQuery.slice(0, hashIndex).trim();
      const tagLine = searchQuery.slice(hashIndex + 1).trim();

      if (!gameName || !tagLine) {
        setFormatHint(t("summonerPage.nameAndTagRequired"));
        return;
      }

      setIsSearching(true);
      setFormatHint(null);

      try {
        const response = await fetch("/api/riot/search-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameName, tagLine, region: searchRegion }),
        });

        const data = await response.json();

        if (!response.ok || !data.data?.puuid) {
          if (response.status === 404) {
            toast.error(`${t("summonerPage.playerNotFound")} ${gameName}#${tagLine} (${searchRegion.toUpperCase()})`);
          } else if (response.status === 429) {
            toast.error(t("summonerPage.tooManyRequests"));
          } else {
            toast.error(data.error || t("summonerPage.serverError"));
          }
          return;
        }

        router.push(
          `/summoners/${data.data.puuid}/overview?region=${searchRegion}`
        );
      } catch (error) {
        logger.error("Riot search error", error as Error);
        toast.error(t("summonerPage.networkError"));
      } finally {
        setIsSearching(false);
      }
    },
    [router]
  );

  const handleSearch = useCallback(async () => {
    if (isSearching) return;
    const trimmed = query.trim();
    if (!trimmed) {
      toast.error(t("summonerPage.enterPlayerName"));
      return;
    }

    const hashIndex = trimmed.lastIndexOf("#");
    const hasValidHash = hashIndex > 0 && hashIndex < trimmed.length - 1;

    if (hasValidHash) {
      setPartialResults(null);
      await performRiotSearch(trimmed, region);
    } else {
      // No # or trailing # → partial search
      const cleanQuery = hashIndex > 0 ? trimmed.slice(0, hashIndex).trim() : trimmed;
      if (cleanQuery.length < 2) {
        toast.error(t("homeSearch.minCharacters"));
        return;
      }
      await performPartialSearch(cleanQuery, region);
    }
  }, [query, region, isSearching, performRiotSearch, performPartialSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // Read query params on mount (navigation from homepage)
  useEffect(() => {
    const q = searchParams.get("q");
    const r = searchParams.get("region");

    if (q) {
      setQuery(q);
      if (r) setRegion(r);
      // Trigger partial search automatically
      performPartialSearch(q, r || region);
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <HeroSearchSection
        query={query}
        setQuery={(v) => {
          setQuery(v);
          // Clear partial results when user retypes
          if (partialResults) setPartialResults(null);
        }}
        region={region}
        setRegion={setRegion}
        isSearching={isSearching}
        formatHint={formatHint}
        setFormatHint={setFormatHint}
        onSearch={handleSearch}
        onKeyDown={handleKeyDown}
        onSelectResult={(result) => {
          router.push(`/summoners/${result.puuid}/overview?region=${result.region}`);
        }}
      />

      {/* Partial Search Results */}
      {partialResults && (
        <SearchResultsList
          results={partialResults.results}
          query={partialResults.query}
          isNoResults={partialResults.isNoResults}
          onClear={() => setPartialResults(null)}
        />
      )}

      {/* Content Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Linked Account Card */}
          {hasLinkedAccount && user?.leagueAccount && (
            <LinkedAccountCard leagueAccount={user.leagueAccount} />
          )}

          {/* Recently Viewed */}
          <RecentSearches recentSearches={recentSearches} />

          {/* Feature Cards */}
          <FeatureCards />

          {/* Quick Links */}
          <QuickLinks />
        </div>
      </div>
    </div>
  );
}
