"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { authenticatedFetch } from "@/lib/api-client";
import { toast } from "sonner";

// Types pour l'analyse
export interface AIInsight {
  type: "strength" | "weakness" | "tip";
  category: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  data?: Record<string, unknown>;
}

export interface KeyMoment {
  timestamp: string;
  event: string;
  impact: "Positif" | "Négatif";
  decision: string;
}

export interface ChampionPerformance {
  championId: string;
  championName: string;
  performance: "excellent" | "good" | "average" | "poor";
  reasons: string[];
  suggestions: string[];
}

export interface MatchAnalysisResult {
  overall: {
    score: number;
    summary: string;
  };
  strengths: AIInsight[];
  weaknesses: AIInsight[];
  tips: AIInsight[];
  keyMoments: KeyMoment[];
  championPerformance: ChampionPerformance;
}

interface UseAIAnalysisReturn {
  canAnalyze: boolean;
  isAnalyzing: boolean;
  remainingAnalyses: number;
  isPremium: boolean;
  analysis: MatchAnalysisResult | null;
  error: string | null;
  analyzeMatch: (matchId: string, participantPuuid: string) => Promise<boolean>;
  refreshQuota: () => Promise<void>;
}

export function useAIAnalysis(): UseAIAnalysisReturn {
  const { user } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [remainingAnalyses, setRemainingAnalyses] = useState(3);
  const [isPremium, setIsPremium] = useState(false);
  const [canAnalyze, setCanAnalyze] = useState(true);
  const [analysis, setAnalysis] = useState<MatchAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Vérifier si l'utilisateur est authentifié
  const isAuthenticated = useMemo(() => !!user, [user]);

  // Rafraîchir le quota depuis l'API
  const refreshQuota = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await authenticatedFetch("/api/ai/analyze-match", {
        method: "GET",
      });

      if (response.ok) {
        const data = await response.json();
        setCanAnalyze(data.canAnalyze);
        setRemainingAnalyses(data.remaining === Infinity ? 999 : data.remaining);
        setIsPremium(data.isPremium);
      }
    } catch {
      // Silently fail - will use default values
    }
  }, [isAuthenticated]);

  // Charger le quota au montage
  useEffect(() => {
    if (isAuthenticated) {
      refreshQuota();
    }
  }, [isAuthenticated, refreshQuota]);

  // Analyser un match
  const analyzeMatch = useCallback(
    async (matchId: string, participantPuuid: string): Promise<boolean> => {
      if (!isAuthenticated) {
        setError("Vous devez être connecté pour analyser un match");
        toast.error("Vous devez être connecté pour analyser un match");
        return false;
      }

      if (!canAnalyze && !isPremium) {
        setError("Limite d'analyses quotidiennes atteinte");
        toast.error("Vous avez atteint votre limite d'analyses quotidiennes");
        return false;
      }

      if (isAnalyzing) {
        return false;
      }

      setIsAnalyzing(true);
      setError(null);
      setAnalysis(null);

      try {
        const response = await authenticatedFetch("/api/ai/analyze-match", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            matchId,
            participantPuuid,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 429) {
            setCanAnalyze(false);
            setRemainingAnalyses(0);
            setError("Limite d'analyses quotidiennes atteinte");
            toast.error("Limite d'analyses quotidiennes atteinte");
            return false;
          }

          setError(data.error || "Erreur lors de l'analyse");
          toast.error(data.error || "Erreur lors de l'analyse du match");
          return false;
        }

        setAnalysis(data.data);
        setRemainingAnalyses(
          data.remaining === Infinity ? 999 : data.remaining
        );
        setIsPremium(data.isPremium);
        setCanAnalyze(data.remaining > 0 || data.isPremium);

        toast.success("Analyse terminée avec succès");
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Erreur lors de l'analyse";
        setError(message);
        toast.error(message);
        return false;
      } finally {
        setIsAnalyzing(false);
      }
    },
    [isAuthenticated, canAnalyze, isPremium, isAnalyzing]
  );

  return {
    canAnalyze: canAnalyze || isPremium,
    isAnalyzing,
    remainingAnalyses: isPremium ? Infinity : remainingAnalyses,
    isPremium,
    analysis,
    error,
    analyzeMatch,
    refreshQuota,
  };
}
