"use client";

import { useMemo } from "react";
import { useApiSWR, STATIC_DATA_CONFIG } from "./swr";

type GoogleClientState = {
  clientId: string | null;
  isConfigured: boolean;
  isLoading: boolean;
};

type ConfigResponse = {
  success?: boolean;
  data?: { googleClientId?: string | null };
};

// Récupérer le client ID depuis les variables d'environnement si disponible
const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const useGoogleClientId = (): GoogleClientState => {
  // Si le client ID est déjà disponible via env, ne pas faire de requête
  const shouldFetch = !envClientId;

  const { data, isLoading } = useApiSWR<ConfigResponse>(
    shouldFetch ? "/api/config/public" : null,
    {
      ...STATIC_DATA_CONFIG,
      // Configuration rarement change - cache très long
      dedupingInterval: 10 * 60 * 1000, // 10 minutes
    }
  );

  const clientId = useMemo(() => {
    // Priorité: variable d'environnement, puis API
    if (envClientId) return envClientId;
    if (data?.success && data?.data?.googleClientId) {
      return data.data.googleClientId;
    }
    return null;
  }, [data]);

  return {
    clientId,
    isConfigured: Boolean(clientId),
    isLoading: shouldFetch && isLoading,
  };
};
