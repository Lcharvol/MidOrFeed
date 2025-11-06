"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  Loader2Icon,
} from "lucide-react";

// Interface basée sur les données Riot
interface Champion {
  id: string;
  championId: string;
  name: string;
  title: string;
  blurb: string | null;
  attack: number;
  defense: number;
  magic: number;
  difficulty: number;
  hp: number;
  hpPerLevel: number;
  mp: number | null;
  mpPerLevel: number | null;
  moveSpeed: number;
  armor: number;
  armorPerLevel: number;
  spellBlock: number;
  spellBlockPerLevel: number;
  attackRange: number;
  hpRegen: number;
  hpRegenPerLevel: number;
  mpRegen: number | null;
  mpRegenPerLevel: number | null;
  crit: number;
  critPerLevel: number;
  attackDamage: number;
  attackDamagePerLevel: number;
  attackSpeed: number;
  attackSpeedPerLevel: number;
}

interface ChampionStats {
  id: string;
  championId: string;
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  winRate: number;
  avgKills: number;
  avgDeaths: number;
  avgAssists: number;
  avgKDA: number;
  avgGoldEarned: number;
  avgGoldSpent: number;
  avgDamageDealt: number;
  avgDamageTaken: number;
  avgVisionScore: number;
  topRole: string | null;
  topLane: string | null;
  lastAnalyzedAt: string;
}

interface ChampionsResponse {
  success: boolean;
  data: Champion[];
  count: number;
}

interface ChampionStatsResponse {
  success: boolean;
  data: ChampionStats[];
  count: number;
}

interface ChampionWithStats extends Champion {
  stats?: ChampionStats;
}

type SortColumn =
  | "name"
  | "winRate"
  | "totalGames"
  | "avgKDA"
  | "avgKills"
  | "avgDeaths"
  | "avgAssists"
  | "avgDamageDealt"
  | "avgVisionScore";
type SortDirection = "asc" | "desc" | null;

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Erreur lors de la récupération des données");
  }
  return res.json();
};

