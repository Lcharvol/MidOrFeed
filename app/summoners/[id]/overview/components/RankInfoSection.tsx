"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getTierIconUrl } from "@/constants/ddragon";
import { useSummonerRanked } from "@/lib/hooks/use-summoner-ranked";
import { useI18n } from "@/lib/i18n-context";

const TIER_NAMES: Record<string, string> = {
  IRON: "Fer",
  BRONZE: "Bronze",
  SILVER: "Argent",
  GOLD: "Or",
  PLATINUM: "Platine",
  EMERALD: "Émeraude",
  DIAMOND: "Diamant",
  MASTER: "Maître",
  GRANDMASTER: "Grand Maître",
  CHALLENGER: "Challenger",
};

const RANK_ROMAN: Record<string, string> = {
  IV: "IV",
  III: "III",
  II: "II",
  I: "I",
};

interface SeasonHistory {
  season: string;
  tier: string;
  rank: string;
  lp: number;
}

interface RankData {
  current: {
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
    winRate?: number;
  };
  best: {
    tier: string;
    rank: string;
    lp: number;
  };
  seasonHistory: SeasonHistory[];
}

interface RankInfoSectionProps {
  puuid: string;
  region?: string | null;
}

export const RankInfoSection = ({ puuid, region }: RankInfoSectionProps) => {
  const { t } = useI18n();
  const { solo, flex, isLoading } = useSummonerRanked(puuid, region);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Card className="border-border/70 bg-background/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">
              {t("summoners.rankedSolo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-8">
            <div className="text-center text-sm text-muted-foreground">
              {t("summoners.loading")}
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/70 bg-background/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">
              {t("summoners.rankedFlex")}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-8">
            <div className="text-center text-sm text-muted-foreground">
              {t("summoners.loading")}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {solo ? (
        <RankCard title={t("summoners.rankedSolo")} data={solo} queueType="solo" />
      ) : (
        <Card className="border-border/70 bg-background/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">
              {t("summoners.rankedSolo")}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-8">
            <div className="text-center text-sm text-muted-foreground">
              {t("summoners.unranked")}
            </div>
          </CardContent>
        </Card>
      )}
      {flex ? (
        <RankCard title={t("summoners.rankedFlex")} data={flex} queueType="flex" />
      ) : (
        <Card className="border-border/70 bg-background/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-foreground">
              {t("summoners.rankedFlex")}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-8">
            <div className="text-center text-sm text-muted-foreground">
              {t("summoners.unranked")}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface RankCardProps {
  title: string;
  data: RankData;
  queueType: "solo" | "flex";
}

const getTierColorClass = (tier: string): string => {
  const colors: Record<string, string> = {
    IRON: "bg-stone-500",
    BRONZE: "bg-orange-600",
    SILVER: "bg-gray-400",
    GOLD: "bg-yellow-500",
    PLATINUM: "bg-teal-400",
    EMERALD: "bg-emerald-500",
    DIAMOND: "bg-sky-400",
    MASTER: "bg-purple-500",
    GRANDMASTER: "bg-red-500",
    CHALLENGER: "bg-yellow-500",
  };
  return colors[tier] || "bg-gray-500";
};

const RankCard = ({ title, data, queueType }: RankCardProps) => {
  const { t } = useI18n();
  const winRate = data.current.winRate ?? 0;

  const currentTierName = TIER_NAMES[data.current.tier] || data.current.tier;
  const currentRankDisplay = data.current.rank
    ? `${currentTierName.toLowerCase()} ${
        RANK_ROMAN[data.current.rank] || data.current.rank
      }`
    : currentTierName.toLowerCase();

  const bestTierName = TIER_NAMES[data.best.tier] || data.best.tier;
  const bestRankDisplay = data.best.rank
    ? `${bestTierName.toLowerCase()} ${
        RANK_ROMAN[data.best.rank] || data.best.rank
      }`
    : bestTierName.toLowerCase();

  return (
    <Card className="border-border/70 bg-background/90 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pb-3 px-4 pt-0">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Image
              src={getTierIconUrl(
                data.current.tier,
                data.current.rank,
                "medals"
              )}
              alt={`${currentTierName} ${data.current.rank || ""}`}
              width={64}
              height={64}
              className="shrink-0"
              unoptimized
            />
            <div className="flex-1">
              <div className="text-base font-bold lowercase text-foreground">
                {currentRankDisplay}
              </div>
              <div className="text-xs text-muted-foreground">
                {data.current.lp} LP
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs">
            <div className="text-muted-foreground">
              {data.current.wins}V {data.current.losses}D
            </div>
            <div className="font-semibold text-foreground">
              {t("summoners.winRateLabel")} {winRate.toFixed(0)}%
            </div>
          </div>
        </div>

        {/* Meilleur rang */}
        <div className="flex items-center justify-between border-t border-border/50 pt-3">
          <div className="flex items-center gap-2">
            <Image
              src={getTierIconUrl(
                data.best.tier,
                data.best.rank,
                "medals_mini"
              )}
              alt={`${bestTierName} ${data.best.rank || ""}`}
              width={40}
              height={40}
              className="shrink-0"
              unoptimized
            />
            <div>
              <div className="text-sm font-bold lowercase text-foreground">
                {bestRankDisplay}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {data.best.lp} {t("summoners.lp")}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground">{t("summoners.bestTier")}</div>
        </div>

        {/* Historique des saisons */}
        {data.seasonHistory.length > 0 && (
          <div className="space-y-2 border-t border-border/50 pt-3">
            <div className="text-xs font-semibold text-foreground">
              {queueType === "solo" ? t("summoners.rankedSolo") : t("summoners.rankedFlex")}
            </div>
            <div className="overflow-hidden rounded border border-border/60">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50">
                    <TableHead className="h-8 text-[10px] uppercase text-muted-foreground">
                      {t("summoners.season")}
                    </TableHead>
                    <TableHead className="h-8 text-[10px] uppercase text-muted-foreground">
                      {t("summoners.tier")}
                    </TableHead>
                    <TableHead className="h-8 text-right text-[10px] uppercase text-muted-foreground">
                      {t("summoners.lp")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.seasonHistory.map((history) => {
                    const tierColor = getTierColorClass(history.tier);
                    const tierName = TIER_NAMES[history.tier] || history.tier;
                    return (
                      <TableRow
                        key={history.season}
                        className="border-border/50"
                      >
                        <TableCell className="h-8 text-xs font-semibold text-foreground">
                          {history.season}
                        </TableCell>
                        <TableCell className="h-8">
                          <div className="flex items-center gap-1.5">
                            <Image
                              src={getTierIconUrl(
                                history.tier,
                                history.rank,
                                "medals_mini"
                              )}
                              alt={`${tierName} ${history.rank || ""}`}
                              width={40}
                              height={40}
                              className="shrink-0"
                              unoptimized
                            />
                            <span className="text-xs text-foreground lowercase">
                              {tierName.toLowerCase()}{" "}
                              {RANK_ROMAN[history.rank] || history.rank}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="h-8 text-right text-xs text-foreground">
                          {history.lp}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="text-[10px] text-muted-foreground">
              {t("summoners.viewAllSeasonTiers")}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
