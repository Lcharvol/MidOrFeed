"use client";

import { Loader2Icon, TrophyIcon } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useChampionLeadership } from "@/lib/hooks/use-champion-leadership";
import { useI18n } from "@/lib/i18n-context";
import Link from "next/link";
import { getProfileIconUrl } from "@/constants/ddragon";
import Image from "next/image";

type ChampionLeadershipSectionProps = {
  championId: string;
  championName: string;
};

const formatPercentage = (value: number) =>
  `${(value * 100).toFixed(value >= 0.1 ? 1 : 2)}%`;

const formatKDA = (kills: number, deaths: number, assists: number) => {
  const total = deaths > 0 ? (kills + assists) / deaths : kills + assists;
  return total.toFixed(2);
};

const LoadingState = () => {
  const { t } = useI18n();
  return (
    <Card>
      <CardContent className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2Icon className="size-5 animate-spin" />
        <span>{t("championDetails.leadershipLoading")}</span>
      </CardContent>
    </Card>
  );
};

const ErrorState = ({ message }: { message: string }) => {
  const { t } = useI18n();
  return (
    <Card className="border-red-500/40 bg-red-500/10">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-red-600">
          {t("championDetails.leadershipError")}
        </CardTitle>
        <CardDescription className="text-sm text-red-600/80">
          {message}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

const EmptyState = ({ championName }: { championName: string }) => {
  const { t } = useI18n();
  return (
    <Card className="border-amber-500/40 bg-amber-500/10">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-amber-700">
          {t("championDetails.leadershipInsufficientData")}
        </CardTitle>
        <CardDescription className="text-sm text-amber-700/80">
          {t("championDetails.leadershipInsufficientDataDesc").replace(
            "{championName}",
            championName
          )}
        </CardDescription>
      </CardHeader>
    </Card>
  );
};

export const ChampionLeadershipSection = ({
  championId,
  championName,
}: ChampionLeadershipSectionProps) => {
  const { t } = useI18n();
  const { leadershipData, isLoading, error } =
    useChampionLeadership(championId);

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState message={String(error)} />;
  }

  if (!leadershipData || leadershipData.leaderboard.length === 0) {
    return <EmptyState championName={championName} />;
  }

  const getRankBadgeVariant = (rank: number) => {
    if (rank === 1) return "default";
    if (rank <= 3) return "secondary";
    if (rank <= 10) return "outline";
    return "outline";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return null;
  };

  return (
    <div className="space-y-6">
      <Card className="border border-border/60 bg-background/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <TrophyIcon className="size-5 text-amber-500" />
            {t("championDetails.leadershipTitle").replace(
              "{championName}",
              championName
            )}
          </CardTitle>
          <CardDescription className="text-sm">
            {t("championDetails.leadershipDescription").replace(
              "{totalPlayers}",
              leadershipData.totalPlayers.toString()
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6">
          <div className="overflow-x-auto -mx-3 sm:mx-0 rounded-lg border border-border/60">
            <Table className="text-xs sm:text-sm">
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border/50">
                  <TableHead className="w-10 sm:w-16 text-[10px] sm:text-[11px] uppercase text-muted-foreground">
                    {t("championDetails.rank")}
                  </TableHead>
                  <TableHead className="text-[10px] sm:text-[11px] uppercase text-muted-foreground">
                    {t("championDetails.player")}
                  </TableHead>
                  <TableHead className="text-right text-[10px] sm:text-[11px] uppercase text-muted-foreground hidden sm:table-cell">
                    {t("championDetails.games")}
                  </TableHead>
                  <TableHead className="text-right text-[10px] sm:text-[11px] uppercase text-muted-foreground">
                    <span className="hidden sm:inline">{t("championDetails.winRate")}</span>
                    <span className="sm:hidden">WR</span>
                  </TableHead>
                  <TableHead className="text-right text-[10px] sm:text-[11px] uppercase text-muted-foreground hidden md:table-cell">
                    {t("championDetails.kda")}
                  </TableHead>
                  <TableHead className="text-right text-[10px] sm:text-[11px] uppercase text-muted-foreground">
                    {t("championDetails.score")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leadershipData.leaderboard.map((player, index) => {
                  const rank = index + 1;
                  const rankIcon = getRankIcon(rank);
                  const displayName = player.gameName
                    ? `${player.gameName}${player.tagLine ? `#${player.tagLine}` : ""}`
                    : player.puuid.slice(0, 8);

                  return (
                    <TableRow key={player.puuid} className="border-border/50">
                      <TableCell className="font-medium text-muted-foreground py-2 sm:py-4">
                        <div className="flex items-center gap-1 sm:gap-2">
                          {rankIcon && <span className="text-sm sm:text-base">{rankIcon}</span>}
                          <span className="text-xs sm:text-sm">#{rank}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 sm:py-4">
                        <Link
                          href={`/summoners/${encodeURIComponent(player.puuid)}`}
                          className="flex items-center gap-2 hover:underline"
                        >
                          {player.profileIconId && (
                            <Image
                              src={getProfileIconUrl(player.profileIconId)}
                              alt=""
                              width={24}
                              height={24}
                              className="rounded-full border border-border/60 sm:w-8 sm:h-8"
                              unoptimized
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[100px] sm:max-w-none">
                              {displayName}
                            </p>
                            {player.region && (
                              <p className="text-[10px] sm:text-xs text-muted-foreground">
                                {player.region.toUpperCase()}
                                {/* Mobile: show games inline */}
                                <span className="sm:hidden"> • {player.totalGames}g</span>
                              </p>
                            )}
                          </div>
                        </Link>
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm text-muted-foreground hidden sm:table-cell py-2 sm:py-4">
                        {player.totalGames}
                      </TableCell>
                      <TableCell className="text-right py-2 sm:py-4">
                        <Badge
                          variant={
                            player.winRate >= 0.5
                              ? "success"
                              : "destructive"
                          }
                          className="text-[10px] sm:text-xs px-1.5 sm:px-2"
                        >
                          {formatPercentage(player.winRate)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs sm:text-sm text-muted-foreground hidden md:table-cell py-2 sm:py-4">
                        {formatKDA(
                          player.totalKills,
                          player.totalDeaths,
                          player.totalAssists
                        )}
                      </TableCell>
                      <TableCell className="text-right py-2 sm:py-4">
                        <Badge
                          variant={getRankBadgeVariant(rank)}
                          className="font-semibold text-[10px] sm:text-xs px-1.5 sm:px-2"
                        >
                          {player.score.toFixed(1)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

