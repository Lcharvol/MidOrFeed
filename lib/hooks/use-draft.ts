"use client";

import { useReducer, useEffect, useRef, useCallback } from "react";
import { mutate } from "swr";
import type { CompositionRole } from "@/lib/compositions/roles";
import type { DraftAnalyzeResponse } from "@/types/draft";
import { draftReducer, createInitialState, getCurrentStep, isUserTurn } from "@/lib/draft/machine";
import { aiAction } from "@/lib/draft/ai";
import { AI_DELAY_MIN, AI_DELAY_MAX } from "@/lib/draft/constants";
import { useChampionStats } from "./use-champion-stats";
import { useChampions } from "./use-champions";
import { apiKeys } from "@/lib/api/keys";

export function useDraft() {
  const [state, dispatch] = useReducer(draftReducer, undefined, createInitialState);
  const { championStats } = useChampionStats();
  const { resolveSlug } = useChampions();
  const aiTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer effect
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (state.phase === "in_progress" && state.timerEnabled && isUserTurn(state)) {
      timerIntervalRef.current = setInterval(() => {
        dispatch({ type: "TIMER_TICK" });
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [state.phase, state.timerEnabled, state.currentStepIndex]);

  // AI turn effect
  useEffect(() => {
    if (state.phase !== "in_progress") return;
    const step = getCurrentStep(state);
    if (!step || step.team !== "red") return;
    if (championStats.length === 0) return;

    const delay = AI_DELAY_MIN + Math.random() * (AI_DELAY_MAX - AI_DELAY_MIN);

    aiTimeoutRef.current = setTimeout(() => {
      const result = aiAction(state, championStats);
      if (result) {
        dispatch({
          type: "AI_ACTION",
          championId: resolveSlug(result.championId),
          role: result.role,
        });
      }
    }, delay);

    return () => {
      if (aiTimeoutRef.current) {
        clearTimeout(aiTimeoutRef.current);
      }
    };
  }, [state.phase, state.currentStepIndex, championStats]);

  // Fetch analysis when draft finishes
  useEffect(() => {
    if (state.phase !== "finished") return;
    if (state.analysis || state.analysisLoading) return;

    dispatch({ type: "SET_ANALYSIS_LOADING", loading: true });

    fetch(apiKeys.draftAnalyze(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bluePicks: state.bluePicks.map((p) => ({
          championId: p.championId,
          role: p.role,
        })),
        redPicks: state.redPicks.map((p) => ({
          championId: p.championId,
          role: p.role,
        })),
      }),
    })
      .then((res) => res.json())
      .then((data: DraftAnalyzeResponse) => {
        dispatch({ type: "SET_ANALYSIS", analysis: data });

        // Fire-and-forget save to draft history
        const picks = {
          bluePicks: state.bluePicks.map((p) => ({
            championId: p.championId,
            role: p.role,
          })),
          redPicks: state.redPicks.map((p) => ({
            championId: p.championId,
            role: p.role,
          })),
        };
        fetch(apiKeys.draftSave(), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ analysis: data, ...picks }),
        })
          .then((res) => {
            if (res.ok) mutate(apiKeys.draftHistory());
          })
          .catch(() => {
            // Silent failure (guest users get 401)
          });
      })
      .catch(() => {
        dispatch({ type: "SET_ANALYSIS_LOADING", loading: false });
      });
  }, [state.phase, state.analysis, state.analysisLoading, state.bluePicks, state.redPicks]);

  const startDraft = useCallback(() => {
    dispatch({ type: "START_DRAFT" });
  }, []);

  const selectRole = useCallback((role: CompositionRole) => {
    dispatch({ type: "SELECT_ROLE", role });
  }, []);

  const hoverChampion = useCallback((championId: string) => {
    dispatch({ type: "HOVER_CHAMPION", championId });
  }, []);

  const confirmAction = useCallback(
    (championId: string, role?: CompositionRole) => {
      dispatch({ type: "CONFIRM_ACTION", championId, role });
    },
    []
  );

  const toggleTimer = useCallback(() => {
    dispatch({ type: "TOGGLE_TIMER" });
  }, []);

  const reset = useCallback(() => {
    if (aiTimeoutRef.current) clearTimeout(aiTimeoutRef.current);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    dispatch({ type: "RESET" });
  }, []);

  return {
    state,
    currentStep: getCurrentStep(state),
    isUserTurn: isUserTurn(state),
    startDraft,
    selectRole,
    hoverChampion,
    confirmAction,
    toggleTimer,
    reset,
  };
}
