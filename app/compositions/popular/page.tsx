"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { HomeIcon } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type {
  ApiResponse,
  CompositionSuggestionDTO,
  CompositionSuggestionsPayload,
} from "@/types";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import { authenticatedFetch } from "@/lib/api-client";
import { PopularHero } from "./components/PopularHero";
import { CompositionCard } from "./components/CompositionCard";
import { formatUpdatedAt } from "./components/utils";
import { useApiSWR } from "@/lib/hooks/swr";
import { useChampions } from "@/lib/hooks/use-champions";
import { apiKeys } from "@/lib/api/keys";
import { validateCompositionSuggestionsResponse } from "@/lib/api/schemas";
import { DataState } from "@/components/ui/data-state";
import { Button } from "@/components/ui/button";

// Role order matching ROLE_PRIORITY: [top, jungle, mid, adc, support]
const ROLE_KEYS = ["top", "jungle", "mid", "adc", "support"] as const;

const PopularCompositionsPage = () => {
  const { t } = useI18n();
  const { user } = useAuth();
  const [savingId, setSavingId] = useState<string | null>(null);
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
      toast.error(t("compositions.popular.copyUnavailable"));
      return;
    }
    navigator.clipboard
      .writeText(champions.join(", "))
      .then(() => toast.success(t("compositions.popular.copiedToClipboard")))
      .catch(() => toast.error(t("compositions.popular.copyFailed")));
  }, []);

  const handleSave = useCallback(
    async (composition: CompositionSuggestionDTO) => {
      if (!user) {
        toast.error(t("compositions.popular.loginRequired"));
        return;
      }

      setSavingId(composition.id);
      try {
        // Map teamChampions array to role-keyed object (ordered by ROLE_PRIORITY)
        const body: Record<string, string | null> = {
          name: `${resolveName(composition.suggestedChampion)} Comp`,
        };
        for (let i = 0; i < ROLE_KEYS.length; i++) {
          body[ROLE_KEYS[i]] = composition.teamChampions[i] ?? null;
        }

        const res = await authenticatedFetch("/api/compositions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          throw new Error("save failed");
        }

        toast.success(t("compositions.popular.saved"));
      } catch {
        toast.error(t("compositions.popular.saveFailed"));
      } finally {
        setSavingId(null);
      }
    },
    [user, t, resolveName]
  );

  const handleRefresh = useCallback(() => {
    mutate();
  }, [mutate]);

  if (isLoading || championsLoading) {
    return (
      <DataState
        variant="plain"
        isLoading
        title={t("compositions.popular.loading")}
        description={t("compositions.popular.loadingDescription")}
        containerClassName="container mx-auto py-16"
      />
    );
  }

  if (error || championsError || (validation && !validation.ok)) {
    return (
      <DataState
        tone="danger"
        title={t("compositions.popular.errorTitle")}
        description={t("compositions.popular.errorDescription")}
        action={
          <Button variant="outline" onClick={handleRefresh}>
            {t("compositions.popular.retry")}
          </Button>
        }
        containerClassName="container mx-auto py-16"
      />
    );
  }

  return (
    <div className="container mx-auto py-8 sm:py-12 px-4 space-y-8">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/"><HomeIcon className="size-4" /></Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t("compositions.popular.breadcrumb")}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <PopularHero
        onRefresh={handleRefresh}
        isRefreshing={isValidating}
        lastGeneratedAt={generatedAt ? formatUpdatedAt(generatedAt) : undefined}
      />

      {compositions.length === 0 ? (
        <DataState
          tone="info"
          title={t("compositions.popular.emptyTitle")}
          description={t("compositions.popular.emptyDescription")}
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
              onSave={handleSave}
              isSaving={savingId === composition.id}
              saveLabel={t("compositions.popular.save")}
              composition={composition}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PopularCompositionsPage;
