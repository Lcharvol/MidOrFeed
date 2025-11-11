"use client";

import { useCallback, useMemo } from "react";
import type {
  ApiResponse,
  CompositionSuggestionDTO,
  CompositionSuggestionsPayload,
} from "@/types";
import { toast } from "sonner";
import { PopularHero } from "./components/PopularHero";
import { CompositionCard } from "./components/CompositionCard";
import { formatUpdatedAt } from "./components/utils";
import { useApiSWR } from "@/lib/hooks/swr";
import { useChampions } from "@/lib/hooks/use-champions";
import { apiKeys } from "@/lib/api/keys";
import { validateCompositionSuggestionsResponse } from "@/lib/api/schemas";
import { DataState } from "@/components/ui/data-state";
import { Button } from "@/components/ui/button";

const PopularCompositionsPage = () => {
  const { data, error, isLoading, mutate, isValidating } = useApiSWR<
    ApiResponse<CompositionSuggestionsPayload>
  >(apiKeys.compositionsPopular(), {
    refreshInterval: 120_000,
    revalidateOnFocus: false,
  });
  const {
    resolveSlug,
    resolveName,
    isLoading: championsLoading,
    error: championsError,
  } = useChampions();

  const validation = useMemo(
    () => (data ? validateCompositionSuggestionsResponse(data) : null),
    [data]
  );

  const compositionsPayload = useMemo(
    () => (validation && validation.ok ? validation.value : null),
    [validation]
  );

  const compositions = compositionsPayload?.compositions ?? [];
  const generatedAt = compositionsPayload?.generatedAt ?? null;

  const handleCopy = useCallback((composition: CompositionSuggestionDTO) => {
    const champions = composition.teamChampions;
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      toast.error("Copie impossible dans cet environnement");
      return;
    }
    navigator.clipboard
      .writeText(champions.join(", "))
      .then(() => toast.success("Composition copiée dans le presse-papier"))
      .catch(() => toast.error("Impossible de copier la composition"));
  }, []);

  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  if (isLoading || championsLoading) {
    return (
      <DataState
        variant="plain"
        isLoading
        title="Chargement des compositions"
        description="Nous récupérons les compositions idéales pour vous."
        containerClassName="container mx-auto py-16"
      />
    );
  }

  if (error || championsError || (validation && !validation.ok)) {
    return (
      <DataState
        tone="danger"
        title="Impossible de charger les compositions"
        description="Une erreur est survenue lors de la récupération des suggestions populaires."
        action={
          <Button variant="outline" onClick={handleRefresh}>
            Réessayer
          </Button>
        }
        containerClassName="container mx-auto py-16"
      />
    );
  }

  return (
    <div className="container mx-auto py-12 space-y-8">
      <PopularHero
        onRefresh={handleRefresh}
        isRefreshing={isValidating}
        lastGeneratedAt={generatedAt ? formatUpdatedAt(generatedAt) : undefined}
      />

      {compositions.length === 0 ? (
        <DataState
          tone="info"
          title="Aucune composition disponible"
          description="Lancez l’analyse des champions puis générez les suggestions dans l’admin panel pour remplir cette liste."
          containerClassName="py-12"
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {compositions.map((composition) => (
            <CompositionCard
              key={composition.id}
              resolveSlug={resolveSlug}
              resolveName={resolveName}
              onCopy={handleCopy}
              composition={composition}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PopularCompositionsPage;
