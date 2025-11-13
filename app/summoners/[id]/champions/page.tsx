"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  SwordsIcon,
  Loader2Icon,
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AIInsightCard, AIInsight } from "@/components/AIInsightCard";
import type { SummonerChampionStats } from "@/types";
import { useParams } from "next/navigation";
import { useChampions } from "@/lib/hooks/use-champions";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Image helper centralized in constants/ddragon

// Using shared type from types/index.ts

type SortColumn =
  | "name"
  | "played"
  | "wins"
  | "winRate"
  | "kda"
  | "avgKills"
  | "avgDeaths"
  | "avgAssists"
  | "score";
type SortDirection = "asc" | "desc" | null;

const SortIcon = ({
  column,
  sortColumn,
  sortDirection,
}: {
  column: SortColumn;
  sortColumn: SortColumn | null;
  sortDirection: SortDirection;
}) => {
  if (sortColumn !== column)
    return <ChevronsUpDownIcon className="ml-1 size-4 opacity-50" />;
  if (sortDirection === "asc") return <ArrowUpIcon className="ml-1 size-4" />;
  if (sortDirection === "desc")
    return <ArrowDownIcon className="ml-1 size-4" />;
  return <ChevronsUpDownIcon className="ml-1 size-4 opacity-50" />;
};

