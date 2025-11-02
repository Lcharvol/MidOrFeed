"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

interface UseAIAnalysisReturn {
  canAnalyze: boolean;
  isAnalyzing: boolean;
  remainingAnalyses: number;
  startAnalysis: () => Promise<boolean>;
  isPremium: boolean;
}

// Limites d'analyses par tier
const ANALYSIS_LIMITS = {
  free: 3, // 3 analyses par jour pour les gratuits
  premium: Infinity, // Illimité pour les premium
} as const;

export function useAIAnalysis(): UseAIAnalysisReturn {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const isPremium = useMemo(() => {
    if (!user?.subscriptionTier) return false;

    // Vérifier si l'abonnement est encore valide
    if (user.subscriptionExpiresAt) {
      const expiryDate = new Date(user.subscriptionExpiresAt);
      const now = new Date();

      if (user.subscriptionTier === "premium" && expiryDate > now) {
        return true;
      }
    }

    return false;
  }, [user?.subscriptionTier, user?.subscriptionExpiresAt]);

  const remainingAnalyses = useMemo(() => {
    if (!user) return 0;

    if (isPremium) {
      return Infinity;
    }

    // Réinitialiser le compteur si c'est un nouveau jour
    const now = new Date();
    const lastResetTimestamp = user.lastDailyReset || now.toISOString();
    const lastReset = new Date(lastResetTimestamp);
    const isNewDay =
      now.getDate() !== lastReset.getDate() ||
      now.getMonth() !== lastReset.getMonth() ||
      now.getFullYear() !== lastReset.getFullYear();

    if (isNewDay) {
      return ANALYSIS_LIMITS.free;
    }

    const used = user.dailyAnalysesUsed || 0;
    return Math.max(0, ANALYSIS_LIMITS.free - used);
  }, [user, isPremium]);

  const canAnalyze = useMemo(() => {
    return remainingAnalyses > 0 || isPremium;
  }, [remainingAnalyses, isPremium]);

  const startAnalysis = async (): Promise<boolean> => {
    if (!canAnalyze) {
      toast.error(
        isPremium
          ? "Vous avez atteint votre limite quotidienne d'analyses gratuites"
          : "Abonnez-vous pour des analyses illimitées!"
      );
      return false;
    }

    if (isAnalyzing) {
      return false;
    }

    setIsAnalyzing(true);

    // TODO: Incrémenter le compteur côté backend
    // Pour l'instant, on retourne juste true
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 100);

    return true;
  };

  return {
    canAnalyze,
    isAnalyzing,
    remainingAnalyses,
    startAnalysis,
    isPremium,
  };
}