// Composant SortIcon défini en dehors du composant principal
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
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>("winRate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Utiliser SWR pour fetch les champions et leurs stats
  const {
    data: championsData,
    error: championsError,
    isLoading: championsLoading,
  } = useSWR<ChampionsResponse>("/api/champions/list", fetcher);
  const {
    data: statsData,
    error: statsError,
    isLoading: statsLoading,
  } = useSWR<ChampionStatsResponse>("/api/champions/stats", fetcher);

  const isLoading = championsLoading || statsLoading;
  const error = championsError || statsError;

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

  const getDifficultyBadgeVariant = (difficulty: number) => {
    if (difficulty >= 8) return "destructive";
    if (difficulty >= 6) return "default";
    if (difficulty >= 4) return "secondary";
    return "outline";
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty >= 8) return "Expert";
    if (difficulty >= 6) return "Avancé";
    if (difficulty >= 4) return "Moyen";
    return "Débutant";
  };

  // Combiner les champions avec leurs statistiques
  const championsWithStats = useMemo<ChampionWithStats[]>(() => {
    if (!championsData?.data) return [];

    const statsMap = new Map<string, ChampionStats>();
    if (statsData?.data) {
      for (const stat of statsData.data) {
        statsMap.set(stat.championId, stat);
      }
    }

    return championsData.data.map((champion) => ({
      ...champion,
      stats: statsMap.get(champion.championId),
    }));
  }, [championsData, statsData]);

  const sortedAndFilteredChampions = useMemo(() => {
    let filtered = championsWithStats.filter((champion) => {
      const matchesSearch = champion.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesSearch;
    });

    if (sortColumn && sortDirection) {
      filtered = [...filtered].sort((a, b) => {
        let aValue: number | string;
        let bValue: number | string;

        if (sortColumn === "name") {
          aValue = a.name;
          bValue = b.name;
        } else if (
          sortColumn.startsWith("avg") ||
          sortColumn === "winRate" ||
          sortColumn === "totalGames"
        ) {
          // Statistiques depuis les matches
          aValue =
            (a.stats?.[sortColumn as keyof ChampionStats] as number) ?? 0;
          bValue =
            (b.stats?.[sortColumn as keyof ChampionStats] as number) ?? 0;
        } else {
          // Statistiques de base du champion
          aValue = (a[sortColumn as keyof Champion] as number) ?? 0;
          bValue = (b[sortColumn as keyof Champion] as number) ?? 0;
        }

        if (typeof aValue === "number" && typeof bValue === "number") {
          return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
        } else if (typeof aValue === "string" && typeof bValue === "string") {
          return sortDirection === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        return 0;
      });
    }

    return filtered;
  }, [championsWithStats, searchTerm, sortColumn, sortDirection]);

  const getChampionImageUrl = (championId: string): string => {
    // Les images de champions Riot suivent ce pattern:
    // https://ddragon.leagueoflegends.com/cdn/{version}/img/champion/{championId}.png
    const version = "15.21.1"; // Version actuelle, à faire dynamique si besoin
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/champion/${championId}.png`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-4xl font-bold">Tier List - Champions</h1>
        <p className="text-muted-foreground">
          Classement des champions basé sur les performances réelles dans les
          matches
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Rechercher un champion..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2Icon className="size-8 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center">
          <p className="text-destructive">
            Erreur lors du chargement des champions
          </p>
        </div>
      )}

      {!isLoading && !error && (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">Image</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("name")}
                >
                  <div className="flex items-center">
                    Nom
                    <SortIcon
                      column="name"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>
                <TableHead>Titre</TableHead>
                <TableHead
                  className="cursor-pointer select-none"
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
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("totalGames")}
                >
                  <div className="flex items-center">
                    Parties
                    <SortIcon
                      column="totalGames"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("avgKDA")}
                >
                  <div className="flex items-center">
                    KDA
                    <SortIcon
                      column="avgKDA"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("avgKills")}
                >
                  <div className="flex items-center">
                    Kills
                    <SortIcon
                      column="avgKills"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("avgDeaths")}
                >
                  <div className="flex items-center">
                    Deaths
                    <SortIcon
                      column="avgDeaths"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("avgAssists")}
                >
                  <div className="flex items-center">
                    Assists
                    <SortIcon
                      column="avgAssists"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("avgDamageDealt")}
                >
                  <div className="flex items-center">
                    Dégâts
                    <SortIcon
                      column="avgDamageDealt"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>
                <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort("avgVisionScore")}
                >
                  <div className="flex items-center">
                    Vision
                    <SortIcon
                      column="avgVisionScore"
                      sortColumn={sortColumn}
                      sortDirection={sortDirection}
                    />
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedAndFilteredChampions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={11} className="text-center py-8">
                    Aucun champion trouvé
                  </TableCell>
                </TableRow>
              ) : (
                sortedAndFilteredChampions.map((champion) => {
                  const stats = champion.stats;
                  const hasStats = stats && stats.totalGames > 0;

                  return (
                    <TableRow key={champion.id}>
                      <TableCell>
                        <Image
                          src={getChampionImageUrl(champion.championId)}
                          alt={champion.name}
                          width={56}
                          height={56}
                          className="rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {champion.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {champion.title}
                      </TableCell>
                      <TableCell>
                        {hasStats ? (
                          <Badge
                            variant={
                              stats.winRate >= 55
                                ? "default"
                                : stats.winRate >= 50
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {stats.winRate.toFixed(1)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasStats ? (
                          stats.totalGames
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasStats ? (
                          stats.avgKDA.toFixed(2)
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasStats ? (
                          stats.avgKills.toFixed(1)
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasStats ? (
                          stats.avgDeaths.toFixed(1)
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasStats ? (
                          stats.avgAssists.toFixed(1)
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasStats ? (
                          Math.round(stats.avgDamageDealt).toLocaleString()
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {hasStats ? (
                          stats.avgVisionScore.toFixed(1)
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !error && (
        <div className="mt-4 text-sm text-muted-foreground">
          Affichage de {sortedAndFilteredChampions.length} champion
          {sortedAndFilteredChampions.length > 1 ? "s" : ""}
          {championsData && ` sur ${championsData.count}`}
          {statsData && statsData.count > 0 && (
            <span className="ml-2">
              • {statsData.count} avec statistiques de performance
            </span>
          )}
        </div>
      )}
    </div>
  );
}
