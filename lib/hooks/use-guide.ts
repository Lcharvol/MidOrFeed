"use client";

import { useCallback } from "react";
import { mutate } from "swr";
import { useApiSWR, SEMI_DYNAMIC_CONFIG } from "./swr";
import type {
  ChampionGuide,
  GuideDetailResponse,
  CreateGuideRequest,
  UpdateGuideRequest,
} from "@/types/guides";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const useGuide = (guideId: string | null) => {
  const key = guideId ? `/api/guides/${guideId}` : null;

  const { data, error, isLoading, isValidating } = useApiSWR<
    ApiResponse<GuideDetailResponse>
  >(key, SEMI_DYNAMIC_CONFIG);

  const guide: ChampionGuide | null = data?.data?.guide ?? null;

  const revalidate = useCallback(() => {
    if (key) mutate(key);
  }, [key]);

  return {
    guide,
    isLoading,
    isValidating,
    error: error || (data?.success === false ? new Error(data.error) : null),
    revalidate,
  };
};

// Hook for creating a guide
export const useCreateGuide = () => {
  const createGuide = useCallback(async (data: CreateGuideRequest) => {
    const response = await fetch("/api/guides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Erreur lors de la création du guide");
    }

    // Revalidate guides list
    mutate((key) => typeof key === "string" && key.startsWith("/api/guides"));

    return result.data.guide;
  }, []);

  return { createGuide };
};

// Hook for updating a guide
export const useUpdateGuide = () => {
  const updateGuide = useCallback(
    async (guideId: string, data: UpdateGuideRequest) => {
      const response = await fetch(`/api/guides/${guideId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erreur lors de la mise à jour");
      }

      // Revalidate this guide and list
      mutate(`/api/guides/${guideId}`);
      mutate((key) => typeof key === "string" && key.startsWith("/api/guides?"));

      return result.data.guide;
    },
    []
  );

  return { updateGuide };
};

// Hook for deleting a guide
export const useDeleteGuide = () => {
  const deleteGuide = useCallback(async (guideId: string) => {
    const response = await fetch(`/api/guides/${guideId}`, {
      method: "DELETE",
      credentials: "include",
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.error || "Erreur lors de la suppression");
    }

    // Revalidate guides list
    mutate((key) => typeof key === "string" && key.startsWith("/api/guides"));

    return true;
  }, []);

  return { deleteGuide };
};
