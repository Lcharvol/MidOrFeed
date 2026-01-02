"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChampionIcon } from "@/components/ChampionIcon";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { TrophyIcon } from "lucide-react";
import { getChampionSplashUrl } from "@/constants/ddragon";
import { useI18n } from "@/lib/i18n-context";
import Image from "next/image";
import type { ChampionIdToStats } from "@/types";
import { cn } from "@/lib/utils";
import { getKdaLevel, KDA_STYLES } from "@/lib/styles/game-colors";

interface BestChampionCardProps {
  championStats: ChampionIdToStats;
  championNameMap: Map<string, string>;
  championKeyToId: Map<string, string>;
  resolveSlug: (idOrKey: string) => string;
}

export const BestChampionCard = ({
  championStats,
  championNameMap,
  championKeyToId,
  resolveSlug,
}: BestChampionCardProps) => {
  const { t } = useI18n();
  // Trouver le meilleur champion (le plus joué)
  const bestChampion = Object.entries(championStats).sort(
    (a, b) => b[1].played - a[1].played
  )[0];

  if (!bestChampion) {
    return null;
  }

  const [bestChampionId, stats] = bestChampion;
  const winRate = ((stats.wins / (stats.played || 1)) * 100).toFixed(1);
  const kda = ((stats.kills + stats.assists) / (stats.deaths || 1)).toFixed(2);
  const championName = championNameMap.get(bestChampionId) ?? bestChampionId;

  return (
    <Card
      variant="gradient"
      className="relative overflow-hidden border-purple-500/25 from-background to-purple-500/10 dark:border-purple-500/25 dark:from-background dark:to-purple-500/10"
    >
      <div className="pointer-events-none absolute inset-0 z-0">
        <Image
          src={getChampionSplashUrl(resolveSlug(bestChampionId))}
          alt=""
          fill
          priority
          className="object-cover object-center opacity-45"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/75 via-background/60 to-background/30" />
      </div>
      <CardHeader className="relative z-10 pb-1.5 pt-2">
        <CardTitle className="text-xs font-semibold text-purple-700 dark:text-purple-100">
          {t("summoners.bestChampion")}
        </CardTitle>
      </CardHeader>
      <CardContent className="relative z-10 space-y-1 pb-2.5 pt-0">
        <div className="flex items-center gap-2">
          <ChampionIcon
            championId={resolveSlug(bestChampionId)}
            alt={championName}
            championKey={bestChampionId}
            championKeyToId={championKeyToId}
            size={36}
            shape="rounded"
            className="border border-white/30 shadow-lg"
            clickable
          />
          <div className="text-base font-bold leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]">
            {championName}
          </div>
        </div>
        <Separator className="my-1.5" />
        <div className="flex items-center justify-between gap-2 text-xs">
          <div>
            <p className="text-[10px] text-muted-foreground">{t("summoners.games")}</p>
            <p className="font-semibold tabular-nums text-foreground text-sm">
              {stats.played}
            </p>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground">{t("summoners.winRate")}</p>
            <div className="flex items-center gap-1.5">
              <Progress
                value={parseFloat(winRate)}
                className="h-1.5 w-full max-w-[70px] bg-purple-500/30"
                indicatorClassName="bg-purple-600 dark:bg-purple-400"
              />
              <Badge
                variant={parseFloat(winRate) >= 50 ? "success" : "destructive"}
                className="text-[10px] px-1.5 py-0 h-4"
              >
                {winRate}%
              </Badge>
            </div>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">{t("summoners.kda")}</p>
            <p
              className={cn(
                "font-semibold tabular-nums text-sm",
                KDA_STYLES[getKdaLevel(parseFloat(kda))].text
              )}
            >
              {kda}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

