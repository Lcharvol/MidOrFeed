"use client";

import { useMemo } from "react";
import useSWR from "swr";
import { useParams, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrophyIcon, TargetIcon, AwardIcon, FlameIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const LEVEL_ORDER = [
  "CHALLENGER",
  "GRANDMASTER",
  "MASTER",
  "DIAMOND",
  "PLATINUM",
  "GOLD",
  "SILVER",
  "BRONZE",
  "IRON",
  "NONE",
];

const nextLevel = (current: string | null | undefined) => {
  const index = LEVEL_ORDER.indexOf((current ?? "NONE").toUpperCase());
  if (index <= 0) return null;
  return LEVEL_ORDER[index - 1];
};

const formatValue = (value?: number | null) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k`;
  return value.toFixed(0);
};

const difficultyBadge = (level: string) => {
  switch (level) {
    case "CHALLENGER":
    case "GRANDMASTER":
      return "bg-purple-500/15 text-purple-100";
    case "MASTER":
    case "DIAMOND":
      return "bg-indigo-500/15 text-indigo-100";
    case "PLATINUM":
    case "GOLD":
      return "bg-emerald-500/15 text-emerald-100";
    case "SILVER":
    case "BRONZE":
      return "bg-amber-500/15 text-amber-100";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const computeChallengeProgress = (
  thresholds: Record<string, number> | undefined,
  currentLevel: string,
  currentValue: number,
  nextLevelValue?: number | null
) => {
  const currentThreshold = thresholds?.[currentLevel];
  const targetLevel = nextLevel(currentLevel);
  const targetThreshold = targetLevel ? thresholds?.[targetLevel] : undefined;
  const base = typeof currentThreshold === "number" ? currentThreshold : 0;
  const target =
    typeof nextLevelValue === "number"
      ? nextLevelValue
      : typeof targetThreshold === "number"
      ? targetThreshold
      : null;

  if (!target || target <= base) {
    return { base, target: target ?? null, progress: 1 };
  }
  const progress = Math.max(
    0,
    Math.min(1, (currentValue - base) / (target - base))
  );
  return { base, target, progress };
};

const sortByImportance = (challenges: SummonerChallenge[]) => {
  return [...challenges].sort((a, b) => {
    const levelIndex = LEVEL_ORDER.indexOf((a.level ?? "NONE").toUpperCase());
    const levelIndexB = LEVEL_ORDER.indexOf((b.level ?? "NONE").toUpperCase());
    if (levelIndex !== levelIndexB) return levelIndex - levelIndexB;
    const progress = b.progressRatio - a.progressRatio;
    if (progress !== 0) return progress;
    return (b.pointsEarned ?? 0) - (a.pointsEarned ?? 0);
  });
};

type SummonerChallenge = {
  id: string;
  challengeId: number;
  name: string;
  description?: string | null;
  category?: string | null;
  level?: string;
  highestLevel?: string | null;
  percentile?: number | null;
  currentValue: number;
  nextLevelValue?: number | null;
  progressRatio: number;
  baseThreshold: number;
  targetThreshold: number | null;
  pointsEarned?: number | null;
  thresholds?: Record<string, number>;
  tags?: string[];
  updatedAt: string;
};

const mapApiChallenge = (entry: any): SummonerChallenge => {
  const thresholds = entry.thresholds as Record<string, number> | undefined;
  const level = (entry.level as string | undefined) ?? "NONE";
  const progress = computeChallengeProgress(
    thresholds,
    level,
    entry.currentValue ?? 0,
    entry.nextLevelValue
  );

  return {
    id: entry.id,
    challengeId: entry.challengeId,
    name: entry.name,
    description: entry.description,
    category: entry.category,
    level,
    highestLevel: entry.highestLevel,
    percentile: entry.percentile,
    currentValue: entry.currentValue ?? 0,
    nextLevelValue: entry.nextLevelValue ?? null,
    progressRatio: progress.progress,
    baseThreshold: progress.base,
    targetThreshold: progress.target,
    pointsEarned: entry.pointsEarned ?? null,
    thresholds,
    tags: typeof entry.tags === "string" ? entry.tags.split(",") : undefined,
    updatedAt: entry.updatedAt,
  } satisfies SummonerChallenge;
};

export default function SummonerChallengesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const puuid = typeof params?.id === "string" ? params.id : undefined;
  const region = searchParams.get("region") || undefined;

  const { data, error, isLoading } = useSWR(
    puuid ? `/api/challenges/player?puuid=${puuid}` : null,
    fetcher
  );

  const challenges: SummonerChallenge[] = useMemo(() => {
    if (!data?.data?.challenges) return [];
    return data.data.challenges.map(mapApiChallenge);
  }, [data]);

  const totals = useMemo(() => {
    const total = challenges.length;
    const topFive = challenges.slice(0, 5);
    const highest = challenges[0];
    const nearUpgrade = challenges.filter(
      (challenge) => challenge.progressRatio >= 0.7
    );
    const elite = challenges.filter((challenge) => {
      const level = (challenge.level ?? "NONE").toUpperCase();
      return ["MASTER", "GRANDMASTER", "CHALLENGER"].includes(level);
    });
    return { total, topFive, highest, nearUpgrade, elite };
  }, [challenges]);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Défis Riot</CardTitle>
          <CardDescription>
            Erreur lors du chargement des données challenges.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} className="p-4">
            <Skeleton className="h-6 w-40 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </Card>
        ))}
      </div>
    );
  }

  if (!challenges.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Défis Riot</CardTitle>
          <CardDescription>
            Aucun challenge n'a encore été collecté pour ce compte.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Lance une synchronisation depuis l'admin ou joue quelques parties
            pour débloquer les premiers objectifs.
          </p>
        </CardContent>
      </Card>
    );
  }

  const sortedChallenges = sortByImportance(challenges);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Challenges suivis
            </CardTitle>
            <TrophyIcon className="size-5 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totals.total}</div>
            <p className="text-xs text-muted-foreground">
              Nombre total de défis avec progression enregistrée
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Proches du palier supérieur
            </CardTitle>
            <TargetIcon className="size-5 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.nearUpgrade.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Défis avec une progression &gt;= 70% vers le prochain palier
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-indigo-500/20 bg-indigo-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meilleur défi</CardTitle>
            <AwardIcon className="size-5 text-indigo-300" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totals.highest?.level ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {totals.highest?.name ?? "Aucun challenge"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-amber-500/20 bg-amber-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Points Challenge
            </CardTitle>
            <FlameIcon className="size-5 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatValue(data?.data?.totalPoints?.challengePoints as number)}
            </div>
            <p className="text-xs text-muted-foreground">
              Points Riot cumulés (source Riot API)
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Défis prioritaires</CardTitle>
          <CardDescription>
            Sélection des objectifs les plus proches d'un nouveau palier
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {totals.nearUpgrade.slice(0, 4).map((challenge) => (
              <div
                key={challenge.id}
                className="rounded-lg border border-primary/20 bg-primary/5 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{challenge.name}</p>
                  <Badge className={difficultyBadge(challenge.level ?? "NONE")}>
                    {challenge.level ?? "NONE"}
                  </Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {challenge.description ||
                    "Progresse pour débloquer le palier suivant"}
                </p>
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatValue(challenge.currentValue)}</span>
                    <span>
                      {challenge.targetThreshold
                        ? formatValue(challenge.targetThreshold)
                        : "Max"}
                    </span>
                  </div>
                  <Progress value={challenge.progressRatio * 100} />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tous les défis</CardTitle>
          <CardDescription>
            Utilise les tags et catégories Riot pour suivre ta progression
            globale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[560px]">
            <div className="space-y-4">
              {sortedChallenges.map((challenge) => (
                <div
                  key={challenge.id}
                  className="rounded-lg border border-border/40 bg-background/70 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold leading-tight">
                        {challenge.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {challenge.category ?? "Autre"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        className={difficultyBadge(challenge.level ?? "NONE")}
                      >
                        {challenge.level ?? "NONE"}
                      </Badge>
                      {typeof challenge.percentile === "number" && (
                        <Badge variant="outline" className="text-xs">
                          Top {challenge.percentile.toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  {challenge.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {challenge.description}
                    </p>
                  )}

                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progression</span>
                      <span>
                        {formatValue(challenge.currentValue)} /{" "}
                        {challenge.targetThreshold
                          ? formatValue(challenge.targetThreshold)
                          : "MAX"}
                      </span>
                    </div>
                    <Progress value={challenge.progressRatio * 100} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    {challenge.highestLevel && (
                      <Badge variant="outline" className="text-xs">
                        Record : {challenge.highestLevel}
                      </Badge>
                    )}
                    {challenge.pointsEarned !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        Points : {formatValue(challenge.pointsEarned)}
                      </Badge>
                    )}
                    {challenge.tags?.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>

                  <p className="mt-3 text-right text-[11px] text-muted-foreground">
                    Mis à jour{" "}
                    {new Date(challenge.updatedAt).toLocaleString("fr-FR")}
                  </p>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
