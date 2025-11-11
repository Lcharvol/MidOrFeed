"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChampionSelect } from "@/components/ChampionSelect";
import { Loader2Icon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCounterPicks } from "@/lib/hooks/use-counter-picks";
import { CounterPickSummaryCard } from "./components/CounterPickSummaryCard";
import { CounterPickTips } from "./components/CounterPickTips";
import { CounterPickTable } from "./components/CounterPickTable";

type CounterPicksPageClientProps = {
  initialChampionId: string;
  initialChampionName?: string | null;
};

const CounterPicksPageClient = ({
  initialChampionId,
  initialChampionName = null,
}: CounterPicksPageClientProps) => {
  const router = useRouter();

  const {
    championSummaries,
    championNameMap,
    selectedChampion,
    setSelectedChampion,
    counterData,
    pairs,
    summary,
    tips,
    isLoading,
    error,
  } = useCounterPicks(initialChampionId);

  const championOptions = useMemo(
    () =>
      championSummaries.map((champion) => ({
        id: champion.championId,
        name: champion.name,
      })),
    [championSummaries]
  );

  const selectedChampionName =
    championNameMap.get(selectedChampion) ?? selectedChampion;

  const resolvedChampionName =
    selectedChampionName || initialChampionName || initialChampionId || "";

  const heroChampionLabel = resolvedChampionName
    ? resolvedChampionName
    : "League of Legends";

  const handleChampionChange = (championId: string) => {
    setSelectedChampion(championId);
    const targetPath = championId
      ? `/counter-picks/${encodeURIComponent(championId)}`
      : "/counter-picks";
    router.replace(targetPath, { scroll: false });
  };

  const renderContent = () => {
    if (!selectedChampion) {
      return (
        <article aria-live="polite">
          <Card className="border-dashed border-primary/40 bg-primary/5">
            <CardHeader>
              <CardTitle>Commencez par choisir un champion</CardTitle>
              <CardDescription>
                Sélectionnez un champion pour découvrir les meilleurs counter picks
                basés sur des centaines de résultats collectés.
              </CardDescription>
            </CardHeader>
          </Card>
        </article>
      );
    }

    if (isLoading) {
      return (
        <article aria-live="polite">
          <Card>
            <CardContent className="flex items-center justify-center gap-3 py-10 text-muted-foreground">
              <Loader2Icon className="size-5 animate-spin" />
              Analyse des counter picks en cours...
            </CardContent>
          </Card>
        </article>
      );
    }

    if (error || !counterData) {
      return (
        <article aria-live="polite">
          <Card className="border-red-500/30 bg-red-500/5">
            <CardHeader>
              <CardTitle>Erreur</CardTitle>
              <CardDescription>
                Impossible de récupérer les counter picks pour l’instant.
              </CardDescription>
            </CardHeader>
          </Card>
        </article>
      );
    }

    if (!summary || pairs.length === 0) {
      return (
        <article aria-live="polite">
          <Card className="border-amber-500/40 bg-amber-500/10">
            <CardHeader>
              <CardTitle>Aucune donnée exploitable</CardTitle>
              <CardDescription>
                Collectez davantage de matchs ou ajustez vos filtres pour enrichir
                l’analyse.
              </CardDescription>
            </CardHeader>
          </Card>
        </article>
      );
    }

    const summaryHeadingId = "summary-counter-picks";
    const tableHeadingId = "table-counter-picks";

    return (
      <article
        aria-label={`Analyse des counter picks pour ${resolvedChampionName}`}
        className="space-y-8"
      >
        <section aria-labelledby={summaryHeadingId}>
          <h2 id={summaryHeadingId} className="sr-only">
            Résumé des counter picks pour {resolvedChampionName}
          </h2>
          <CounterPickSummaryCard
            championId={selectedChampion}
            championName={resolvedChampionName}
            championNameMap={championNameMap}
            summary={summary}
          />
        </section>

        {tips.length > 0 && (
          <section aria-label="Conseils rapides">
            <CounterPickTips
              championName={resolvedChampionName}
              tips={tips}
            />
          </section>
        )}

        <section aria-labelledby={tableHeadingId}>
          <h2 id={tableHeadingId} className="sr-only">
            Classement des counter picks pour {resolvedChampionName}
          </h2>
          <CounterPickTable
            championName={resolvedChampionName}
            pairs={pairs}
            championNameMap={championNameMap}
          />
        </section>
      </article>
    );
  };

  return (
    <main
      className="container mx-auto space-y-10 py-12"
      aria-labelledby="counter-picks-heading"
    >
      <section className="space-y-3">
        <h1
          id="counter-picks-heading"
          className="text-3xl font-bold tracking-tight text-foreground"
        >
          Counter picks {heroChampionLabel}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {selectedChampion || initialChampionName
            ? `Retrouvez les meilleurs counter picks, matchups fiables et conseils pour vaincre ${heroChampionLabel} sur League of Legends.`
            : "Sélectionnez un champion pour obtenir une analyse détaillée des matchups les plus efficaces et mieux préparer vos drafts."}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <article className="h-full">
          <Card className="border-2 border-primary/20 bg-background">
            <CardHeader>
              <CardTitle>Counter picks ciblés</CardTitle>
              <CardDescription>
                Explorez les matchups gagnants pour un champion spécifique.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <ChampionSelect
                options={championOptions}
                value={selectedChampion || null}
                onChange={handleChampionChange}
                label="Champion à contrer"
                placeholder="Sélectionnez un champion"
              />
            </CardContent>
          </Card>
        </article>

        <section aria-live="polite" className="space-y-6">
          {renderContent()}
        </section>
      </section>
    </main>
  );
};

export default CounterPicksPageClient;
