"use client";

import { cn } from "@/lib/utils";
import { ChampionIcon } from "@/components/ChampionIcon";
import { ROLE_LABELS, type CompositionRole } from "@/lib/compositions/roles";
import { ROLE_ICON_MAP } from "@/components/icons/role-icons";
import type { DraftPick, DraftStep } from "@/types/draft";
import { useI18n } from "@/lib/i18n-context";
import { useChampions } from "@/lib/hooks/use-champions";

const ROLES: CompositionRole[] = ["TOP", "JUNGLE", "MIDDLE", "BOTTOM", "UTILITY"];

const ROLE_TO_ICON_KEY: Record<CompositionRole, keyof typeof ROLE_ICON_MAP> = {
  TOP: "TOP",
  JUNGLE: "JUNGLE",
  MIDDLE: "MIDDLE",
  BOTTOM: "BOTTOM",
  UTILITY: "UTILITY",
};

interface TeamPanelProps {
  team: "blue" | "red";
  picks: DraftPick[];
  currentStep: DraftStep | null;
  className?: string;
}

export function TeamPanel({ team, picks, currentStep, className }: TeamPanelProps) {
  const { t } = useI18n();
  const { resolveName } = useChampions();
  const isActiveTeam = currentStep?.team === team && currentStep?.action === "pick";
  const teamColor = team === "blue" ? "text-blue-400" : "text-red-400";
  const teamBg = team === "blue" ? "bg-blue-500/10" : "bg-red-500/10";
  const teamBorder = team === "blue" ? "border-blue-500/30" : "border-red-500/30";
  const teamLabel = team === "blue" ? t("draft.blueTeam") : t("draft.redTeam");

  // Find the next unfilled role for this team
  const filledRoles = new Set(picks.map((p) => p.role));
  const nextRole = ROLES.find((r) => !filledRoles.has(r));

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <h3 className={cn("text-sm font-semibold uppercase tracking-wider", teamColor)}>
        {teamLabel}
      </h3>
      <div className="flex flex-row lg:flex-col gap-1.5">
        {ROLES.map((role) => {
          const pick = picks.find((p) => p.role === role);
          const isActiveSlot = isActiveTeam && role === nextRole;
          const RoleIcon = ROLE_ICON_MAP[ROLE_TO_ICON_KEY[role]];

          return (
            <div
              key={role}
              className={cn(
                "flex items-center gap-2 rounded-lg border p-1.5 transition-all min-w-0",
                pick ? cn(teamBorder, teamBg) : "border-border/30",
                isActiveSlot && "animate-pulse border-primary/50 bg-primary/5"
              )}
            >
              <div className="relative size-10 shrink-0 rounded-md overflow-hidden bg-muted/30">
                {pick ? (
                  <ChampionIcon
                    championId={pick.championId}
                    size={40}
                    shape="rounded"
                    fluid
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <RoleIcon className="size-5 text-muted-foreground/50" />
                  </div>
                )}
              </div>
              <div className="hidden lg:flex flex-col min-w-0">
                {pick ? (
                  <span className="text-xs font-medium truncate">
                    {resolveName(pick.championId)}
                  </span>
                ) : null}
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <RoleIcon className="size-3" />
                  {ROLE_LABELS[role]}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
