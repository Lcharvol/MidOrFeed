"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChampionIcon } from "@/components/ChampionIcon";
import { ROLE_LABELS, type CompositionRole } from "@/lib/compositions/roles";
import { ROLE_ICON_MAP } from "@/components/icons/role-icons";
import { Skeleton } from "@/components/ui/skeleton";
import { RotateCcwIcon, LogInIcon } from "lucide-react";
import type { DraftAnalyzeResponse, DraftPick } from "@/types/draft";
import { useI18n } from "@/lib/i18n-context";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

const ROLE_TO_ICON_KEY: Record<CompositionRole, keyof typeof ROLE_ICON_MAP> = {
  TOP: "TOP",
  JUNGLE: "JUNGLE",
  MIDDLE: "MIDDLE",
  BOTTOM: "BOTTOM",
  UTILITY: "UTILITY",
};

interface DraftResultsProps {
  analysis: DraftAnalyzeResponse | null;
  analysisLoading: boolean;
  bluePicks: DraftPick[];
  redPicks: DraftPick[];
  onPlayAgain: () => void;
}

export function DraftResults({
  analysis,
  analysisLoading,
  onPlayAgain,
}: DraftResultsProps) {
  const { t } = useI18n();
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-center">{t("draft.results")}</h2>

      {/* Win Probability Bar */}
      {analysisLoading ? (
        <Skeleton className="h-10 w-full rounded-full" />
      ) : analysis ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span className="text-blue-400">
              {t("draft.blueTeam")} {(analysis.blueWinProbability * 100).toFixed(1)}%
            </span>
            <span className="text-red-400">
              {t("draft.redTeam")} {(analysis.redWinProbability * 100).toFixed(1)}%
            </span>
          </div>
          <div className="h-4 rounded-full overflow-hidden flex bg-muted">
            <div
              className="bg-blue-500 transition-all duration-700"
              style={{ width: `${analysis.blueWinProbability * 100}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-700"
              style={{ width: `${analysis.redWinProbability * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Lane Matchups */}
      {analysisLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : analysis ? (
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t("draft.laneMatchups")}
          </h3>
          {analysis.laneMatchups.map((matchup) => {
            const blueWinPct = matchup.blueWinRate * 100;
            const blueAdvantage = matchup.blueWinRate > 0.5;
            const redAdvantage = matchup.blueWinRate < 0.5;
            const RoleIcon = ROLE_ICON_MAP[ROLE_TO_ICON_KEY[matchup.role]];

            return (
              <div
                key={matchup.role}
                className="flex items-center gap-2 rounded-lg border border-border/30 p-2"
              >
                {/* Blue champion */}
                <div className={cn("flex items-center gap-2 flex-1", blueAdvantage && "font-semibold")}>
                  <ChampionIcon championId={matchup.blueChampionId} size={32} shape="rounded" />
                </div>

                {/* Role + WR */}
                <div className="flex flex-col items-center min-w-[80px]">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <RoleIcon className="size-3.5" />
                    <span className="text-xs">{ROLE_LABELS[matchup.role]}</span>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      blueAdvantage ? "text-blue-400" : redAdvantage ? "text-red-400" : "text-muted-foreground"
                    )}
                  >
                    {blueWinPct.toFixed(0)}% - {(100 - blueWinPct).toFixed(0)}%
                  </span>
                  {matchup.gamesPlayed > 0 && (
                    <span className="text-[10px] text-muted-foreground">
                      {matchup.gamesPlayed} {t("common.games")}
                    </span>
                  )}
                </div>

                {/* Red champion */}
                <div className={cn("flex items-center gap-2 flex-1 justify-end", redAdvantage && "font-semibold")}>
                  <ChampionIcon championId={matchup.redChampionId} size={32} shape="rounded" />
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* Team Stats Comparison */}
      {analysis && (
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-blue-400 font-medium">{analysis.blueTeamStats.avgWinRate.toFixed(1)}%</div>
            <div className="text-muted-foreground text-xs">{t("draft.avgWinRate")}</div>
          </div>
          <div>
            <div className="text-muted-foreground font-medium">vs</div>
          </div>
          <div>
            <div className="text-red-400 font-medium">{analysis.redTeamStats.avgWinRate.toFixed(1)}%</div>
            <div className="text-muted-foreground text-xs">{t("draft.avgWinRate")}</div>
          </div>

          <div>
            <div className="text-blue-400 font-medium">{analysis.blueTeamStats.avgKDA.toFixed(2)}</div>
            <div className="text-muted-foreground text-xs">KDA</div>
          </div>
          <div />
          <div>
            <div className="text-red-400 font-medium">{analysis.redTeamStats.avgKDA.toFixed(2)}</div>
            <div className="text-muted-foreground text-xs">KDA</div>
          </div>

          <div>
            <div className="text-blue-400 font-medium">{analysis.blueTeamStats.avgScore.toFixed(0)}</div>
            <div className="text-muted-foreground text-xs">Score</div>
          </div>
          <div />
          <div>
            <div className="text-red-400 font-medium">{analysis.redTeamStats.avgScore.toFixed(0)}</div>
            <div className="text-muted-foreground text-xs">Score</div>
          </div>
        </div>
      )}

      {/* Play Again */}
      <div className="flex flex-col items-center gap-3">
        <Button onClick={onPlayAgain} size="lg" className="gap-2">
          <RotateCcwIcon className="size-4" />
          {t("draft.playAgain")}
        </Button>
        {!user && (
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogInIcon className="size-3.5" />
            {t("draft.loginToTrack")}
          </Link>
        )}
      </div>
    </div>
  );
}
