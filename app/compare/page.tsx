"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
} from "lucide-react";
import { toast } from "sonner";
import { RIOT_REGIONS } from "@/lib/riot-regions";
import { useApiSWR } from "@/lib/hooks/swr";

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
    value1 === value2 ? null : higherIsBetter ? (value1 > value2 ? 1 : 2) : value1 < value2 ? 1 : 2;

  return (
    <div className="flex items-center gap-4 py-3 border-b border-border/50 last:border-0">
      <div
        className={`flex-1 text-right font-semibold ${winner === 1 ? "text-green-500" : ""}`}
      >
        {format(value1)}
      </div>
      <div className="flex items-center gap-2 text-muted-foreground text-sm w-32 justify-center">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={`flex-1 text-left font-semibold ${winner === 2 ? "text-green-500" : ""}`}
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
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="size-20 rounded-full" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <div className="size-20 rounded-full bg-muted flex items-center justify-center">
          <UsersIcon className="size-8" />
        </div>
        <span className="text-sm">Selectionnez un joueur</span>
      </div>
    );
  }

  const iconUrl = player.profileIconId
    ? `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${player.profileIconId}.png`
    : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <Avatar className="size-20 border-2 border-primary/20">
        {iconUrl ? (
          <AvatarImage src={iconUrl} alt={player.gameName} />
        ) : null}
        <AvatarFallback className="text-2xl">
          {player.gameName[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="text-center">
        <div className="font-semibold">
          {player.gameName}
          <span className="text-muted-foreground">#{player.tagLine}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {player.region.toUpperCase()} - Niveau {player.summonerLevel || "?"}
        </div>
      </div>
      <Badge variant={player.stats.winRate >= 50 ? "default" : "secondary"}>
        {player.stats.winRate.toFixed(1)}% WR ({player.stats.totalGames} parties)
      </Badge>
    </div>
  );
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
    if (!player1Query.trim() || !player2Query.trim()) {
      toast.error("Entrez les deux noms de joueurs");
      return;
    }

    setIsSearching(true);
    try {
      // Search for both players
      const [res1, res2] = await Promise.all([
        fetch("/api/riot/search-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: player1Query.trim(), region: region1 }),
        }),
        fetch("/api/riot/search-account", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: player2Query.trim(), region: region2 }),
        }),
      ]);

      const data1 = await res1.json();
      const data2 = await res2.json();

      if (!res1.ok || !data1.puuid) {
        toast.error(`Joueur 1 non trouve: ${data1.error || "Erreur"}`);
        return;
      }
      if (!res2.ok || !data2.puuid) {
        toast.error(`Joueur 2 non trouve: ${data2.error || "Erreur"}`);
        return;
      }

      setCompareUrl(
        `/api/compare?puuid1=${data1.puuid}&region1=${region1}&puuid2=${data2.puuid}&region2=${region2}`
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
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-3 mb-2">
          <UsersIcon className="size-8 text-primary" />
          Comparer des joueurs
        </h1>
        <p className="text-muted-foreground">
          Comparez les statistiques de deux joueurs cote a cote
        </p>
      </div>

      {/* Search form */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end">
            {/* Player 1 */}
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Joueur 1</label>
              <div className="flex gap-2">
                <Select value={region1} onValueChange={setRegion1}>
                  <SelectTrigger className="w-[100px]">
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
                <Input
                  placeholder="Nom#TAG"
                  value={player1Query}
                  onChange={(e) => setPlayer1Query(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCompare()}
                />
              </div>
            </div>

            <div className="hidden md:flex items-center text-muted-foreground">
              <SwordsIcon className="size-6" />
            </div>

            {/* Player 2 */}
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium">Joueur 2</label>
              <div className="flex gap-2">
                <Select value={region2} onValueChange={setRegion2}>
                  <SelectTrigger className="w-[100px]">
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
                <Input
                  placeholder="Nom#TAG"
                  value={player2Query}
                  onChange={(e) => setPlayer2Query(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCompare()}
                />
              </div>
            </div>

            <Button onClick={handleCompare} disabled={isSearching || isLoading}>
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
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Resultats</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Player headers */}
            <div className="flex items-start justify-between gap-8 mb-8">
              <div className="flex-1">
                <PlayerCard player={player1} loading={isLoading} />
              </div>
              <div className="flex items-center justify-center pt-8">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center">
                  <span className="font-bold text-muted-foreground">VS</span>
                </div>
              </div>
              <div className="flex-1">
                <PlayerCard player={player2} loading={isLoading} />
              </div>
            </div>

            {/* Stats comparison */}
            {hasData && (
              <div className="space-y-2">
                <StatCompareRow
                  label="Win Rate"
                  value1={player1.stats.winRate}
                  value2={player2.stats.winRate}
                  icon={<SwordsIcon className="size-4" />}
                  format={(v) => `${v.toFixed(1)}%`}
                />
                <StatCompareRow
                  label="KDA"
                  value1={player1.stats.avgKDA}
                  value2={player2.stats.avgKDA}
                  icon={<ZapIcon className="size-4" />}
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
    </div>
  );
}
