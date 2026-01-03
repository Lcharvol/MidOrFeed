"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  UsersIcon,
  SearchIcon,
  Loader2Icon,
  ArrowRightIcon,
  SwordsIcon,
  ShieldIcon,
  ZapIcon,
  EyeIcon,
  TrophyIcon,
  TargetIcon,
} from "lucide-react";
import { toast } from "sonner";
import { RIOT_REGIONS } from "@/lib/riot-regions";
import { useApiSWR } from "@/lib/hooks/swr";
import { PlayerSearchInput } from "@/components/PlayerSearchInput";
import { DDRAGON_VERSION } from "@/constants/ddragon";

type PlayerData = {
  puuid: string;
  gameName: string;
  tagLine: string;
  region: string;
  profileIconId?: number;
  summonerLevel?: number;
  stats: {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;
    avgKills: number;
    avgDeaths: number;
    avgAssists: number;
    avgKDA: number;
    avgVisionScore: number;
    avgDamageDealt: number;
  };
  topChampions: Array<{
    championId: string;
    games: number;
    wins: number;
    winRate: number;
  }>;
};

type CompareResponse = {
  success: boolean;
  data: {
    player1: PlayerData;
    player2: PlayerData;
  };
};

const StatCompareRow = ({
  label,
  value1,
  value2,
  icon,
  higherIsBetter = true,
  format = (v: number) => v.toFixed(1),
}: {
  label: string;
  value1: number;
  value2: number;
  icon: React.ReactNode;
  higherIsBetter?: boolean;
  format?: (v: number) => string;
}) => {
  const winner =
    value1 === value2
      ? null
      : higherIsBetter
        ? value1 > value2
          ? 1
          : 2
        : value1 < value2
          ? 1
          : 2;

  return (
    <div className="flex items-center gap-2 sm:gap-4 py-2 sm:py-3 border-b border-border/50 last:border-0">
      <div
        className={`flex-1 text-right font-semibold text-sm sm:text-lg ${winner === 1 ? "text-emerald-500" : "text-foreground"}`}
      >
        {format(value1)}
      </div>
      <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-[10px] sm:text-sm w-20 sm:w-36 justify-center shrink-0">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={`flex-1 text-left font-semibold text-sm sm:text-lg ${winner === 2 ? "text-emerald-500" : "text-foreground"}`}
      >
        {format(value2)}
      </div>
    </div>
  );
};

const PlayerCard = ({
  player,
  loading,
}: {
  player: PlayerData | null;
  loading: boolean;
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2 sm:gap-3">
        <Skeleton className="size-16 sm:size-24 rounded-full" />
        <Skeleton className="h-5 sm:h-6 w-24 sm:w-36" />
        <Skeleton className="h-4 sm:h-5 w-20 sm:w-28" />
        <Skeleton className="h-5 sm:h-6 w-24 sm:w-32" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center gap-2 sm:gap-3 text-muted-foreground py-2 sm:py-4">
        <div className="size-16 sm:size-24 rounded-full bg-muted/50 flex items-center justify-center border-2 border-dashed border-border">
          <UsersIcon className="size-6 sm:size-10 text-muted-foreground/50" />
        </div>
        <span className="text-xs sm:text-sm text-center">Selectionnez un joueur</span>
      </div>
    );
  }

  const iconUrl = player.profileIconId
    ? `https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/profileicon/${player.profileIconId}.png`
    : null;

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <Avatar className="size-16 sm:size-24 border-2 border-primary/30 shadow-lg">
        {iconUrl ? (
          <AvatarImage src={iconUrl} alt={player.gameName} />
        ) : null}
        <AvatarFallback className="text-xl sm:text-3xl bg-muted">
          {player.gameName[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="text-center">
        <div className="text-sm sm:text-lg font-semibold">
          <span className="truncate max-w-[80px] sm:max-w-none inline-block align-bottom">{player.gameName}</span>
          <span className="text-muted-foreground font-normal text-xs sm:text-base">
            #{player.tagLine}
          </span>
        </div>
        <div className="text-[10px] sm:text-sm text-muted-foreground">
          {player.region.toUpperCase()} - Niv.{" "}
          {player.summonerLevel || "?"}
        </div>
      </div>
      <Badge
        variant={player.stats.winRate >= 50 ? "default" : "secondary"}
        className="text-[10px] sm:text-sm px-2 sm:px-3 py-0.5 sm:py-1"
      >
        {player.stats.winRate.toFixed(1)}% WR ({player.stats.totalGames})
      </Badge>
    </div>
  );
};

