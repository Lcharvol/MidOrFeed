"use client";

import { useState, useMemo } from "react";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ChampionIcon } from "@/components/ChampionIcon";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  ChevronsUpDownIcon,
  Loader2Icon,
  FilterIcon,
  GlobeIcon,
  SparklesIcon,
  SwordsIcon,
  TargetIcon,
  MountainIcon,
  TreePineIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { MATCHES_FETCH_LIMIT } from "@/constants/matches";

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
  score: number;
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
  | "score"
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

const PATCH_VERSION = "15.21" as const;

const ROLE_META = {
  TOP: { label: "Top", Icon: MountainIcon },
  JUNGLE: { label: "Jungle", Icon: TreePineIcon },
  MIDDLE: { label: "Mid", Icon: SwordsIcon },
  MID: { label: "Mid", Icon: SwordsIcon },
  BOTTOM: { label: "Bot", Icon: TargetIcon },
  BOT: { label: "Bot", Icon: TargetIcon },
  ADC: { label: "Bot", Icon: TargetIcon },
  UTILITY: { label: "Support", Icon: SparklesIcon },
  SUPPORT: { label: "Support", Icon: SparklesIcon },
} as const;

type RoleKey = keyof typeof ROLE_META;

const ROLE_FILTER_OPTIONS: Array<{
  key: RoleKey;
  label: string;
  Icon: LucideIcon;
}> = [
  { key: "TOP", label: "Top", Icon: MountainIcon },
  { key: "JUNGLE", label: "Jungle", Icon: TreePineIcon },
  { key: "MID", label: "Mid", Icon: SwordsIcon },
  { key: "BOT", label: "Bot", Icon: TargetIcon },
  { key: "SUPPORT", label: "Support", Icon: SparklesIcon },
];

const getRoleMeta = (role?: string | null) => {
  const normalized = role?.toUpperCase() as RoleKey | undefined;
  return ROLE_META[normalized ?? "UTILITY"];
};

const normalizeRoleKey = (role?: string | null): RoleKey | undefined => {
  if (!role) return undefined;
  const upper = role.toUpperCase();
  if (upper === "MIDDLE") return "MID";
  if (upper === "MID") return "MID";
  if (upper === "BOTTOM") return "BOT";
  if (upper === "ADC") return "BOT";
  if (upper === "UTILITY") return "SUPPORT";
  if (upper === "SUPPORT") return "SUPPORT";
  if (upper === "JUNGLE") return "JUNGLE";
  if (upper === "TOP") return "TOP";
  if (upper === "BOT") return "BOT";
  return undefined;
};

const resolveTier = (score?: number, games?: number) => {
  if (!score || !Number.isFinite(score) || (games ?? 0) < MATCHES_FETCH_LIMIT)
    return "-";
  if (score >= 88) return "S+";
  if (score >= 78) return "S";
  if (score >= 68) return "A";
  if (score >= 58) return "B";
  if (score >= 48) return "C";
  return "D";
};

const tierColorMap: Record<string, string> = {
  "S+": "bg-purple-500/15 text-purple-100 border-purple-400/60 shadow-[0_0_18px_rgba(124,58,237,0.35)]",
  S: "bg-violet-500/15 text-violet-100 border-violet-400/60",
  A: "bg-emerald-500/15 text-emerald-200 border-emerald-400/60",
  B: "bg-sky-500/15 text-sky-200 border-sky-400/50",
  C: "bg-amber-500/10 text-amber-200 border-amber-400/40",
  D: "bg-rose-500/10 text-rose-200 border-rose-400/40",
  "-": "bg-muted/40 text-muted-foreground border-muted/40",
};

const getTierBadgeClassName = (tier: string) =>
  tierColorMap[tier] ?? tierColorMap["-"];

const getScoreBadgeClassName = (score?: number | null) => {
  if (!score && score !== 0)
    return "bg-muted/30 text-muted-foreground border-muted/40";
  if (score >= 85)
    return "bg-emerald-500/15 text-emerald-200 border-emerald-400/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]";
  if (score >= 70) return "bg-lime-500/10 text-lime-200 border-lime-400/40";
  if (score >= 55) return "bg-amber-500/10 text-amber-200 border-amber-400/40";
  if (score >= 45)
    return "bg-orange-500/10 text-orange-200 border-orange-400/40";
  return "bg-rose-500/10 text-rose-200 border-rose-400/40";
};

const getWinRateBadgeClassName = (winRate?: number) => {
  if (!winRate && winRate !== 0)
    return "bg-muted/30 text-muted-foreground border-muted/40";
  if (winRate >= 58)
    return "bg-emerald-500/15 text-emerald-200 border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.2)]";
  if (winRate >= 52) return "bg-teal-500/15 text-teal-200 border-teal-400/50";
  if (winRate >= 48)
    return "bg-amber-500/10 text-amber-200 border-amber-400/40";
  return "bg-rose-500/10 text-rose-200 border-rose-400/40";
};

