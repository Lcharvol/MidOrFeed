"use client";

import { ChampionIcon } from "@/components/ChampionIcon";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoryIcon } from "lucide-react";
import { useApiSWR } from "@/lib/hooks/swr";
import { apiKeys } from "@/lib/api/keys";
import type { DraftHistoryResponse, DraftAnalyzeTeamPick } from "@/types/draft";
import { formatRelativeDate } from "@/lib/format-date";
import { useI18n } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

function PickIcons({ picks, team }: { picks: DraftAnalyzeTeamPick[]; team: "blue" | "red" }) {
  return (
    <div className="flex gap-0.5">
      {picks.map((pick, i) => (
        <ChampionIcon
          key={`${team}-${i}`}
          championId={pick.championId}
          size={24}
          shape="rounded"
        />
      ))}
    </div>
  );
}

export function DraftHistoryTable() {
  const { t, locale } = useI18n();
  const { data, isLoading } = useApiSWR<DraftHistoryResponse>(
    apiKeys.draftHistory(30),
    { revalidateOnFocus: false }
  );

  if (isLoading || !data?.data || data.data.history.length === 0) {
    return null;
  }

  const entries = data.data.history.slice(0, 10);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <HistoryIcon className="size-4 text-primary" />
          {t("draft.recentDrafts")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {entries.map((entry) => {
          const winPct = Math.round(entry.blueWinProbability * 1000) / 10;
          const blueWins = entry.blueWinProbability >= 0.5;
          return (
            <div
              key={entry.id}
              className="flex items-center gap-2 rounded-lg border border-border/30 p-2 text-sm"
            >
              <PickIcons picks={entry.bluePicks} team="blue" />
              <span
                className={cn(
                  "min-w-[52px] text-center font-medium",
                  blueWins ? "text-blue-400" : "text-red-400"
                )}
              >
                {winPct}%
              </span>
              <PickIcons picks={entry.redPicks} team="red" />
              <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                {formatRelativeDate(entry.recordedAt, locale === "fr" ? "fr" : "en")}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
