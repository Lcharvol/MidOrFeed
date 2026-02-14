"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import { CrownIcon, ChevronRightIcon } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { LeaderboardEntry, TIER_EMPHASIS } from "./types";
import { getTierIconUrl } from "@/constants/ddragon";
import { cn } from "@/lib/utils";

type LeaderboardSectionProps = {
  leaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;
};

const TIER_LABEL: Record<string, string> = {
  CHALLENGER: "Challenger",
  GRANDMASTER: "Grandmaster",
  MASTER: "Master",
};

const TIER_TEXT: Record<string, string> = {
  CHALLENGER: "text-tier-challenger",
  GRANDMASTER: "text-tier-grandmaster",
  MASTER: "text-tier-master",
};

const TIER_BORDER: Record<string, string> = {
  CHALLENGER: "border-tier-challenger/30",
  GRANDMASTER: "border-tier-grandmaster/30",
  MASTER: "border-tier-master/30",
};

const TIER_GRADIENT: Record<string, string> = {
  CHALLENGER: "from-tier-challenger/10",
  GRANDMASTER: "from-tier-grandmaster/10",
  MASTER: "from-tier-master/10",
};

function computeWinRate(wins: number, losses: number): string {
  const total = wins + losses;
  return total > 0 ? ((wins / total) * 100).toFixed(1) : "0.0";
}

function getWinRateColor(wr: number): "positive" | "neutral" | "danger" {
  if (wr >= 55) return "positive";
  if (wr >= 50) return "neutral";
  return "danger";
}

export const LeaderboardSection = ({
  leaderboard,
  leaderboardLoading,
}: LeaderboardSectionProps) => {
  const { t } = useI18n();

  const top1 = leaderboard[0] ?? null;
  const top2to5 = leaderboard.slice(1, 5);

  return (
    <section className="py-14 md:py-20 bg-gradient-to-b from-muted/30 to-background border-y">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
              <CrownIcon className="size-6 text-yellow-500" />
              {t("homeStats.challengerLeaderboard") ?? "Classement Challenger"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("homeStats.topPlayersEUW") ?? "Top joueurs EUW"}
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/leaderboard" className="flex items-center gap-1">
              {t("common.viewAll") ?? "Voir tout"}
              <ChevronRightIcon className="size-4" />
            </Link>
          </Button>
        </div>

        {leaderboardLoading ? (
          <LoadingSkeleton />
        ) : leaderboard.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CrownIcon />
                  </EmptyMedia>
                  <EmptyTitle>{t("common.noData") ?? "Aucune donnee"}</EmptyTitle>
                  <EmptyDescription>Le classement sera disponible prochainement</EmptyDescription>
                </EmptyHeader>
              </Empty>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* #1 Mini Featured Card */}
            {top1 && <MiniFeaturedCard player={top1} />}

            {/* #2-5 Grid */}
            {top2to5.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {top2to5.map((player, idx) => (
                  <CompactCard key={player.id} player={player} rank={idx + 2} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

/* ─── #1 Mini Featured Card ─── */
function MiniFeaturedCard({ player }: { player: LeaderboardEntry }) {
  const wr = computeWinRate(player.wins, player.losses);
  const wrNum = parseFloat(wr);
  const tierEmphasis = TIER_EMPHASIS[player.tier] ?? "neutral";

  return (
    <Card className={cn(
      "relative overflow-hidden border",
      TIER_BORDER[player.tier],
      "bg-gradient-to-br",
      TIER_GRADIENT[player.tier],
      "to-transparent"
    )}>
      <CardContent className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6">
        {/* Rank watermark */}
        <span className={cn(
          "text-4xl sm:text-5xl font-black tabular-nums opacity-15 select-none shrink-0",
          TIER_TEXT[player.tier]
        )}>
          1
        </span>

        {/* Tier icon */}
        <Image
          src={getTierIconUrl(player.tier)}
          alt={TIER_LABEL[player.tier] ?? player.tier}
          width={56}
          height={56}
          className="shrink-0 drop-shadow-md"
        />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-base sm:text-lg font-bold truncate">{player.summonerName}</p>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <Badge emphasis={tierEmphasis} emphasisVariant="subtle" rounded="full" className="text-[10px]">
              {TIER_LABEL[player.tier] ?? player.tier} &middot; {player.leaguePoints.toLocaleString()} LP
            </Badge>
            <span className="text-[10px] sm:text-xs text-muted-foreground tabular-nums">
              <span className="text-win">{player.wins}W</span>{" / "}
              <span className="text-loss">{player.losses}L</span>
            </span>
          </div>
        </div>

        {/* WR */}
        <Badge
          emphasis={getWinRateColor(wrNum)}
          emphasisVariant="subtle"
          rounded="full"
        >
          {wr}% WR
        </Badge>
      </CardContent>
    </Card>
  );
}

/* ─── #2-5 Compact Card ─── */
function CompactCard({
  player,
  rank,
}: {
  player: LeaderboardEntry;
  rank: number;
}) {
  const wr = computeWinRate(player.wins, player.losses);
  const wrNum = parseFloat(wr);
  const tierEmphasis = TIER_EMPHASIS[player.tier] ?? "neutral";

  return (
    <Card className="hover:bg-muted/30 transition-colors">
      <CardContent className="p-3 sm:p-4 space-y-2">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl font-black tabular-nums text-muted-foreground/40 select-none">
            {rank}
          </span>
          <Image
            src={getTierIconUrl(player.tier)}
            alt={TIER_LABEL[player.tier] ?? player.tier}
            width={40}
            height={40}
            className="shrink-0"
          />
          <div className="min-w-0 flex-1">
            <p className="font-semibold truncate text-xs sm:text-sm">{player.summonerName}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground tabular-nums">
              {player.leaguePoints.toLocaleString()} LP
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between text-[10px] sm:text-xs">
          <span className="tabular-nums text-muted-foreground">
            <span className="text-win">{player.wins}W</span>{" "}
            <span className="text-loss">{player.losses}L</span>
          </span>
          <Badge
            emphasis={getWinRateColor(wrNum)}
            emphasisVariant="subtle"
            rounded="full"
            className="text-[10px]"
          >
            {wr}%
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Loading Skeleton ─── */
function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* #1 skeleton */}
      <Card>
        <CardContent className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6">
          <Skeleton className="h-12 w-8 rounded" />
          <Skeleton className="size-14 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-5 w-14 rounded-full" />
        </CardContent>
      </Card>

      {/* #2-5 skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-4 space-y-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <Skeleton className="h-6 w-5 rounded" />
                <Skeleton className="size-10 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-2.5 w-14" />
                </div>
              </div>
              <div className="flex justify-between">
                <Skeleton className="h-2.5 w-14" />
                <Skeleton className="h-3.5 w-9 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
