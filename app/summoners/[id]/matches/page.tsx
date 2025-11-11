"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ColorBadge } from "@/components/ui/color-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  TrophyIcon,
  TargetIcon,
  UsersIcon,
  Gamepad2Icon,
  Loader2Icon,
  RefreshCwIcon,
  BrainIcon,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { AIInsightCard, AIInsight } from "@/components/AIInsightCard";
import { QUEUE_NAMES } from "@/constants/queues";
import { useParams, useSearchParams } from "next/navigation";
import { ChampionIcon } from "@/components/ChampionIcon";
import { MATCHES_PAGE_LIMIT, MATCHES_REFRESH_LIMIT } from "@/constants/matches";
import { useChampions } from "@/lib/hooks/use-champions";
import { useMatches } from "@/lib/hooks/use-matches";
import type {
  MatchParticipantSummary,
  MatchSummary,
  MatchesPayload,
} from "@/types";

// QUEUE_NAMES centralized in @/types

function MatchDetailsDialog({
  match,
  championMap,
}: {
  match: MatchSummary;
  championMap: Map<string, string>;
}) {
  const fullMatch = match;

  const blueTeam =
    fullMatch.participants?.filter(
      (p: MatchParticipantSummary) => p.teamId === 100
    ) || [];
  const redTeam =
    fullMatch.participants?.filter(
      (p: MatchParticipantSummary) => p.teamId === 200
    ) || [];

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (timestamp: string | bigint) => {
    const date = new Date(Number(timestamp));
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(date);
  };

  if (!fullMatch.participants || fullMatch.participants.length === 0) {
    return (
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-center py-10">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </div>
      </DialogContent>
    );
  }

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <div className="flex items-start justify-between">
          <DialogTitle className="flex items-center gap-3 flex-1">
            <div
              className={`p-2 rounded-full ${
                fullMatch.blueTeamWon || fullMatch.redTeamWon
                  ? "bg-green-500/20"
                  : "bg-red-500/20"
              }`}
            >
              <TrophyIcon
                className={`size-6 ${
                  fullMatch.blueTeamWon || fullMatch.redTeamWon
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              />
            </div>
            <div>
              <div className="text-2xl font-bold">
                {fullMatch.blueTeamWon || fullMatch.redTeamWon
                  ? "Victoire"
                  : "Défaite"}{" "}
                •{" "}
                {fullMatch.queueId !== null && fullMatch.queueId !== undefined
                  ? QUEUE_NAMES[fullMatch.queueId] ??
                    `Queue ${fullMatch.queueId}`
                  : "File inconnue"}
              </div>
              <DialogDescription>
                {formatDate(fullMatch.gameCreation)} •{" "}
                {formatDuration(fullMatch.gameDuration)}
              </DialogDescription>
            </div>
          </DialogTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/ai-analysis/${fullMatch.id}`}>
              <BrainIcon className="mr-2 size-4" />
              Analyse IA
            </Link>
          </Button>
        </div>
      </DialogHeader>

      <div className="space-y-6">
        <div className="border-2 border-blue-500/30 rounded-lg p-4 bg-blue-500/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-blue-500 rounded-full" />
            <h3 className="font-bold text-lg">Équipe Bleue</h3>
            {fullMatch.blueTeamWon && (
              <ColorBadge emphasis="positive" variant="solid">
                Victoire
              </ColorBadge>
            )}
          </div>
          <div className="grid gap-2">
            {blueTeam.map((participant: MatchParticipantSummary) => {
              const kda = `${participant.kills}/${participant.deaths}/${participant.assists}`;
              const kdaRatio =
                (participant.kills + participant.assists) /
                (participant.deaths || 1);
              return (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
                >
                  <ChampionIcon
                    championId={participant.championId}
                    alt={
                      championMap.get(participant.championId) ||
                      participant.championId
                    }
                    size={48}
                    shape="rounded"
                    className="border-2 border-blue-500/30"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">
                      {championMap.get(participant.championId) ||
                        participant.championId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {participant.role} • {participant.lane}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      {kda} ({kdaRatio.toFixed(1)} KDA)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {participant.goldEarned.toLocaleString()}g
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-2 border-red-500/30 rounded-lg p-4 bg-red-500/5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 bg-red-500 rounded-full" />
            <h3 className="font-bold text-lg">Équipe Rouge</h3>
            {fullMatch.redTeamWon && (
              <ColorBadge emphasis="positive" variant="solid">
                Victoire
              </ColorBadge>
            )}
          </div>
          <div className="grid gap-2">
            {redTeam.map((participant: MatchParticipantSummary) => {
              const kda = `${participant.kills}/${participant.deaths}/${participant.assists}`;
              const kdaRatio =
                (participant.kills + participant.assists) /
                (participant.deaths || 1);
              return (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background/50 hover:bg-background transition-colors"
                >
                  <ChampionIcon
                    championId={participant.championId}
                    alt={
                      championMap.get(participant.championId) ||
                      participant.championId
                    }
                    size={48}
                    shape="rounded"
                    className="border-2 border-red-500/30"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">
                      {championMap.get(participant.championId) ||
                        participant.championId}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {participant.role} • {participant.lane}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">
                      {kda} ({kdaRatio.toFixed(1)} KDA)
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {participant.goldEarned.toLocaleString()}g
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

const MatchesByIdPageInner = () => {
  const params = useParams();
  const puuid = typeof params?.id === "string" ? params.id : undefined;
  const searchParams = useSearchParams();
  const region = searchParams.get("region") || undefined;

  const {
    data: matchPayload,
    matches,
    stats,
    championStats,
    error,
    isLoading,
    refresh,
  } = useMatches({ puuid });
  const { championNameMap } = useChampions();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const matchData: MatchesPayload | null = matchPayload;
  const aggregateStats = stats ?? matchData?.stats ?? null;
  const championMap = championNameMap;

  const handleRefresh = async () => {
    if (!puuid || !region) {
      toast.error("Paramètres manquants");
      return;
    }
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/matches/collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          puuid,
          region,
          count: MATCHES_REFRESH_LIMIT,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error || "Erreur lors de la collecte");
        return;
      }
      toast.success(
        `Collecte terminée: ${result.matchesCollected} matchs collectés`
      );
      await refresh();
    } catch (e) {
      console.error(e);
      toast.error("Une erreur est survenue");
    } finally {
      setIsRefreshing(false);
    }
  };

  const aiInsights = useMemo<AIInsight[]>(() => {
    if (!matchData || matches.length === 0) return [];
    const insights: AIInsight[] = [];
    const recentMatches = matches.slice(0, 10);
    const recentWins = recentMatches.filter(
      (m) => m.participants?.[0]?.win
    ).length;
    const recentWinRate = (recentWins / recentMatches.length) * 100;
    if (recentMatches.length >= 5) {
      if (recentWinRate >= 70) {
        insights.push({
          type: "positive",
          title: "Forme excellente",
          description: `Sur vos 10 derniers matchs, vous avez remporté ${recentWins} victoires (${recentWinRate.toFixed(
            0
          )}%). Vous êtes en pleine forme !`,
          confidence: 88,
          recommendation:
            "Profitez de cette dynamique positive pour grimper les rangs !",
          data: {
            "Derniers 10 matchs": `${recentWins}W / ${
              recentMatches.length - recentWins
            }L`,
          },
        });
      } else if (recentWinRate <= 30) {
        insights.push({
          type: "negative",
          title: "Période difficile",
          description: `Vos 10 derniers matchs montrent seulement ${recentWins} victoires (${recentWinRate.toFixed(
            0
          )}%). Prenez une petite pause peut aider !`,
          confidence: 85,
          recommendation:
            "Reposez-vous 15-30 minutes avant le prochain match pour retrouver votre focus.",
          data: {
            "Derniers 10 matchs": `${recentWins}W / ${
              recentMatches.length - recentWins
            }L`,
          },
        });
      }
    }
    if ((aggregateStats?.totalGames ?? 0) >= 50) {
      insights.push({
        type: "positive",
        title: "Volume de jeu important",
        description: `Avec ${
          aggregateStats?.totalGames ?? 0
        } matchs analysés, nos insights IA sont très précis pour votre profil.`,
        confidence: 95,
        data: { "Matchs analysés": aggregateStats?.totalGames ?? 0 },
      });
    }
    return insights;
  }, [matchData, aggregateStats, matches]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center py-20">
          <Loader2Icon className="size-12 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            Erreur lors du chargement des matchs
          </p>
        </div>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center py-20">
          <p className="text-muted-foreground">Aucune donnée disponible</p>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };
  const formatDate = (timestamp: string | bigint) => {
    const date = new Date(Number(timestamp));
    return new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(date);
  };

  const content = (
    <div className="container mx-auto py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-linear-to-br from-primary to-primary/60">
              <TrophyIcon className="size-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Matchs
              </h1>
              <p className="text-muted-foreground">Analyse des performances</p>
            </div>
          </div>
        </div>
        <Button
          onClick={handleRefresh}
          disabled={isRefreshing || !puuid || !region}
          className="bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          {isRefreshing ? (
            <>
              <Loader2Icon className="mr-2 size-4 animate-spin" />
              Mise à jour...
            </>
          ) : (
            <>
              <RefreshCwIcon className="mr-2 size-4" />
              Mettre à jour les matchs
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="relative overflow-hidden border-2 border-primary/20 bg-linear-to-br from-background to-primary/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-3xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Win Rate</CardTitle>
            <div className="p-2 rounded-full bg-primary/20">
              <TrophyIcon className="size-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-linear-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {aggregateStats?.winRate}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {aggregateStats?.totalWins} wins sur {aggregateStats?.totalGames}{" "}
              matchs
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-2 border-red-500/20 bg-linear-to-br from-background to-red-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/10 rounded-full blur-3xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">KDA Moyen</CardTitle>
            <div className="p-2 rounded-full bg-red-500/20">
              <TargetIcon className="size-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-linear-to-r from-red-500 to-red-500/60 bg-clip-text text-transparent">
              {aggregateStats?.avgKDA}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Par match</p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-2 border-blue-500/20 bg-linear-to-br from-background to-blue-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-full blur-3xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Total Matchs</CardTitle>
            <div className="p-2 rounded-full bg-blue-500/20">
              <Gamepad2Icon className="size-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-linear-to-r from-blue-500 to-blue-500/60 bg-clip-text text-transparent">
              {aggregateStats?.totalGames}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Matchs collectés
            </p>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-2 border-green-500/20 bg-linear-to-br from-background to-green-500/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 rounded-full blur-3xl" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
            <CardTitle className="text-sm font-medium">Champions</CardTitle>
            <div className="p-2 rounded-full bg-green-500/20">
              <UsersIcon className="size-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold bg-linear-to-r from-green-500 to-green-500/60 bg-clip-text text-transparent">
              {Object.keys(championStats).length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Champions différents
            </p>
          </CardContent>
        </Card>
      </div>

      {aiInsights.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {aiInsights.map((insight, index) => (
            <AIInsightCard key={index} insight={insight} size="compact" />
          ))}
        </div>
      )}

      <Card className="mt-8 border-2 border-purple-500/10">
        <CardHeader className="bg-linear-to-r from-purple-500/5 to-transparent">
          <CardTitle className="flex items-center gap-2">
            <Gamepad2Icon className="size-5 text-purple-500" />
            Historique récent
          </CardTitle>
          <CardDescription>
            Vos {Math.min(MATCHES_PAGE_LIMIT, matches.length)} derniers matchs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {matches.slice(0, MATCHES_PAGE_LIMIT).map((match) => {
              const userParticipant =
                (puuid
                  ? match.participants.find(
                      (p) =>
                        (p as MatchParticipantSummary).participantPUuid ===
                        puuid
                    )
                  : match.participants[0]) || match.participants[0];
              const isWin = userParticipant?.win;
              const kda = userParticipant
                ? `${userParticipant.kills}/${userParticipant.deaths}/${userParticipant.assists}`
                : "0/0/0";
              return (
                <Dialog key={match.id}>
                  <DialogTrigger asChild>
                    <div
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 transition-all hover:scale-[1.02] hover:shadow-lg cursor-pointer ${
                        isWin
                          ? "border-green-500/30 bg-linear-to-r from-green-500/5 to-background"
                          : "border-red-500/30 bg-linear-to-r from-red-500/5 to-background"
                      }`}
                    >
                      <div className="flex flex-col items-center min-w-[100px]">
                        <Badge
                          className={
                            isWin
                              ? "bg-green-500 hover:bg-green-500 text-white text-xs font-bold"
                              : "bg-red-500 hover:bg-red-500 text-white text-xs font-bold"
                          }
                        >
                          {isWin ? "Victoire" : "Défaite"}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                          {formatDuration(match.gameDuration)}
                        </p>
                      </div>
                      {userParticipant && (
                        <div className="flex items-center gap-3 flex-1">
                          <div className="relative">
                            <ChampionIcon
                              championId={userParticipant.championId}
                              alt={
                                championMap.get(userParticipant.championId) ||
                                userParticipant.championId
                              }
                              size={56}
                              shape="rounded"
                              className="border-2 border-primary/20"
                            />
                          </div>
                          <div>
                            <p className="font-bold">
                              {championMap.get(userParticipant.championId) ||
                                userParticipant.championId}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              KDA: <span className="font-semibold">{kda}</span>
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant="outline">
                          {match.queueId !== null && match.queueId !== undefined
                            ? QUEUE_NAMES[match.queueId] ??
                              `Queue ${match.queueId}`
                            : "File inconnue"}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(match.gameCreation)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/ai-analysis/${match.id}`}>
                            <BrainIcon className="mr-2 size-4" />
                            Analyse IA
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </DialogTrigger>
                  <MatchDetailsDialog match={match} championMap={championMap} />
                </Dialog>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return content;
};

export default MatchesByIdPageInner;