const formatPercentage = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)}%`;
};

const formatNumber = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return value.toLocaleString("fr-FR");
};

const formatKDA = (value?: number) => {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return value.toFixed(2);
};

export default function ChampionsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortColumn, setSortColumn] = useState<SortColumn | null>("score");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [roleFilter, setRoleFilter] = useState<RoleKey | "ALL">("ALL");
  const [reliabilityOnly, setReliabilityOnly] = useState(false);
  const [eliteOnly, setEliteOnly] = useState(false);

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

  const totalMatches = useMemo(() => {
    return championsWithStats.reduce((acc, champ) => {
      return acc + (champ.stats?.totalGames ?? 0);
    }, 0);
  }, [championsWithStats]);

  const reliableChampionCount = useMemo(() => {
    return championsWithStats.filter(
      (champ) => (champ.stats?.totalGames ?? 0) >= MATCHES_FETCH_LIMIT
    ).length;
  }, [championsWithStats]);

  const averageWinRate = useMemo(() => {
    if (championsWithStats.length === 0) return 0;
    const total = championsWithStats.reduce((acc, champ) => {
      return acc + (champ.stats?.winRate ?? 0);
    }, 0);
    return total / championsWithStats.length;
  }, [championsWithStats]);

  const lastUpdated = useMemo(() => {
    if (!statsData?.data || statsData.data.length === 0) return null;
    const latest = statsData.data.reduce((latestDate, stat) => {
      const current = new Date(stat.lastAnalyzedAt).getTime();
      return current > latestDate ? current : latestDate;
    }, 0);
    return latest ? new Date(latest) : null;
  }, [statsData]);

  const formattedLastUpdated = useMemo(() => {
    if (!lastUpdated) return "—";
    return lastUpdated.toLocaleString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, [lastUpdated]);

  const sortedAndFilteredChampions = useMemo(() => {
    let filtered = championsWithStats.filter((champion) => {
      const stats = champion.stats;

      if (reliabilityOnly) {
        const matchesPlayed = stats?.totalGames ?? 0;
        if (matchesPlayed < MATCHES_FETCH_LIMIT) {
          return false;
        }
      }

      if (roleFilter !== "ALL") {
        const normalizedRole = normalizeRoleKey(
          stats?.topRole ?? stats?.topLane ?? undefined
        );
        if (!normalizedRole || normalizedRole !== roleFilter) {
          return false;
        }
      }

      if (eliteOnly) {
        const tier = resolveTier(stats?.score, stats?.totalGames);
        if (!["S", "S+"].includes(tier)) {
          return false;
        }
      }

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
          sortColumn === "totalGames" ||
          sortColumn === "score"
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
  }, [
    championsWithStats,
    searchTerm,
    sortColumn,
    sortDirection,
    roleFilter,
    reliabilityOnly,
    eliteOnly,
  ]);

  const filtersActive = reliabilityOnly || eliteOnly || roleFilter !== "ALL";
  const isWinRateSort = sortColumn === "winRate";

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <section className="rounded-2xl border bg-background/60 p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <Badge
              variant="outline"
              className="w-fit rounded-full border-border/60 bg-background/70 px-3 py-1 text-xs font-medium uppercase text-primary"
            >
              Patch {PATCH_VERSION}
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold md:text-4xl">LoL Tier List</h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                Analyse des performances compétitives basée sur{" "}
                {formatNumber(totalMatches)} parties récentes. Classement mis à
                jour automatiquement à partir des données de matchs collectées.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>Dernière mise à jour&nbsp;: {formattedLastUpdated}</span>
              <span>
                Champions analysés&nbsp;:{" "}
                {formatNumber(championsWithStats.length)}
              </span>
              <span>
                Champions fiables (≥{MATCHES_FETCH_LIMIT} matchs)&nbsp;:{" "}
                {formatNumber(reliableChampionCount)}
              </span>
            </div>
          </div>
          <div className="grid w-full max-w-xl grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-background/80 p-4 text-center shadow-sm">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Win Rate moyen
              </p>
              <p className="mt-1 text-xl font-semibold">
                {formatPercentage(averageWinRate)}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/80 p-4 text-center shadow-sm">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Total Matches
              </p>
              <p className="mt-1 text-xl font-semibold">
                {formatNumber(totalMatches)}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-background/80 p-4 text-center shadow-sm">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Champions fiables
              </p>
              <p className="mt-1 text-xl font-semibold">
                {formatNumber(reliableChampionCount)}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border bg-muted/30 p-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={filtersActive ? "default" : "outline"}
                size="sm"
                className="gap-2 rounded-full border-border/60 bg-background/70 text-xs font-medium"
              >
                <FilterIcon className="size-4" />
                Filtres
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 space-y-4 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Champions fiables</span>
                <Switch
                  checked={reliabilityOnly}
                  onCheckedChange={setReliabilityOnly}
                />
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">
                  Rôle principal
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant={roleFilter === "ALL" ? "default" : "outline"}
                    className="justify-start gap-2"
                    onClick={() => setRoleFilter("ALL")}
                  >
                    Tous les rôles
                  </Button>
                  {ROLE_FILTER_OPTIONS.map(({ key, label, Icon }) => (
                    <Button
                      key={key}
                      size="sm"
                      variant={roleFilter === key ? "default" : "outline"}
                      className="justify-start gap-2"
                      onClick={() => setRoleFilter(key)}
                    >
                      <Icon className="size-4" />
                      {label}
                    </Button>
                  ))}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button
            variant={eliteOnly ? "default" : "outline"}
            size="sm"
            className="gap-2 rounded-full border-border/60 bg-background/70 text-xs font-medium"
            onClick={() => setEliteOnly((prev) => !prev)}
            title="Afficher uniquement les champions S / S+"
          >
            <SparklesIcon className="size-4" /> Emerald +
          </Button>
          <Button
            variant={isWinRateSort ? "default" : "outline"}
            size="sm"
            className="gap-2 rounded-full border-border/60 bg-background/70 text-xs font-medium"
            onClick={() => {
              if (isWinRateSort) {
                setSortColumn("score");
                setSortDirection("desc");
              } else {
                setSortColumn("winRate");
                setSortDirection("desc");
              }
            }}
          >
            <SwordsIcon className="size-4" /> Ranked Solo
          </Button>
          <Button
            variant={filtersActive || isWinRateSort ? "default" : "outline"}
            size="sm"
            className="gap-2 rounded-full border-border/60 bg-background/70 text-xs font-medium"
            onClick={() => {
              setReliabilityOnly(false);
              setRoleFilter("ALL");
              setEliteOnly(false);
              setSortColumn("score");
              setSortDirection("desc");
            }}
          >
            <GlobeIcon className="size-4" /> Global
          </Button>
          <div className="ml-auto flex w-full items-center gap-2 sm:w-64">
            <Input
              placeholder="Rechercher un champion..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="rounded-full bg-background/80"
            />
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center rounded-2xl border bg-background/80 py-12">
            <Loader2Icon className="size-8 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-destructive bg-destructive/10 p-6 text-center">
            <p className="font-medium text-destructive">
              Erreur lors du chargement des champions
            </p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="rounded-2xl border bg-background/80 shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rank</TableHead>
                  <TableHead className="w-24">Rôle</TableHead>
                  <TableHead>Champion</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
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
                      Pick Rate
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
                      KDA moyen
                      <SortIcon
                        column="avgKDA"
                        sortColumn={sortColumn}
                        sortDirection={sortDirection}
                      />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Matches</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedAndFilteredChampions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="py-8 text-center">
                      Aucun champion trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedAndFilteredChampions.map((champion, index) => {
                    const stats = champion.stats;
                    const hasStats = stats && stats.totalGames > 0;
                    const reliableStats =
                      hasStats &&
                      (stats?.totalGames ?? 0) >= MATCHES_FETCH_LIMIT;
                    const tier = resolveTier(stats?.score, stats?.totalGames);
                    const tierClassName = getTierBadgeClassName(tier);
                    const roleMeta = getRoleMeta(
                      stats?.topRole ?? stats?.topLane ?? undefined
                    );
                    const RoleIcon = roleMeta.Icon;
                    const pickRate =
                      hasStats && totalMatches > 0
                        ? (stats.totalGames / totalMatches) * 100
                        : 0;
                    const scoreValue = stats?.score ?? null;
                    const formattedScore =
                      scoreValue !== null && Number.isFinite(scoreValue)
                        ? scoreValue.toFixed(1)
                        : "—";
                    const winRateValue =
                      stats?.winRate !== undefined && stats?.winRate !== null
                        ? stats.winRate
                        : null;

                    return (
                      <TableRow key={champion.id}>
                        <TableCell className="font-semibold">
                          #{index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <RoleIcon className="size-4 text-primary" />
                            <span className="text-muted-foreground">
                              {roleMeta.label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <ChampionIcon
                              championId={champion.championId}
                              size={48}
                              alt={champion.name}
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <p className="font-semibold leading-none">
                                  {champion.name}
                                </p>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {champion.title}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={cn(
                              "px-3 py-1 text-xs font-semibold uppercase tracking-wide",
                              tierClassName
                            )}
                          >
                            {tier}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {reliableStats ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-3 py-1 text-xs font-semibold",
                                getScoreBadgeClassName(scoreValue)
                              )}
                            >
                              {formattedScore}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {hasStats ? (
                            <Badge
                              variant="outline"
                              className={cn(
                                "px-3 py-1 text-xs font-semibold",
                                getWinRateBadgeClassName(
                                  winRateValue ?? undefined
                                )
                              )}
                            >
                              {formatPercentage(winRateValue ?? undefined)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">
                              —
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{formatPercentage(pickRate)}</TableCell>
                        <TableCell>{formatKDA(stats?.avgKDA)}</TableCell>
                        <TableCell className="text-right">
                          {hasStats ? formatNumber(stats?.totalGames) : "—"}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}

        <p className="text-sm text-muted-foreground">
          Affichage de {sortedAndFilteredChampions.length} champion(s) sur{" "}
          {formatNumber(championsWithStats.length)}.
        </p>
      </section>
    </div>
  );
}
