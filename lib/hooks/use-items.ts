"use client";

import { useMemo } from "react";
import type { ApiResponse, ItemEntity } from "@/types";
import { useApiSWR, STATIC_DATA_CONFIG } from "./swr";
import { apiKeys } from "@/lib/api/keys";
import { validateItemListResponse } from "@/lib/api/schemas";

type ItemsApiResponse = ApiResponse<ItemEntity[]> & {
  count?: number;
};

export const useItems = (params?: { limit?: number; map?: string }) => {
  const limit = params?.limit ?? 1000;
  const map = params?.map ?? "11";

  const { data, error, isLoading, mutate, isValidating } =
    useApiSWR<ItemsApiResponse>(
      apiKeys.itemsList({ limit, map }),
      STATIC_DATA_CONFIG
    );

  const validation = useMemo(
    () => (data ? validateItemListResponse(data) : null),
    [data]
  );

  const items = useMemo<ItemEntity[]>(() => {
    if (!validation || !validation.ok) return [];
    return validation.value.items as unknown as ItemEntity[];
  }, [validation]);

  return {
    items,
    count:
      validation && validation.ok && validation.value.count !== undefined
        ? validation.value.count
        : items.length,
    error: error ?? (validation && !validation.ok ? validation.error : undefined),
    isLoading,
    isValidating,
    mutate,
  };
};
