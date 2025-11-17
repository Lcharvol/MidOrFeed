"use client";

import { ChampionIcon } from "@/components/ChampionIcon";
import { useI18n } from "@/lib/i18n-context";
import type { ChampionStat } from "./types";

interface ChampionsPlayedProps {
  champions: ChampionStat[];
  totalMatches: number;
  championKeyToId: Map<string, string>;
  resolveSlug: (idOrKey: string) => string;
}

export const ChampionsPlayed = ({
  champions,
  totalMatches,
  championKeyToId,
  resolveSlug,
}: ChampionsPlayedProps) => {
  const { t } = useI18n();
  if (champions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted-foreground pb-2">
        {t("summoners.championsPlayedInLastMatches").replace(
          "{count}",
          totalMatches.toString()
        )}
      </div>
      <div className="flex flex-col gap-5">
        {champions.map((champStat) => (
          <div key={champStat.championId} className="flex items-center gap-2">
            <ChampionIcon
              championId={resolveSlug(champStat.championId)}
              championKey={champStat.championId}
              championKeyToId={championKeyToId}
              size={30}
              clickable
            />
            <div className="text-xs">
              <div className="font-semibold text-foreground">
                {champStat.winRate.toFixed(0)}% ({champStat.wins}V/
                {champStat.losses}D)
              </div>
              <div className="text-muted-foreground">
                {champStat.kdaRatio.toFixed(2)}:1 KDA
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
