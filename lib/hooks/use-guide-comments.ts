"use client";

import { useCallback } from "react";
import { mutate } from "swr";
import { useApiSWR, SEMI_DYNAMIC_CONFIG } from "./swr";
import type {
  GuideComment,
  GuideCommentsResponse,
  CreateCommentRequest,
} from "@/types/guides";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const useGuideComments = (guideId: string | null) => {
  const key = guideId ? `/api/guides/${guideId}/comments` : null;

  const { data, error, isLoading, isValidating } = useApiSWR<
    ApiResponse<GuideCommentsResponse>
  >(key, SEMI_DYNAMIC_CONFIG);

  const comments: GuideComment[] = data?.data?.comments ?? [];
  const total: number = data?.data?.total ?? 0;

  const revalidate = useCallback(() => {
    if (key) mutate(key);
  }, [key]);

  return {
    comments,
    total,
    isLoading,
    isValidating,
    error: error || (data?.success === false ? new Error(data.error) : null),
    revalidate,
  };
};

export const useCreateComment = () => {
  const createComment = useCallback(
    async (guideId: string, data: CreateCommentRequest) => {
      const response = await fetch(`/api/guides/${guideId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erreur lors de l'ajout du commentaire");
      }

      // Revalidate comments
      mutate(`/api/guides/${guideId}/comments`);

      return result.data.comment as GuideComment;
    },
    []
  );

  return { createComment };
};

export const useCommentVote = () => {
  const vote = useCallback(
    async (commentId: string, value: -1 | 0 | 1, guideId: string) => {
      const response = await fetch("/api/guides/comments/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ commentId, value }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Erreur lors du vote");
      }

      // Revalidate comments to reflect the new vote
      mutate(`/api/guides/${guideId}/comments`);

      return result.data;
    },
    []
  );

  return { vote };
};
