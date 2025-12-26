"use client";

import { useMemo } from "react";
import type { ApiResponse, GameVersion } from "@/types";
import { useApiSWR, STATIC_DATA_CONFIG } from "./swr";
import { apiKeys } from "@/lib/api/keys";

type VersionsPayload = {
  versions: GameVersion[];
  currentVersion: string | null;
};

export const useGameVersions = () => {
  const {
    data,
    error,
    isLoading,
    isValidating,
    mutate,
  } = useApiSWR<ApiResponse<VersionsPayload>>(
    apiKeys.riotVersions(),
    STATIC_DATA_CONFIG
  );

  const versions = useMemo<GameVersion[]>(() => {
    if (!data || !("success" in data) || !data.success || !data.data) {
      return [];
    }
    return data.data.versions;
  }, [data]);

  const currentVersion = useMemo<string | null>(() => {
    if (!data || !("success" in data) || !data.success || !data.data) {
      return null;
    }
    return data.data.currentVersion;
  }, [data]);

  return {
    versions,
    currentVersion,
    isLoading,
    isValidating,
    error,
    refresh: mutate,
  };
};

