"use client";

import { useApiSWR } from "./swr";
import { apiKeys } from "@/lib/api/keys";

type PatchesResponse = {
  success: boolean;
  data?: { patches: string[] };
  error?: string;
};

export const usePatches = () => {
  const { data, error, isLoading } = useApiSWR<PatchesResponse>(
    apiKeys.patches(),
    { revalidateOnFocus: false }
  );

  return {
    patches: data?.success ? data.data?.patches ?? [] : [],
    isLoading,
    error,
  };
};
