"use client";

import useSWR, { type SWRConfiguration, type Key, mutate } from "swr";
import useSWRMutation, {
  type SWRMutationConfiguration,
} from "swr/mutation";
import { useCallback, useRef } from "react";

// Fetcher par défaut avec gestion d'erreur
const defaultFetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = new Error(response.statusText);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }
  return response.json();
};

// Fetcher pour les mutations POST/PUT/DELETE
const mutationFetcher = async (
  url: string,
  { arg }: { arg: { method?: string; body?: unknown } }
) => {
  const response = await fetch(url, {
    method: arg.method || "POST",
    headers: { "Content-Type": "application/json" },
    body: arg.body ? JSON.stringify(arg.body) : undefined,
  });
  if (!response.ok) {
    const error = new Error(response.statusText);
    (error as Error & { status: number }).status = response.status;
    throw error;
  }
  return response.json();
};

// Configuration par défaut optimisée
const DEFAULT_CONFIG: SWRConfiguration = {
  fetcher: defaultFetcher,
  // Désactiver la revalidation au focus par défaut (trop agressif)
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  shouldRetryOnError: false,
  // Déduplication de 60s pour éviter les appels redondants
  dedupingInterval: 60_000,
  // Garder les données précédentes pendant le rechargement
  keepPreviousData: true,
  // Timeout pour éviter les requêtes trop longues
  loadingTimeout: 10_000,
  // Ne pas revalider au mount si les données sont fraîches
  revalidateIfStale: false,
};

// Configuration pour les données statiques (champions, items, versions)
export const STATIC_DATA_CONFIG: SWRConfiguration = {
  ...DEFAULT_CONFIG,
  dedupingInterval: 5 * 60 * 1000, // 5 minutes
  revalidateOnFocus: false,
  revalidateIfStale: false,
  // Données statiques: revalider toutes les 10 minutes max
  refreshInterval: 0,
};

// Configuration pour les données semi-dynamiques (stats, leaderboard)
export const SEMI_DYNAMIC_CONFIG: SWRConfiguration = {
  ...DEFAULT_CONFIG,
  dedupingInterval: 2 * 60 * 1000, // 2 minutes
  revalidateIfStale: true,
};

// Configuration pour les données temps réel (notifications, status)
export const REALTIME_CONFIG: SWRConfiguration = {
  ...DEFAULT_CONFIG,
  dedupingInterval: 10_000, // 10 secondes
  revalidateOnFocus: true,
  revalidateIfStale: true,
};

// Hook SWR principal avec configuration optimisée
export const useApiSWR = <Data = unknown, Error = unknown>(
  key: Key,
  config?: SWRConfiguration<Data, Error>
) => useSWR<Data, Error>(key, { ...DEFAULT_CONFIG, ...config });

// Hook pour les mutations avec déduplication et gestion d'état
export const useApiMutation = <Data = unknown, Error = unknown>(
  key: string,
  config?: SWRMutationConfiguration<Data, Error, string, { method?: string; body?: unknown }>
) => {
  return useSWRMutation<Data, Error, string, { method?: string; body?: unknown }>(
    key,
    mutationFetcher,
    {
      // Revalider les données associées après mutation
      revalidate: true,
      // Ne pas rollback en cas d'erreur (laisser l'UI gérer)
      rollbackOnError: false,
      ...config,
    }
  );
};

// Hook pour éviter les double-clics sur les mutations
export const useDebouncedMutation = <T, Args extends unknown[]>(
  mutationFn: (...args: Args) => Promise<T>,
  delayMs = 500
) => {
  const lastCallRef = useRef<number>(0);
  const pendingRef = useRef<Promise<T> | null>(null);

  return useCallback(
    async (...args: Args): Promise<T> => {
      const now = Date.now();

      // Si une mutation est en cours, retourner la promise existante
      if (pendingRef.current && now - lastCallRef.current < delayMs) {
        return pendingRef.current;
      }

      lastCallRef.current = now;
      pendingRef.current = mutationFn(...args);

      try {
        return await pendingRef.current;
      } finally {
        pendingRef.current = null;
      }
    },
    [mutationFn, delayMs]
  );
};

// Fonction utilitaire pour invalider le cache de manière ciblée
export const invalidateSWRCache = (keyPattern: string | RegExp) => {
  if (typeof keyPattern === "string") {
    mutate(keyPattern);
  } else {
    mutate((key) => typeof key === "string" && keyPattern.test(key));
  }
};

// Prefetch de données (utile pour le hover/preload)
export const prefetchSWR = async <T>(key: string, fetcher?: () => Promise<T>) => {
  const fetchFn = fetcher || (() => defaultFetcher(key));
  const data = await fetchFn();
  mutate(key, data, { revalidate: false });
  return data;
};


