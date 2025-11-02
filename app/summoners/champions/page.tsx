"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  TrophyIcon,
  TargetIcon,
  SwordsIcon,
  Loader2Icon,
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
} from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/lib/auth-context";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { AIInsightCard, AIInsight } from "@/components/AIInsightCard";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const getChampionImageUrl = (championId: string): string => {
  const version = "15.21.1";
  return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`;
};

interface ChampionStats {
  played: number;
  wins: number;
  kills: number;
  deaths: number;
  assists: number;
}

type SortColumn =
  | "name"
  | "played"
  | "wins"
  | "winRate"
  | "kda"
  | "avgKills"
  | "avgDeaths"
  | "avgAssists";
type SortDirection = "asc" | "desc" | null;

// Composant SortIcon
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

export default function ChampionsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const matchesUrl = user?.riotPuuid
    ? `/api/matches/list?puuid=${user.riotPuuid}`
    : "/api/matches/list";
  const { data, error, isLoading } = useSWR(matchesUrl, fetcher);
  const { data: championsData } = useSWR("/api/champions/list", fetcher);

  const championMap = useMemo(
    () =>
      championsData?.data
        ? new Map(
            championsData.data.map(
              (champion: { championId: string; name: string }) => [
                champion.championId,
                champion.name,
              ]
            )
          )
        : new Map(),
    [championsData]
  );

  const championStats = useMemo(
    () => (data?.data?.championStats || {}) as Record<string, ChampionStats>,
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
        name: championMap.get(championId) || championId,
        ...stats,
        winRate: ((stats.wins / stats.played) * 100).toFixed(1),
        kda: ((stats.kills + stats.assists) / (stats.deaths || 1)).toFixed(2),
        avgKills: (stats.kills / stats.played).toFixed(1),
        avgDeaths: (stats.deaths / stats.played).toFixed(1),
        avgAssists: (stats.assists / stats.played).toFixed(1),
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
          case "avgKills":
          case "avgDeaths":
          case "avgAssists":
            aValue = a[sortColumn];
            bValue = b[sortColumn];
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
      // Tri par défaut par parties jouées
      filtered.sort((a, b) => b.played - a.played);
    }

    return filtered;
  }, [championStats, championMap, searchTerm, sortColumn, sortDirection]);

  // Générer des insights IA basés sur les données
  const aiInsights = useMemo<AIInsight[]>(() => {
    if (!champions || champions.length === 0) return [];

    const insights: AIInsight[] = [];

    // Insight 1: Diversité des champions
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

    // Insight 2: Meilleur champion
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

    // Insight 3: KDA moyen
    const avgKDA =
      champions.reduce((sum, champ) => {
        return sum + parseFloat(champ.kda);
      }, 0) / champions.length;

    if (avgKDA >= 2.5) {
      insights.push({
        type: "positive",
        title: "Impact élevé sur vos matchs",
        description: `Votre KDA moyen de ${avgKDA.toFixed(
          2
        )} indique que vous apportez une contribution significative à vos équipes.`,
        confidence: 85,
        data: { "KDA moyen": avgKDA.toFixed(2) },
      });
    } else if (avgKDA < 1.5) {
      insights.push({
        type: "negative",
        title: "Impact de combat à améliorer",
        description: `Votre KDA moyen de ${avgKDA.toFixed(
          2
        )} suggère que vous devriez vous concentrer sur l'amélioration de votre survie et de votre contribution en combat.`,
        confidence: 80,
        recommendation:
          "Travaillez sur votre positioning et votre conscience de la carte pour réduire vos morts et augmenter votre impact.",
        data: { "KDA moyen": avgKDA.toFixed(2) },
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
              Les statistiques de vos champions apparaîtront après avoir
              collecté des matchs
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Mes Champions</h2>
        <p className="text-muted-foreground">
          Statistiques détaillées de vos performances par champion
        </p>
      </div>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Champions joués
            </CardTitle>
            <SwordsIcon className="size-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{champions.length}</div>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-background to-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Champions uniques
            </CardTitle>
            <TargetIcon className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                champions.filter((champ) => parseFloat(champ.winRate) >= 50)
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              avec 50%+ de win rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-background to-purple-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Meilleur champion
            </CardTitle>
            <TrophyIcon className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {champions[0]?.name || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground">
              {champions[0]?.played || 0} parties jouées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Insights IA */}
      {aiInsights.length > 0 && (
        <div className="space-y-4">
          {aiInsights.map((insight, index) => (
            <AIInsightCard key={index} insight={insight} />
          ))}
        </div>
      )}

      {/* Tableau des champions */}
      <Card>
        <CardHeader>
          <CardTitle>Détails par champion</CardTitle>
          <CardDescription>
            Statistiques complètes de vos performances
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barre de recherche */}
          <div className="mb-4">
            <Input
              placeholder="Rechercher un champion..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
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
                      Parties
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
                      Win Rate
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {champions.map((champion) => (
                  <TableRow key={champion.championId}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Image
                          src={getChampionImageUrl(champion.championId)}
                          alt={champion.championId}
                          width={48}
                          height={48}
                          className="rounded-md border-2 border-primary/20"
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
                      <div
                        className={`font-bold ${
                          parseFloat(champion.winRate) >= 50
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {champion.winRate}%
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{champion.kda}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono text-sm">
                        {champion.avgKills} / {champion.avgDeaths} /{" "}
                        {champion.avgAssists}
                      </div>
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
