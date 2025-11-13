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
  };
  best: {
    tier: string;
    rank: string;
    lp: number;
  };
  seasonHistory: SeasonHistory[];
}

// Données factices pour l'instant
const MOCK_SOLO_DATA: RankData = {
  current: {
    tier: "EMERALD",
    rank: "II",
    lp: 1,
    wins: 169,
    losses: 148,
  },
  best: {
    tier: "DIAMOND",
    rank: "IV",
    lp: 20,
  },
  seasonHistory: [
    { season: "S2024 S3", tier: "PLATINUM", rank: "IV", lp: 96 },
    { season: "S2024 S2", tier: "PLATINUM", rank: "IV", lp: 0 },
    { season: "S2024 S1", tier: "PLATINUM", rank: "III", lp: 81 },
    { season: "S2023 S2", tier: "PLATINUM", rank: "III", lp: 57 },
    { season: "S2023 S1", tier: "GOLD", rank: "III", lp: 62 },
  ],
};

const MOCK_FLEX_DATA: RankData = {
  current: {
    tier: "PLATINUM",
    rank: "II",
    lp: 55,
    wins: 17,
    losses: 7,
  },
  best: {
    tier: "PLATINUM",
    rank: "II",
    lp: 55,
  },
  seasonHistory: [
    { season: "S2024 S3", tier: "PLATINUM", rank: "III", lp: 48 },
    { season: "S2024 S1", tier: "EMERALD", rank: "IV", lp: 52 },
    { season: "S2023 S2", tier: "PLATINUM", rank: "I", lp: 0 },
  ],
};

interface RankInfoSectionProps {
  puuid: string;
  region?: string | null;
}

export const RankInfoSection = ({ puuid, region }: RankInfoSectionProps) => {
  // Pour l'instant, on utilise les données factices
  // TODO: Remplacer par de vraies données quand l'API sera disponible
  const soloData = MOCK_SOLO_DATA;
  const flexData = MOCK_FLEX_DATA;

  return (
    <div className="space-y-3">
      <RankCard title="Classé en solo/duo" data={soloData} queueType="solo" />
      <RankCard title="Classé flexible" data={flexData} queueType="flex" />
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
  const winRate =
    data.current.wins + data.current.losses === 0
      ? 0
      : (data.current.wins / (data.current.wins + data.current.losses)) * 100;

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
              Taux de victoire {winRate.toFixed(0)}%
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
                {data.best.lp} LP
              </div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground">Meilleur tier</div>
        </div>

        {/* Historique des saisons */}
        {data.seasonHistory.length > 0 && (
          <div className="space-y-2 border-t border-border/50 pt-3">
            <div className="text-xs font-semibold text-foreground">
              {queueType === "solo" ? "Classé en solo/duo" : "Classé flexible"}
            </div>
            <div className="overflow-hidden rounded border border-border/60">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border/50">
                    <TableHead className="h-8 text-[10px] uppercase text-muted-foreground">
                      Saison
                    </TableHead>
                    <TableHead className="h-8 text-[10px] uppercase text-muted-foreground">
                      Tier
                    </TableHead>
                    <TableHead className="h-8 text-right text-[10px] uppercase text-muted-foreground">
                      LP
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
              Voir tous les tiers des saisons
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
