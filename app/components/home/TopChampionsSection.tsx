"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  SwordsIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { TrendIcon } from "./TrendIcon";
import { formatNumber } from "./types";
import type { TierListChampionStats } from "@/types";

type TopChampionsSectionProps = {
  topChampions: TierListChampionStats[];
  championsLoading: boolean;
  totalUniqueMatches: number | undefined;
};

const winRateEmphasis = (wr: number) =>
  wr >= 52 ? "positive" as const : wr >= 48 ? "neutral" as const : "danger" as const;

const FeaturedChampion = ({ champion }: { champion: TierListChampionStats }) => {
  const { t } = useI18n();

  return (
    <Link href={`/champions/${champion.championId}`} className="block">
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 overflow-hidden group">
        <CardContent className="relative px-4 sm:px-6">
          {/* Rank watermark */}
          <span className="pointer-events-none absolute right-4 top-2 text-5xl font-black text-primary/15 select-none">
            1
          </span>

          <div className="flex items-center gap-4">
            <ChampionIcon
              championId={champion.championId}
              size={72}
              className="shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="min-w-0 flex-1">
              <div className="text-lg font-bold truncate">{champion.championId}</div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge
                  emphasis={winRateEmphasis(champion.winRate)}
                  emphasisVariant="subtle"
                  rounded="full"
                >
                  {champion.winRate.toFixed(1)}%
                </Badge>
                <TrendIcon trend={champion.winRateTrend?.trend} />
                <span className="text-xs text-muted-foreground">
                  KDA {champion.avgKDA.toFixed(2)}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatNumber(champion.totalGames)} {t("common.games")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const MediumChampion = ({ champion, rank }: { champion: TierListChampionStats; rank: number }) => {
  const { t } = useI18n();

  return (
    <Link href={`/champions/${champion.championId}`} className="block">
      <Card variant="interactive" className="overflow-hidden group">
        <CardContent className="relative px-4">
          {/* Rank watermark */}
          <span className="pointer-events-none absolute right-3 top-1 text-2xl font-black text-muted-foreground/40 select-none">
            {rank}
          </span>

          <div className="flex items-center gap-3">
            <ChampionIcon
              championId={champion.championId}
              size={48}
              className="shrink-0 group-hover:scale-105 transition-transform"
            />
            <div className="min-w-0 flex-1">
              <div className="font-medium text-sm truncate">{champion.championId}</div>
              <div className="flex items-center gap-1.5 mt-1">
                <Badge
                  emphasis={winRateEmphasis(champion.winRate)}
                  emphasisVariant="subtle"
                  rounded="full"
                  className="text-xs"
                >
                  {champion.winRate.toFixed(1)}%
                </Badge>
                <TrendIcon trend={champion.winRateTrend?.trend} />
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {formatNumber(champion.totalGames)} {t("common.games")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

const CompactChampion = ({ champion, rank }: { champion: TierListChampionStats; rank: number }) => {
  return (
    <Link
      href={`/champions/${champion.championId}`}
      className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-muted/30 group"
    >
      <span className="text-xs font-bold text-muted-foreground/50 w-4 text-right shrink-0">
        {rank}
      </span>
      <ChampionIcon
        championId={champion.championId}
        size={32}
        className="shrink-0 group-hover:scale-105 transition-transform"
      />
      <span className="font-medium text-sm truncate min-w-0 flex-1">
        {champion.championId}
      </span>
      <Badge
        emphasis={winRateEmphasis(champion.winRate)}
        emphasisVariant="subtle"
        rounded="full"
        className="text-xs shrink-0"
      >
        {champion.winRate.toFixed(1)}%
      </Badge>
    </Link>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {/* Featured skeleton */}
    <Skeleton className="h-28 rounded-xl" />
    {/* Medium skeletons */}
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
    </div>
    {/* Compact skeletons */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-12 rounded-lg" />
      ))}
    </div>
  </div>
);

export const TopChampionsSection = ({
  topChampions,
  championsLoading,
  totalUniqueMatches,
}: TopChampionsSectionProps) => {
  const { t } = useI18n();

  const featured = topChampions[0];
  const medium = topChampions.slice(1, 3);
  const compact = topChampions.slice(3, 6);

  return (
    <section className="py-14 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
              <SwordsIcon className="size-6 text-muted-foreground" />
              {t("homeStats.topChampions") ?? "Top Champions"}
            </h2>
            {totalUniqueMatches && (
              <p className="text-sm text-muted-foreground mt-1">
                {t("homeStats.basedOnMatches").replace("{count}", formatNumber(totalUniqueMatches))}
              </p>
            )}
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/tier-list/champions" className="flex items-center gap-1">
              {t("common.viewAll") ?? "Voir tout"}
              <ChevronRightIcon className="size-4" />
            </Link>
          </Button>
        </div>

        {championsLoading ? (
          <LoadingSkeleton />
        ) : (
          <div className="space-y-4">
            {/* #1 — Featured */}
            {featured && (
              <div className="animate-fade-up">
                <FeaturedChampion champion={featured} />
              </div>
            )}

            {/* #2-3 — Medium */}
            {medium.length > 0 && (
              <div className="grid grid-cols-2 gap-3 animate-fade-up-delay-1">
                {medium.map((champion, i) => (
                  <MediumChampion
                    key={champion.championId}
                    champion={champion}
                    rank={i + 2}
                  />
                ))}
              </div>
            )}

            {/* #4-6 — Compact */}
            {compact.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 animate-fade-up-delay-2">
                {compact.map((champion, i) => (
                  <CompactChampion
                    key={champion.championId}
                    champion={champion}
                    rank={i + 4}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
