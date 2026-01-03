"use client";

import { useCallback } from "react";
import { mutate } from "swr";
import { useApiSWR, SEMI_DYNAMIC_CONFIG } from "./swr";
import type {
  GuideSummary,
  GuideListResponse,
  GuideRole,
} from "@/types/guides";

interface UseChampionGuidesOptions {
  role?: GuideRole;
  sort?: "popular" | "recent" | "views";
  limit?: number;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const buildGuidesKey = (
  championId: string | null,
  options: UseChampionGuidesOptions
): string | null => {
  if (!championId) return null;

  const params = new URLSearchParams();
  params.set("championId", championId);
  if (options.role) params.set("role", options.role);
  if (options.sort) params.set("sort", options.sort);
  if (options.limit) params.set("limit", options.limit.toString());

  return `/api/guides?${params.toString()}`;
};

export const useChampionGuides = (
  championId: string | null,
  options: UseChampionGuidesOptions = {}
) => {
  const key = buildGuidesKey(championId, options);

  const { data, error, isLoading, isValidating } = useApiSWR<
    ApiResponse<GuideListResponse>
  >(key, SEMI_DYNAMIC_CONFIG);

  const guides: GuideSummary[] = data?.data?.guides ?? [];
  const total = data?.data?.total ?? 0;
  const hasMore = data?.data?.hasMore ?? false;

  const revalidate = useCallback(() => {
    if (key) mutate(key);
  }, [key]);

  return {
    guides,
    total,
    hasMore,
    isLoading,
    isValidating,
    error: error || (data?.success === false ? new Error(data.error) : null),
    revalidate,
  };
};

// Hook for voting on a guide
export const useGuideVote = () => {
  const vote = useCallback(
    async (guideId: string, value: -1 | 0 | 1) => {
      const response = await fetch("/api/guides/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ guideId, value }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erreur lors du vote");
      }

      // Revalidate guides list and single guide
      mutate((key) => typeof key === "string" && key.includes("/api/guides"));

      return result.data;
    },
    []
  );

  return { vote };
};
