"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { SwordsIcon, HomeIcon, AlertCircleIcon } from "lucide-react";
import { createLogger } from "@/lib/logger";

const logger = createLogger("compare");
import { toast } from "sonner";
import { useApiSWR } from "@/lib/hooks/swr";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { ComparisonFilters } from "./ComparisonFilters";
import { ComparisonResults } from "./ComparisonResults";
import { parsePlayerQuery } from "./types";
import type { CompareResponse } from "./types";

export default function ComparePage() {
  const [player1Query, setPlayer1Query] = useState("");
  const [player2Query, setPlayer2Query] = useState("");
  const [region1, setRegion1] = useState("euw1");
  const [region2, setRegion2] = useState("euw1");
  const [compareUrl, setCompareUrl] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const { data, isLoading } = useApiSWR<CompareResponse>(compareUrl, {
    revalidateOnFocus: false,
  });

  const handleCompare = useCallback(async () => {
    if (isSearching) return;
    const parsed1 = parsePlayerQuery(player1Query);
    const parsed2 = parsePlayerQuery(player2Query);

    if (!parsed1) {
      setSearchError("Joueur 1 : format invalide. Utilise le format Nom#TAG");
      return;
    }
    if (!parsed2) {
      setSearchError("Joueur 2 : format invalide. Utilise le format Nom#TAG");
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    try {
      const [res1, res2] = await Promise.all([
        fetch("/api/riot/search-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameName: parsed1.gameName,
            tagLine: parsed1.tagLine,
            region: region1,
          }),
        }),
        fetch("/api/riot/search-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameName: parsed2.gameName,
            tagLine: parsed2.tagLine,
            region: region2,
          }),
        }),
      ]);

      const data1 = await res1.json();
      const data2 = await res2.json();

      if (!res1.ok || !data1.data?.puuid) {
        const msg = `Joueur 1 introuvable : ${data1.error || `${parsed1.gameName}#${parsed1.tagLine} n'existe pas sur ${region1.toUpperCase()}`}`;
        setSearchError(msg);
        return;
      }
      if (!res2.ok || !data2.data?.puuid) {
        const msg = `Joueur 2 introuvable : ${data2.error || `${parsed2.gameName}#${parsed2.tagLine} n'existe pas sur ${region2.toUpperCase()}`}`;
        setSearchError(msg);
        return;
      }

      setCompareUrl(
        `/api/compare?puuid1=${data1.data.puuid}&region1=${region1}&puuid2=${data2.data.puuid}&region2=${region2}`
      );
    } catch (error) {
      logger.error("Compare search error", error as Error);
      setSearchError("Erreur réseau. Vérifie ta connexion et réessaie.");
    } finally {
      setIsSearching(false);
    }
  }, [player1Query, player2Query, region1, region2, isSearching]);

  const player1 = data?.data?.player1 || null;
  const player2 = data?.data?.player2 || null;
  const comparison = data?.data?.comparison || null;
  const hasData = player1 && player2 && comparison;

  return (
    <div className="container mx-auto py-8 sm:py-10 px-4 max-w-6xl">
      <Breadcrumb className="mb-4">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">
                <HomeIcon className="size-4" />
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Comparer</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <SwordsIcon className="size-6 sm:size-8 text-muted-foreground" />
          Comparer des joueurs
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Analyse complete de deux joueurs
        </p>
      </div>

      <ComparisonFilters
        player1Query={player1Query}
        setPlayer1Query={setPlayer1Query}
        player2Query={player2Query}
        setPlayer2Query={setPlayer2Query}
        region1={region1}
        setRegion1={setRegion1}
        region2={region2}
        setRegion2={setRegion2}
        onCompare={handleCompare}
        isSearching={isSearching}
        isLoading={isLoading}
      />

      {searchError && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive mb-6">
          <AlertCircleIcon className="size-5 shrink-0" />
          <p>{searchError}</p>
        </div>
      )}

      {(isLoading || hasData) && (
        <ComparisonResults
          player1={player1}
          player2={player2}
          comparison={comparison}
          isLoading={isLoading}
        />
      )}

      {!isLoading && !hasData && (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <SwordsIcon />
            </EmptyMedia>
            <EmptyTitle>Aucune comparaison en cours</EmptyTitle>
            <EmptyDescription>
              Entrez les noms de deux joueurs au format <strong>Nom#TAG</strong>{" "}
              et cliquez sur Comparer pour voir leurs statistiques cote a cote.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}
    </div>
  );
}
