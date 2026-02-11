"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
import {
  TrophyIcon,
  CrownIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { LeaderboardEntry, TIER_EMPHASIS } from "./types";

type LeaderboardSectionProps = {
  leaderboard: LeaderboardEntry[];
  leaderboardLoading: boolean;
};

export const LeaderboardSection = ({
  leaderboard,
  leaderboardLoading,
}: LeaderboardSectionProps) => {
  const { t } = useI18n();

  return (
    <section className="py-12 md:py-16 bg-gradient-to-b from-muted/30 to-background border-y">
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

        <Card>
          <CardContent className="p-0">
            {leaderboardLoading ? (
              <div className="divide-y">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4">
                    <Skeleton className="size-8 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <Empty className="py-12">
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <CrownIcon />
                  </EmptyMedia>
                  <EmptyTitle>{t("common.noData") ?? "Aucune donnee"}</EmptyTitle>
                  <EmptyDescription>Le classement sera disponible prochainement</EmptyDescription>
                </EmptyHeader>
              </Empty>
            ) : (
              <div className="divide-y">
                {leaderboard.map((player, index) => {
                  const winRate =
                    player.wins + player.losses > 0
                      ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(1)
                      : "0.0";
                  const tierEmphasis = TIER_EMPHASIS[player.tier] ?? "neutral";
                  return (
                    <Tooltip key={player.id}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors cursor-default">
                          <div className="flex items-center justify-center size-8">
                            {index === 0 ? (
                              <TrophyIcon className="size-5 text-yellow-500" />
                            ) : (
                              <span className="text-sm font-semibold text-muted-foreground">
                                #{index + 1}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{player.summonerName}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-2">
                              <Badge emphasis={tierEmphasis} emphasisVariant="subtle" rounded="full" className="text-[10px]">
                                {player.leaguePoints} LP
                              </Badge>
                              <span>
                                {player.wins}W / {player.losses}L
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              emphasis={
                                parseFloat(winRate) >= 55
                                  ? "positive"
                                  : parseFloat(winRate) >= 50
                                    ? "neutral"
                                    : "danger"
                              }
                              emphasisVariant="subtle"
                              rounded="full"
                            >
                              {winRate}% WR
                            </Badge>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent sideOffset={4}>
                        <div className="text-xs space-y-0.5">
                          <div className="font-medium">{player.summonerName}</div>
                          <div>{player.tier} {player.rank} — {player.leaguePoints} LP</div>
                          <div>{player.wins}V / {player.losses}D ({winRate}% WR)</div>
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
