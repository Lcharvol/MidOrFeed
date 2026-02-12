"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useRecentSearch } from "@/lib/hooks/use-recent-search";
import { HeroSearchSection } from "./components/HeroSearchSection";
import { LinkedAccountCard } from "./components/LinkedAccountCard";
import { RecentSearches } from "./components/RecentSearches";
import { FeatureCards } from "./components/FeatureCards";
import { QuickLinks } from "./components/QuickLinks";

export default function SummonersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("euw1");
  const [isSearching, setIsSearching] = useState(false);
  const [formatHint, setFormatHint] = useState<string | null>(null);
  const { recentSearches } = useRecentSearch();

  const hasLinkedAccount = user?.leagueAccount?.puuid && user?.leagueAccount?.riotRegion;

  const handleSearch = useCallback(async () => {
    if (!query.trim()) {
      toast.error("Entrez un nom de joueur");
      return;
    }

    // Parse gameName#tagLine format
    const trimmed = query.trim();
    const hashIndex = trimmed.lastIndexOf("#");

    if (hashIndex === -1 || hashIndex === 0 || hashIndex === trimmed.length - 1) {
      setFormatHint("Format invalide. Utilisez Nom#TAG");
      return;
    }
    setFormatHint(null);

    const gameName = trimmed.slice(0, hashIndex).trim();
    const tagLine = trimmed.slice(hashIndex + 1).trim();

    setIsSearching(true);
    try {
      const response = await fetch("/api/riot/search-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameName, tagLine, region }),
      });

      const data = await response.json();

      if (!response.ok || !data.data?.puuid) {
        if (response.status === 404) {
          toast.error(`Joueur introuvable : ${gameName}#${tagLine} n'existe pas sur ${region.toUpperCase()}`);
        } else if (response.status === 429) {
          toast.error("Trop de requêtes — réessaie dans quelques secondes");
        } else {
          toast.error(data.error || "Erreur serveur — réessaie plus tard");
        }
        return;
      }

      router.push(`/summoners/${data.data.puuid}/overview?region=${region}`);
    } catch (error) {
      console.error(error);
      toast.error("Erreur réseau — vérifie ta connexion");
    } finally {
      setIsSearching(false);
    }
  }, [query, region, router]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <HeroSearchSection
        query={query}
        setQuery={setQuery}
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
