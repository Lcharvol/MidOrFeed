"use client";

import { createContext, useContext, useMemo, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { GameVersion } from "@/types";
import { useGameVersions } from "@/lib/hooks/use-game-versions";

const STORAGE_KEY = "lol-comp-maker:selected-version";

type GameVersionContextValue = {
  versions: GameVersion[];
  currentVersion: string | null;
  selectedVersion: string | null;
  isLoading: boolean;
  isValidating: boolean;
  selectVersion: (version: string | null) => void;
  clearSelection: () => void;
  refresh: () => Promise<unknown>;
};

const GameVersionContext = createContext<GameVersionContextValue | undefined>(undefined);

const isClient = () => typeof window !== "undefined";

export const GameVersionProvider = ({ children }: { children: ReactNode }) => {
  const {
    versions,
    currentVersion,
    isLoading,
    isValidating,
    refresh,
  } = useGameVersions();

  const [storedVersion, setStoredVersion] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  useEffect(() => {
    if (!isClient()) return;
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (value) {
      setStoredVersion(value);
    }
    setStorageReady(true);
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    if (!storedVersion) return;
    if (!versions.some((entry) => entry.version === storedVersion)) {
      setStoredVersion(null);
      if (isClient()) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, [versions, storedVersion, storageReady]);

  const effectiveVersion = useMemo(() => {
    const hasStored = storedVersion && versions.some((entry) => entry.version === storedVersion);
    if (hasStored) {
      return storedVersion;
    }

    if (currentVersion && versions.some((entry) => entry.version === currentVersion)) {
      return currentVersion;
    }

    return versions[0]?.version ?? null;
  }, [versions, storedVersion, currentVersion]);

  const selectVersion = useCallback((version: string | null) => {
    setStoredVersion(version);
    if (!isClient()) return;
    if (version) {
      window.localStorage.setItem(STORAGE_KEY, version);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const clearSelection = useCallback(() => {
    selectVersion(null);
  }, [selectVersion]);

  const value = useMemo<GameVersionContextValue>(
    () => ({
      versions,
      currentVersion,
      selectedVersion: effectiveVersion,
      isLoading: isLoading || !storageReady,
      isValidating,
      selectVersion,
      clearSelection,
      refresh,
    }),
    [
      versions,
      currentVersion,
      effectiveVersion,
      isLoading,
      storageReady,
      isValidating,
      selectVersion,
      clearSelection,
      refresh,
    ]
  );

  return <GameVersionContext.Provider value={value}>{children}</GameVersionContext.Provider>;
};

export const useGameVersionContext = () => {
  const context = useContext(GameVersionContext);
  if (!context) {
    throw new Error("useGameVersionContext must be used within a GameVersionProvider");
  }
  return context;
};
