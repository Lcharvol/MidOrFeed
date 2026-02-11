"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SwordsIcon } from "lucide-react";
import { toast } from "sonner";
import { useApiSWR } from "@/lib/hooks/swr";
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

  const { data, isLoading } = useApiSWR<CompareResponse>(compareUrl, {
    revalidateOnFocus: false,
  });

  const handleCompare = useCallback(async () => {
    const parsed1 = parsePlayerQuery(player1Query);
    const parsed2 = parsePlayerQuery(player2Query);

    if (!parsed1) {
      toast.error("Joueur 1: Format invalide. Utilisez Nom#TAG");
      return;
    }
    if (!parsed2) {
      toast.error("Joueur 2: Format invalide. Utilisez Nom#TAG");
      return;
    }

    setIsSearching(true);
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
        toast.error(`Joueur 1 non trouve: ${data1.error || "Erreur"}`);
        return;
      }
      if (!res2.ok || !data2.data?.puuid) {
        toast.error(`Joueur 2 non trouve: ${data2.error || "Erreur"}`);
        return;
      }

      setCompareUrl(
        `/api/compare?puuid1=${data1.data.puuid}&region1=${region1}&puuid2=${data2.data.puuid}&region2=${region2}`
      );
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  }, [player1Query, player2Query, region1, region2]);

  const player1 = data?.data?.player1 || null;
  const player2 = data?.data?.player2 || null;
  const comparison = data?.data?.comparison || null;
  const hasData = player1 && player2 && comparison;

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 max-w-6xl">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <SwordsIcon className="size-6 sm:size-8 text-primary" />
          Comparer des joueurs
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Analyse complete de deux joueurs
        </p>
      </div>

      {/* Search form */}
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

      {/* Comparison results */}
      {(isLoading || hasData) && (
        <ComparisonResults
          player1={player1}
          player2={player2}
          comparison={comparison}
          isLoading={isLoading}
        />
      )}

      {/* Empty state */}
      {!isLoading && !hasData && (
        <Card className="border-dashed border-border/50 bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <SwordsIcon className="size-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              Aucune comparaison en cours
            </h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Entrez les noms de deux joueurs au format <strong>Nom#TAG</strong>{" "}
              et cliquez sur Comparer pour voir leurs statistiques cote a cote.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
