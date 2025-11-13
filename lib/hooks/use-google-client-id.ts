"use client";

import { useEffect, useState } from "react";

type GoogleClientState = {
  clientId: string | null;
  isConfigured: boolean;
  isLoading: boolean;
};

const envClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const useGoogleClientId = (): GoogleClientState => {
  const [clientId, setClientId] = useState<string | null>(
    envClientId ? envClientId : null
  );
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    if (clientId !== null) {
      return;
    }

    let isMounted = true;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/config/public");
        if (!response.ok) {
          return;
        }
        const payload = (await response.json()) as {
          success?: boolean;
          data?: { googleClientId?: string | null };
        };
        if (payload?.success && payload?.data?.googleClientId && isMounted) {
          setClientId(payload.data.googleClientId);
        }
      } catch (error) {
        console.error("Failed to load Google client id", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      isMounted = false;
    };
  }, [clientId]);

  return {
    clientId,
    isConfigured: Boolean(clientId),
    isLoading,
  };
};
