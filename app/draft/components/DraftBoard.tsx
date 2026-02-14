"use client";

import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChampionIcon } from "@/components/ChampionIcon";
import { ROLE_LABELS, type CompositionRole } from "@/lib/compositions/roles";
import { ROLE_ICON_MAP } from "@/components/icons/role-icons";
import {
  TimerIcon,
  PlayIcon,
  BanIcon,
  ShieldBanIcon,
} from "lucide-react";
import { useDraft } from "@/lib/hooks/use-draft";
import { getAllUnavailableIds, getAllBannedIds, getUnfilledRoles } from "@/lib/draft/machine";
import { TeamPanel } from "./TeamPanel";
import { ChampionGrid } from "./ChampionGrid";
import { DraftResults } from "./DraftResults";
import { DraftHistoryChart } from "./DraftHistoryChart";
import { DraftHistoryTable } from "./DraftHistoryTable";
import { useI18n } from "@/lib/i18n-context";

const ROLES: CompositionRole[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

const ROLE_TO_ICON_KEY: Record<CompositionRole, keyof typeof ROLE_ICON_MAP> = {
  TOP: "TOP",
  JUNGLE: "JUNGLE",
  MIDDLE: "MIDDLE",
  BOTTOM: "BOTTOM",
  UTILITY: "UTILITY",
};

export function DraftBoard() {
  const {
    state,
    currentStep,
    isUserTurn,
    startDraft,
    selectRole,
    hoverChampion,
    confirmAction,
    toggleTimer,
    reset,
  } = useDraft();
  const { t } = useI18n();

  const unavailableIds = useMemo(() => getAllUnavailableIds(state), [state]);
  const bannedIds = useMemo(() => getAllBannedIds(state), [state]);

  const unfilledUserRoles = useMemo(
    () => getUnfilledRoles(state.bluePicks),
    [state.bluePicks]
  );

  // Not started screen
  if (state.phase === "not_started") {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-16">
        <h1 className="text-3xl font-bold">{t("draft.title")}</h1>
        <p className="text-muted-foreground text-center max-w-md">
          {t("draft.description")}
        </p>
        <div className="flex items-center gap-3">
          <Button onClick={toggleTimer} variant="outline" size="sm" className="gap-2">
            <TimerIcon className="size-4" />
            {t("draft.timer")}: {state.timerEnabled ? t("draft.on") : t("draft.off")}
          </Button>
        </div>
        <Button onClick={startDraft} size="lg" className="gap-2">
          <PlayIcon className="size-4" />
          {t("draft.startDraft")}
        </Button>

        <div className="w-full max-w-2xl grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <DraftHistoryChart />
          <DraftHistoryTable />
        </div>
      </div>
    );
  }

  // Finished screen
  if (state.phase === "finished") {
    return (
      <div className="max-w-2xl mx-auto">
        {/* Final teams display */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <TeamPanel
            team="blue"
            picks={state.bluePicks}
            currentStep={null}
          />
          <TeamPanel
            team="red"
            picks={state.redPicks}
            currentStep={null}
          />
        </div>
        <DraftResults
          analysis={state.analysis}
          analysisLoading={state.analysisLoading}
          bluePicks={state.bluePicks}
          redPicks={state.redPicks}
          onPlayAgain={reset}
        />
      </div>
    );
  }

  // In progress
  const isPicking = currentStep?.action === "pick";
  const isBanning = currentStep?.action === "ban";

  return (
    <div className="space-y-4">
      {/* Phase banner — prominent for ban phase */}
      <div
        className={cn(
          "rounded-lg px-4 py-3 flex items-center justify-between transition-colors",
          isBanning
            ? "bg-red-500/15 border border-red-500/30"
            : "bg-muted/30 border border-border/30"
        )}
      >
        <div className="flex items-center gap-3">
          {isBanning ? (
            <div className="flex items-center gap-2 text-red-400">
              <ShieldBanIcon className="size-5" />
              <span className="text-base font-bold uppercase tracking-wide">
                {t("draft.banPhase")}
              </span>
            </div>
          ) : (
            <span className="text-base font-bold uppercase tracking-wide text-foreground">
              {currentStep?.phaseLabel}
            </span>
          )}
          <span className="text-sm text-muted-foreground">—</span>
          <span
            className={cn(
              "text-sm font-semibold",
              isUserTurn ? "text-blue-400" : "text-red-400"
            )}
          >
            {isUserTurn ? t("draft.yourTurn") : t("draft.enemyTurn")}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {state.timerEnabled && isUserTurn && (
            <span
              className={cn(
                "text-lg font-mono font-bold",
                state.timerSeconds <= 10 ? "text-red-400" : "text-foreground"
              )}
            >
              {state.timerSeconds}s
            </span>
          )}
          <Button onClick={toggleTimer} variant="ghost" size="sm" className="gap-1.5">
            <TimerIcon className="size-3.5" />
            {state.timerEnabled ? t("draft.on") : t("draft.off")}
          </Button>
        </div>
      </div>

      {/* Ban bar */}
      <div className="flex items-center justify-between gap-4">
        {/* Blue bans */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const ban = state.blueBans[i];
            return (
              <div
                key={`blue-ban-${i}`}
                className="size-9 rounded border border-border/30 overflow-hidden bg-muted/20 relative"
              >
                {ban ? (
                  <>
                    <ChampionIcon championId={ban.championId} size={36} shape="rounded" className="opacity-40 grayscale" />
                    <BanIcon className="absolute inset-0 m-auto size-4 text-red-400" />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground">
                    -
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <span className="text-xs text-muted-foreground">{t("draft.bans")}</span>

        {/* Red bans */}
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => {
            const ban = state.redBans[i];
            return (
              <div
                key={`red-ban-${i}`}
                className="size-9 rounded border border-border/30 overflow-hidden bg-muted/20 relative"
              >
                {ban ? (
                  <>
                    <ChampionIcon championId={ban.championId} size={36} shape="rounded" className="opacity-40 grayscale" />
                    <BanIcon className="absolute inset-0 m-auto size-4 text-red-400" />
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-[10px] text-muted-foreground">
                    -
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main layout: Blue panel | Champion grid | Red panel */}
      <div className="grid grid-cols-1 lg:grid-cols-[180px_1fr_180px] gap-4">
        <TeamPanel
          team="blue"
          picks={state.bluePicks}
          currentStep={currentStep}
          className="order-2 lg:order-1"
        />

        <div className="order-1 lg:order-2 space-y-3">
          {/* Role selector (only for pick phases when it's user's turn) */}
          {isPicking && isUserTurn && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs text-muted-foreground mr-1">
                {t("draft.selectRole")}:
              </span>
              {ROLES.map((role) => {
                const isFilled = !unfilledUserRoles.includes(role);
                const RoleIcon = ROLE_ICON_MAP[ROLE_TO_ICON_KEY[role]];
                return (
                  <Button
                    key={role}
                    variant={state.selectedRole === role ? "default" : "outline"}
                    size="sm"
                    onClick={() => selectRole(role)}
                    disabled={isFilled}
                    className="h-7 text-xs px-2 gap-1"
                  >
                    <RoleIcon className="size-3.5" />
                    {ROLE_LABELS[role]}
                  </Button>
                );
              })}
            </div>
          )}

          <ChampionGrid
            unavailableIds={unavailableIds}
            bannedIds={bannedIds}
            onSelect={(championId) => {
              confirmAction(championId, state.selectedRole ?? undefined);
            }}
            disabled={!isUserTurn}
            hoveredChampionId={state.hoveredChampionId}
            onHover={hoverChampion}
          />
        </div>

        <TeamPanel
          team="red"
          picks={state.redPicks}
          currentStep={currentStep}
          className="order-3"
        />
      </div>
    </div>
  );
}