const parsePlayerQuery = (
  query: string
): { gameName: string; tagLine: string } | null => {
  const trimmed = query.trim();
  const hashIndex = trimmed.lastIndexOf("#");

  if (
    hashIndex === -1 ||
    hashIndex === 0 ||
    hashIndex === trimmed.length - 1
  ) {
    return null;
  }

  const gameName = trimmed.slice(0, hashIndex).trim();
  const tagLine = trimmed.slice(hashIndex + 1).trim();

  if (!gameName || !tagLine) {
    return null;
  }

  return { gameName, tagLine };
};

export default function ComparePage() {
  const [player1Query, setPlayer1Query] = useState("");
  const [player2Query, setPlayer2Query] = useState("");
  const [region1, setRegion1] = useState("euw1");
  const [region2, setRegion2] = useState("euw1");
  const [compareUrl, setCompareUrl] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const { data, isLoading } = useApiSWR<CompareResponse>(compareUrl, {
    revalidateOnFocus: false,
  });

  const handleCompare = useCallback(async () => {
    const parsed1 = parsePlayerQuery(player1Query);
    const parsed2 = parsePlayerQuery(player2Query);

    if (!parsed1) {
      toast.error("Joueur 1: Format invalide. Utilisez Nom#TAG");
      return;
    }
    if (!parsed2) {
      toast.error("Joueur 2: Format invalide. Utilisez Nom#TAG");
      return;
    }

    setIsSearching(true);
    try {
      const [res1, res2] = await Promise.all([
        fetch("/api/riot/search-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameName: parsed1.gameName,
            tagLine: parsed1.tagLine,
            region: region1,
          }),
        }),
        fetch("/api/riot/search-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            gameName: parsed2.gameName,
            tagLine: parsed2.tagLine,
            region: region2,
          }),
        }),
      ]);

      const data1 = await res1.json();
      const data2 = await res2.json();

      if (!res1.ok || !data1.data?.puuid) {
        toast.error(`Joueur 1 non trouve: ${data1.error || "Erreur"}`);
        return;
      }
      if (!res2.ok || !data2.data?.puuid) {
        toast.error(`Joueur 2 non trouve: ${data2.error || "Erreur"}`);
        return;
      }

      setCompareUrl(
        `/api/compare?puuid1=${data1.data.puuid}&region1=${region1}&puuid2=${data2.data.puuid}&region2=${region2}`
      );
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la recherche");
    } finally {
      setIsSearching(false);
    }
  }, [player1Query, player2Query, region1, region2]);

  const player1 = data?.data?.player1 || null;
  const player2 = data?.data?.player2 || null;
  const hasData = player1 && player2;

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 max-w-4xl">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <SwordsIcon className="size-6 sm:size-8 text-primary" />
          Comparer des joueurs
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Comparez les statistiques de deux joueurs
        </p>
      </div>

      {/* Search form */}
      <Card className="mb-6 sm:mb-8 border-border/60 shadow-lg">
        <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            {/* Player 1 */}
            <div className="space-y-2 w-full">
              <label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <div className="size-2 rounded-full bg-blue-500" />
                Joueur 1
              </label>
              <div className="flex gap-2">
                <Select value={region1} onValueChange={setRegion1}>
                  <SelectTrigger className="w-20 sm:w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RIOT_REGIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <PlayerSearchInput
                  value={player1Query}
                  onChange={setPlayer1Query}
                  region={region1}
                  placeholder="Nom#TAG"
                  className="flex-1"
                />
              </div>
            </div>

            {/* Player 2 */}
            <div className="space-y-2 w-full">
              <label className="text-xs sm:text-sm font-medium flex items-center gap-2">
                <div className="size-2 rounded-full bg-red-500" />
                Joueur 2
              </label>
              <div className="flex gap-2">
                <Select value={region2} onValueChange={setRegion2}>
                  <SelectTrigger className="w-20 sm:w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RIOT_REGIONS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <PlayerSearchInput
                  value={player2Query}
                  onChange={setPlayer2Query}
                  region={region2}
                  placeholder="Nom#TAG"
                  className="flex-1"
                />
              </div>
            </div>

            <Button
              onClick={handleCompare}
              disabled={isSearching || isLoading}
              size="default"
              className="w-full"
            >
              {isSearching || isLoading ? (
                <Loader2Icon className="size-4 animate-spin mr-2" />
              ) : (
                <SearchIcon className="size-4 mr-2" />
              )}
              Comparer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison results */}
      {(isLoading || hasData) && (
        <Card className="border-border/60 shadow-lg overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50 p-4 sm:p-6">
            <CardTitle className="text-center flex items-center justify-center gap-2 text-base sm:text-lg">
              <TrophyIcon className="size-4 sm:size-5 text-primary" />
              Resultats
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
            {/* Player headers */}
            <div className="flex items-start justify-between gap-2 sm:gap-4 mb-6 sm:mb-8">
              <div className="flex-1 min-w-0">
                <PlayerCard player={player1} loading={isLoading} />
              </div>
              <div className="flex items-center justify-center pt-4 sm:pt-8 shrink-0">
                <div className="size-10 sm:size-14 rounded-full bg-gradient-to-br from-blue-500/20 to-red-500/20 flex items-center justify-center border border-border/50">
                  <span className="font-bold text-sm sm:text-lg text-muted-foreground">
                    VS
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <PlayerCard player={player2} loading={isLoading} />
              </div>
            </div>

            {/* Stats comparison */}
            {hasData && (
              <div className="space-y-1 bg-muted/20 rounded-xl p-3 sm:p-4 border border-border/50">
                <StatCompareRow
                  label="Win Rate"
                  value1={player1.stats.winRate}
                  value2={player2.stats.winRate}
                  icon={<TrophyIcon className="size-4" />}
                  format={(v) => `${v.toFixed(1)}%`}
                />
                <StatCompareRow
                  label="KDA"
                  value1={player1.stats.avgKDA}
                  value2={player2.stats.avgKDA}
                  icon={<TargetIcon className="size-4" />}
                />
                <StatCompareRow
                  label="Kills"
                  value1={player1.stats.avgKills}
                  value2={player2.stats.avgKills}
                  icon={<SwordsIcon className="size-4" />}
                />
                <StatCompareRow
                  label="Deaths"
                  value1={player1.stats.avgDeaths}
                  value2={player2.stats.avgDeaths}
                  icon={<ShieldIcon className="size-4" />}
                  higherIsBetter={false}
                />
                <StatCompareRow
                  label="Assists"
                  value1={player1.stats.avgAssists}
                  value2={player2.stats.avgAssists}
                  icon={<UsersIcon className="size-4" />}
                />
                <StatCompareRow
                  label="Vision"
                  value1={player1.stats.avgVisionScore}
                  value2={player2.stats.avgVisionScore}
                  icon={<EyeIcon className="size-4" />}
                />
                <StatCompareRow
                  label="Degats"
                  value1={player1.stats.avgDamageDealt}
                  value2={player2.stats.avgDamageDealt}
                  icon={<ZapIcon className="size-4" />}
                  format={(v) => `${(v / 1000).toFixed(1)}k`}
                />
                <StatCompareRow
                  label="Parties"
                  value1={player1.stats.totalGames}
                  value2={player2.stats.totalGames}
                  icon={<ArrowRightIcon className="size-4" />}
                  format={(v) => v.toString()}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!isLoading && !hasData && (
        <Card className="border-dashed border-border/50 bg-muted/10">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <SwordsIcon className="size-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              Aucune comparaison en cours
            </h3>
            <p className="text-muted-foreground text-sm max-w-md">
              Entrez les noms de deux joueurs au format <strong>Nom#TAG</strong>{" "}
              et cliquez sur Comparer pour voir leurs statistiques cote a cote.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
