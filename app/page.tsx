"use client";

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  BrainIcon,
  TrophyIcon,
  UsersIcon,
  SwordsIcon,
  ArrowRightIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MinusIcon,
  CrownIcon,
  ChevronRightIcon,
} from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { useChampionStats } from "@/lib/hooks/use-champion-stats";
import { useApiSWR, STATIC_DATA_CONFIG } from "@/lib/hooks/swr";
import { SummonerSearchBar } from "@/components/SummonerSearchBar";

type PublicStats = {
  totalMatches: number;
  totalPlayers: number;
  totalChampions: number;
};

type LeaderboardEntry = {
  id: string;
  summonerName: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  rank: string;
  tier: string;
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
};

const TrendIcon = ({ trend }: { trend?: "up" | "down" | "stable" | null }) => {
  if (!trend || trend === "stable") {
    return <MinusIcon className="size-3 text-muted-foreground" />;
  }
  if (trend === "up") {
    return <TrendingUpIcon className="size-3 text-win" />;
  }
  return <TrendingDownIcon className="size-3 text-loss" />;
};

export default function Home() {
  const { t } = useI18n();

  // Fetch public stats
  const { data: statsData, isLoading: statsLoading } = useApiSWR<{
    success: boolean;
    data: PublicStats;
  }>("/api/stats", STATIC_DATA_CONFIG);

  // Fetch champion stats (top 6)
  const { championStats, isLoading: championsLoading, totalUniqueMatches } = useChampionStats();
  const topChampions = championStats.slice(0, 6);

  // Fetch leaderboard (Challenger EUW)
  const { data: leaderboardData, isLoading: leaderboardLoading } = useApiSWR<{
    success: boolean;
    data: LeaderboardEntry[];
  }>("/api/leaderboard/list?region=euw1&tier=CHALLENGER&take=5", STATIC_DATA_CONFIG);

  const stats = statsData?.data;
  const leaderboard = leaderboardData?.data ?? [];

  return (
    <div className="flex flex-col">
      {/* Hero Section - Simplified */}
      <section className="relative -mx-4 sm:-mx-6 px-4 sm:px-6 overflow-hidden border-b py-16 md:py-24">
        {/* Background Image */}
        <div className="absolute inset-0 -z-10">
          <Image
            src="/home_background.png"
            alt="League of Legends Background"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black/90" />
        </div>

        <div className="relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4" variant="secondary">
              <BrainIcon className="mr-2 size-3" />
              {t("home.poweredByAI")}
            </Badge>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-6xl">
              {t("home.aiCoach")}{" "}
              <span className="bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent">
                {t("home.dominateRift")}
              </span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
              {t("home.subtitle")}
            </p>

            {/* Search Bar - OP.GG style */}
            <div className="w-full max-w-xl mx-auto mb-10">
              <SummonerSearchBar />
              <p className="text-xs text-muted-foreground/60 mt-2 text-center">
                {t("homeSearch.hint") || "Search for a summoner to view their stats, matches and more"}
              </p>
            </div>

            {/* Live Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="mb-1 text-2xl md:text-3xl font-bold text-primary">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mx-auto" />
                  ) : (
                    formatNumber(stats?.totalMatches ?? 0)
                  )}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {t("home.matchesAnalyzed")}
                </div>
              </div>
              <div className="text-center">
                <div className="mb-1 text-2xl md:text-3xl font-bold text-primary">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mx-auto" />
                  ) : (
                    formatNumber(stats?.totalPlayers ?? 0)
                  )}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {t("home.playersCoached")}
                </div>
              </div>
              <div className="text-center">
                <div className="mb-1 text-2xl md:text-3xl font-bold text-primary">
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16 mx-auto" />
                  ) : (
                    stats?.totalChampions ?? 0
                  )}
                </div>
                <div className="text-xs md:text-sm text-muted-foreground">
                  {t("homeStats.champions") ?? "Champions"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Champions Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold md:text-3xl flex items-center gap-2">
                <SwordsIcon className="size-6 text-primary" />
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

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {championsLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex flex-col items-center gap-3">
                        <Skeleton className="size-16 rounded-xl" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </CardContent>
                  </Card>
                ))
              : topChampions.map((champion, index) => (
                  <Link
                    key={champion.championId}
                    href={`/champions/${champion.championId}`}
                    className="block"
                  >
                    <Card className="overflow-hidden hover:border-primary/50 transition-colors group">
                      <CardContent className="p-4">
                        <div className="flex flex-col items-center gap-3">
                          <div className="relative">
                            {index < 3 && (
                              <div className="absolute -top-1 -right-1 z-10 size-5 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                                {index + 1}
                              </div>
                            )}
                            <ChampionIcon
                              championId={champion.championId}
                              size={64}
                              className="group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="text-center">
                            <div className="font-medium text-sm truncate max-w-full">
                              {champion.championId}
                            </div>
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <span
                                className={`text-sm font-semibold ${
                                  champion.winRate >= 52
                                    ? "text-win"
                                    : champion.winRate >= 48
                                      ? "text-foreground"
                                      : "text-loss"
                                }`}
                              >
                                {champion.winRate.toFixed(1)}%
                              </span>
                              <TrendIcon trend={champion.winRateTrend?.trend} />
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatNumber(champion.totalGames)} {t("common.games") ?? "parties"}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
          </div>
        </div>
      </section>

      {/* Leaderboard Preview Section */}
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
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  {t("common.noData") ?? "No data available"}
                </div>
              ) : (
                <div className="divide-y">
                  {leaderboard.map((player, index) => {
                    const winRate =
                      player.wins + player.losses > 0
                        ? ((player.wins / (player.wins + player.losses)) * 100).toFixed(1)
                        : "0.0";
                    return (
                      <div
                        key={player.id}
                        className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
                      >
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
                            <span className="text-primary font-medium">{player.leaguePoints} LP</span>
                            <span>
                              {player.wins}W / {player.losses}L
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            variant={
                              parseFloat(winRate) >= 55
                                ? "default"
                                : parseFloat(winRate) >= 50
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {winRate}% WR
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Features Overview */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="group border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <BrainIcon className="size-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{t("home.matchAnalysis")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("home.matchAnalysisDescription")}
                </p>
              </CardContent>
            </Card>

            <Card className="group border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <UsersIcon className="size-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{t("home.teamCoaching")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("home.teamCoachingDescription")}
                </p>
              </CardContent>
            </Card>

            <Card className="group border-2 hover:border-primary/50 transition-all">
              <CardHeader>
                <div className="mb-2 flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <TrophyIcon className="size-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{t("home.soloQueueCoaching")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t("home.soloCoachingDescription")}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section - Simplified */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl">
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-purple-500/5 to-primary/5">
              <CardContent className="p-8 text-center">
                <h2 className="mb-3 text-2xl font-bold md:text-3xl">
                  {t("home.readyToImprove")}
                </h2>
                <p className="mb-6 text-muted-foreground">
                  {t("home.joinAIRevolution")}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button size="lg" asChild>
                    <Link href="/signup">
                      {t("home.startFree")}
                      <ArrowRightIcon className="ml-2 size-4" />
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/login">{t("home.signIn")}</Link>
                  </Button>
                </div>
                <p className="mt-4 text-xs text-muted-foreground">{t("home.noCreditCard")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