export default function ChampionsByIdPage() {
  const params = useParams();
  const puuid = typeof params?.id === "string" ? params.id : undefined;

  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Scoring configuration
  const MIN_GAMES_FOR_SCORE = 3; // en dessous: pas de score affiché
  const VOLUME_REF_GAMES = 10; // nombre de parties pour atteindre le volume max

  const getScoreBadgeClass = (score: number) => {
    if (score >= 80) return "bg-green-600 hover:bg-green-600 text-white";
    if (score >= 65) return "bg-emerald-500 hover:bg-emerald-500 text-white";
    if (score >= 50) return "bg-amber-500 hover:bg-amber-500 text-white";
    if (score >= 35) return "bg-orange-500 hover:bg-orange-500 text-white";
    return "bg-red-500 hover:bg-red-500 text-white";
  };

  const getScoreTextClass = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 65) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    if (score >= 35) return "text-orange-500";
    return "text-red-500";
  };

  const matchesUrl = puuid
    ? `/api/matches/list?puuid=${puuid}`
    : "/api/matches/list";
  const { data, error, isLoading } = useSWR(matchesUrl, fetcher);
  const { championNameMap, championKeyToIdMap } = useChampions();

  const resolveChampionSlug = (idOrKey: string): string => {
    if (/^\d+$/.test(idOrKey)) {
      return championKeyToIdMap.get(idOrKey) || idOrKey;
    }
    return idOrKey;
  };

  const championStats = useMemo(
    () =>
      (data?.data?.championStats || {}) as Record<string, SummonerChampionStats>,
    [data]
  );

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortColumn(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const champions = useMemo(() => {
    let filtered = Object.entries(championStats)
      .map(([championId, stats]) => ({
        championId,
        name: championNameMap.get(championId) || championId,
        ...stats,
        winRate: ((stats.wins / stats.played) * 100).toFixed(1),
        kda: ((stats.kills + stats.assists) / (stats.deaths || 1)).toFixed(2),
        avgKills: (stats.kills / stats.played).toFixed(1),
        avgDeaths: (stats.deaths / stats.played).toFixed(1),
        avgAssists: (stats.assists / stats.played).toFixed(1),
        // Score agrégé pour classer les meilleurs champions
        score: (() => {
          if (stats.played < MIN_GAMES_FOR_SCORE) return null as number | null;
          const winRate01 = stats.played > 0 ? stats.wins / stats.played : 0; // 0..1
          const kdaNum = (stats.kills + stats.assists) / (stats.deaths || 1); // 0..+
          const kda01 = Math.min(1, kdaNum / 5); // clamp à 5 pour normaliser
          const volume01 = Math.min(1, stats.played / VOLUME_REF_GAMES); // pondération par volume
          const raw = 0.6 * winRate01 + 0.4 * kda01; // base sur perf
          const weighted = raw * (0.6 + 0.4 * volume01); // boost si volume élevé
          return Number((weighted * 100).toFixed(1)); // 0..100
        })(),
      }))
      .filter((champion) => {
        const matchesSearch = champion.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        return matchesSearch;
      });

    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortColumn) {
          case "name":
            aValue = a.name.toLowerCase();
            bValue = b.name.toLowerCase();
            break;
          case "played":
          case "wins":
          case "score":
          case "avgKills":
          case "avgDeaths":
          case "avgAssists":
            if (sortColumn === "score") {
              const as = a.score;
              const bs = b.score;
              // nulls en dernier
              if (as === null && bs === null) return 0;
              if (as === null) return 1;
              if (bs === null) return -1;
              aValue = as;
              bValue = bs;
            } else {
              aValue = (a as any)[sortColumn] ?? -Infinity;
              bValue = (b as any)[sortColumn] ?? -Infinity;
            }
            break;
          case "winRate":
          case "kda":
            aValue = parseFloat(a[sortColumn]);
            bValue = parseFloat(b[sortColumn]);
            break;
          default:
            return 0;
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    } else {
      filtered.sort((a, b) => b.played - a.played);
    }

    return filtered;
  }, [championStats, championNameMap, searchTerm, sortColumn, sortDirection]);

  const aiInsights = useMemo<AIInsight[]>(() => {
    if (!champions || champions.length === 0) return [];
    const insights: AIInsight[] = [];
    const uniqueChampions = champions.filter(
      (champ) => parseFloat(champ.winRate) >= 50
    ).length;
    if (champions.length >= 10 && uniqueChampions < 5) {
      insights.push({
        type: "warning",
        title: "Diversité de champion limitée",
        description: `Vous n'avez que ${uniqueChampions} champions avec un taux de victoire positif. L'IA recommande d'élargir votre pool de champions pour plus de flexibilité dans vos compositions.`,
        confidence: 85,
        recommendation:
          "Essayez d'ajouter 2-3 nouveaux champions à votre roster pour augmenter votre capacité d'adaptation.",
        data: {
          "Champions joués": champions.length,
          "Champions positifs": uniqueChampions,
        },
      });
    } else if (uniqueChampions >= 5) {
      insights.push({
        type: "positive",
        title: "Pool de champions solide",
        description: `Excellente diversité ! Vous maîtrisez ${uniqueChampions} champions avec un taux de victoire de 50% ou plus.`,
        confidence: 90,
        recommendation:
          "Continuez à vous perfectionner sur ces champions et ajoutez-en progressivement de nouveaux.",
        data: {
          "Champions positifs": uniqueChampions,
          "Taux de diversité": `${Math.round(
            (uniqueChampions / champions.length) * 100
          )}%`,
        },
      });
    }
    if (
      champions[0] &&
      parseFloat(champions[0].winRate) >= 70 &&
      champions[0].played >= 10
    ) {
      insights.push({
        type: "positive",
        title: `${champions[0].name} : Votre meilleur atout`,
        description: `Avec ${champions[0].winRate}% de victoires sur ${champions[0].played} matchs, ${champions[0].name} est clairement votre champion signature.`,
        confidence: 95,
        recommendation: `Continuez à prioriser ${champions[0].name} dans vos sélections pour maximiser vos chances de victoire.`,
        data: {
          "Win rate": `${champions[0].winRate}%`,
          "Matchs joués": champions[0].played,
        },
      });
    }
    return insights;
  }, [champions]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2Icon className="size-12 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">
          Erreur lors du chargement des champions
        </p>
      </div>
    );
  }

  if (Object.keys(championStats).length === 0) {
    return (
      <Card>
        <CardContent className="py-20">
          <div className="text-center">
            <SwordsIcon className="size-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">
              Aucune donnée de champions
            </h3>
            <p className="text-muted-foreground">
              Les statistiques apparaîtront après collecte
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Champions</h2>
        <p className="text-muted-foreground">
          Statistiques détaillées par champion
        </p>
      </div>


      {aiInsights.length > 0 && (
        <div className="space-y-4">
          {aiInsights.map((insight, idx) => (
            <AIInsightCard key={idx} insight={insight} />
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Détails par champion</CardTitle>
          <CardDescription>Statistiques complètes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Rechercher un champion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort("name")}
                  >
                    <div className="flex items-center">
                      Champion
                      <SortIcon
                        column="name"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort("played")}
                  >
                    <div className="flex items-center">
                      Parties jouées
                      <SortIcon
                        column="played"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort("wins")}
                  >
                    <div className="flex items-center">
                      Victoires
                      <SortIcon
                        column="wins"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort("winRate")}
                  >
                    <div className="flex items-center">
                      Win rate
                      <SortIcon
                        column="winRate"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort("kda")}
                  >
                    <div className="flex items-center">
                      KDA
                      <SortIcon
                        column="kda"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort("avgKills")}
                  >
                    <div className="flex items-center">
                      K / D / A
                      <SortIcon
                        column="avgKills"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    </div>
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-accent"
                    onClick={() => handleSort("score")}
                  >
                    <div className="flex items-center">
                      Score
                      <SortIcon
                        column="score"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {champions.map((champion) => (
                  <TableRow
                    key={champion.championId}
                    className="odd:bg-muted/30 hover:bg-accent/50 transition-colors"
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <ChampionIcon
                          championId={resolveChampionSlug(champion.championId)}
                          championKey={champion.championId}
                          championKeyToId={championKeyToIdMap}
                          size={48}
                          shape="rounded"
                          className="border-2 border-primary/20"
                        />
                        <div>
                          <p className="font-semibold">{champion.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {champion.championId}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{champion.played}</div>
                      <p className="text-xs text-muted-foreground">parties</p>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-green-600 dark:text-green-400">
                        {champion.wins}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {champion.played - champion.wins} défaites
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={parseFloat(champion.winRate)}
                          className="h-2 w-24"
                          role="progressbar"
                        />
                        <Badge
                          className={
                            parseFloat(champion.winRate) >= 50
                              ? "bg-green-500 hover:bg-green-500 text-white"
                              : "bg-red-500 hover:bg-red-500 text-white"
                          }
                        >
                          {champion.winRate}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        <span
                          className={
                            parseFloat(champion.kda) >= 3
                              ? "text-green-600 dark:text-green-400"
                              : parseFloat(champion.kda) >= 2
                              ? "text-amber-600 dark:text-amber-400"
                              : ""
                          }
                        >
                          {champion.kda}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">moyen</p>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {champion.avgKills} / {champion.avgDeaths} /{" "}
                        {champion.avgAssists}
                      </div>
                      <p className="text-xs text-muted-foreground">par match</p>
                    </TableCell>
                    <TableCell>
                      {champion.score === null ? (
                        <div className="text-xs text-muted-foreground">
                          Min {MIN_GAMES_FOR_SCORE} parties
                        </div>
                      ) : (
                        <div
                          className={`font-semibold ${getScoreTextClass(
                            Number(champion.score)
                          )}`}
                        >
                          {Number(champion.score).toFixed(1)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
