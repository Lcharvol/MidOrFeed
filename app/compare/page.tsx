"use client";

import { useState, useCallback, useMemo } from "react";
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
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UsersIcon,
  SearchIcon,
  Loader2Icon,
  SwordsIcon,
  ShieldIcon,
  ZapIcon,
  EyeIcon,
  TrophyIcon,
  TargetIcon,
  CoinsIcon,
  FlameIcon,
  HeartIcon,
  BanIcon,
  SparklesIcon,
  TrendingUpIcon,
  ClockIcon,
  CrownIcon,
} from "lucide-react";
import { toast } from "sonner";
import { RIOT_REGIONS } from "@/lib/riot-regions";
import { useApiSWR } from "@/lib/hooks/swr";
import { PlayerSearchInput } from "@/components/PlayerSearchInput";
import { DDRAGON_VERSION } from "@/constants/ddragon";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

// Types
interface ChampionStat {
  championId: string;
  games: number;
  wins: number;
  winRate: number;
  kills: number;
  deaths: number;
  assists: number;
  kda: number;
}

interface RoleDistribution {
  role: string;
  games: number;
  percentage: number;
  winRate: number;
}

interface RankedInfo {
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  winRate: number;
  queueType: string;
}

interface PlaystyleAnalysis {
  aggressionScore: number;
  visionScore: number;
  farmingScore: number;
  teamfightScore: number;
  survivabilityScore: number;
  earlyGameScore: number;
  objectiveScore: number;
}

interface RankProgression {
  date: string;
  tier: string;
  rank: string;
  lp: number;
}

interface PlayerStats {
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
  avgDamageTaken: number;
  avgGoldEarned: number;
  goldPerMin: number;
  damagePerMin: number;
  avgGameDuration: number;
}

interface PlayerData {
  puuid: string;
  gameName: string;
  tagLine: string;
  region: string;
  profileIconId?: number;
  summonerLevel?: number;
  stats: PlayerStats;
  rankedInfo: RankedInfo | null;
  rankProgression: RankProgression[];
  topChampions: ChampionStat[];
  roleDistribution: RoleDistribution[];
  playstyle: PlaystyleAnalysis;
  recentForm: {
    last10WinRate: number;
    currentStreak: number;
    streakType: "win" | "loss" | null;
  };
}

interface CommonChampion {
  championId: string;
  player1: ChampionStat;
  player2: ChampionStat;
}

interface DuoSynergy {
  roleCompatibility: number;
  playstyleCompatibility: number;
  recommendations: string[];
}

interface BanRecommendation {
  championId: string;
  reason: string;
  priority: number;
}

interface CompareResponse {
  success: boolean;
  data: {
    player1: PlayerData;
    player2: PlayerData;
    comparison: {
      commonChampions: CommonChampion[];
      duoSynergy: DuoSynergy;
      bansAgainstPlayer1: BanRecommendation[];
      bansAgainstPlayer2: BanRecommendation[];
    };
  };
}

// Utility components
const TIER_COLORS: Record<string, string> = {
  IRON: "bg-gray-600",
  BRONZE: "bg-amber-700",
  SILVER: "bg-gray-400",
  GOLD: "bg-yellow-500",
  PLATINUM: "bg-cyan-500",
  EMERALD: "bg-emerald-500",
  DIAMOND: "bg-blue-500",
  MASTER: "bg-purple-500",
  GRANDMASTER: "bg-red-500",
  CHALLENGER: "bg-amber-400",
};

const ROLE_LABELS: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  MID: "Mid",
  BOTTOM: "ADC",
  BOT: "ADC",
  UTILITY: "Support",
  SUPPORT: "Support",
  NONE: "Fill",
  UNKNOWN: "Autre",
};

const RankBadge = ({ rankedInfo }: { rankedInfo: RankedInfo | null }) => {
  if (!rankedInfo) {
    return (
      <Badge variant="secondary" className="text-xs">
        Non classe
      </Badge>
    );
  }

  const tierColor = TIER_COLORS[rankedInfo.tier] || "bg-gray-500";

  return (
    <div className="flex flex-col items-center gap-1">
      <Badge className={`${tierColor} text-white text-xs font-bold`}>
        {rankedInfo.tier} {rankedInfo.rank}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {rankedInfo.leaguePoints} LP
      </span>
      <span className="text-xs text-muted-foreground">
        {rankedInfo.wins}V / {rankedInfo.losses}D ({rankedInfo.winRate.toFixed(0)}%)
      </span>
    </div>
  );
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
        className={`flex-1 text-right font-semibold text-sm sm:text-lg ${winner === 1 ? "text-win" : "text-foreground"}`}
      >
        {format(value1)}
      </div>
      <div className="flex items-center gap-1 sm:gap-2 text-muted-foreground text-[10px] sm:text-sm w-20 sm:w-36 justify-center shrink-0">
        {icon}
        <span className="truncate">{label}</span>
      </div>
      <div
        className={`flex-1 text-left font-semibold text-sm sm:text-lg ${winner === 2 ? "text-win" : "text-foreground"}`}
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
      <RankBadge rankedInfo={player.rankedInfo} />
      {player.recentForm.streakType && (
        <Badge variant={player.recentForm.streakType === "win" ? "default" : "secondary"} className="text-xs">
          {player.recentForm.streakType === "win" ? "🔥" : "❄️"} {player.recentForm.currentStreak} {player.recentForm.streakType === "win" ? "victoires" : "defaites"}
        </Badge>
      )}
    </div>
  );
};

const ChampionIcon = ({ championId, size = 32 }: { championId: string; size?: number }) => (
  <img
    src={`https://ddragon.leagueoflegends.com/cdn/${DDRAGON_VERSION}/img/champion/${championId}.png`}
    alt={championId}
    className="rounded"
    style={{ width: size, height: size }}
  />
);

const TopChampionsSection = ({
  champions,
  title,
}: {
  champions: ChampionStat[];
  title: string;
}) => (
  <div className="space-y-2">
    <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
    <div className="space-y-2">
      {champions.slice(0, 5).map((champ) => (
        <div key={champ.championId} className="flex items-center gap-2 text-sm">
          <ChampionIcon championId={champ.championId} size={28} />
          <div className="flex-1 min-w-0">
            <div className="truncate font-medium">{champ.championId}</div>
            <div className="text-xs text-muted-foreground">
              {champ.games} parties - {champ.kda.toFixed(2)} KDA
            </div>
          </div>
          <Badge variant={champ.winRate >= 50 ? "default" : "secondary"} className="text-xs">
            {champ.winRate.toFixed(0)}%
          </Badge>
        </div>
      ))}
    </div>
  </div>
);

const RoleDistributionSection = ({ roles }: { roles: RoleDistribution[] }) => (
  <div className="space-y-2">
    {roles.slice(0, 4).map((role) => (
      <div key={role.role} className="space-y-1">
        <div className="flex justify-between text-xs">
          <span>{ROLE_LABELS[role.role] || role.role}</span>
          <span className="text-muted-foreground">{role.percentage.toFixed(0)}%</span>
        </div>
        <Progress value={role.percentage} className="h-1.5" />
      </div>
    ))}
  </div>
);

const PlaystyleRadar = ({
  player1,
  player2,
}: {
  player1: PlayerData;
  player2: PlayerData;
}) => {
  const data = useMemo(() => [
    { metric: "Agressivite", p1: player1.playstyle.aggressionScore, p2: player2.playstyle.aggressionScore },
    { metric: "Vision", p1: player1.playstyle.visionScore, p2: player2.playstyle.visionScore },
    { metric: "Farm", p1: player1.playstyle.farmingScore, p2: player2.playstyle.farmingScore },
    { metric: "Teamfight", p1: player1.playstyle.teamfightScore, p2: player2.playstyle.teamfightScore },
    { metric: "Survie", p1: player1.playstyle.survivabilityScore, p2: player2.playstyle.survivabilityScore },
    { metric: "Early Game", p1: player1.playstyle.earlyGameScore, p2: player2.playstyle.earlyGameScore },
    { metric: "Objectifs", p1: player1.playstyle.objectiveScore, p2: player2.playstyle.objectiveScore },
  ], [player1.playstyle, player2.playstyle]);

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid className="stroke-muted" />
          <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
          <Radar
            name={player1.gameName}
            dataKey="p1"
            stroke="hsl(221 83% 53%)"
            fill="hsl(221 83% 53%)"
            fillOpacity={0.3}
          />
          <Radar
            name={player2.gameName}
            dataKey="p2"
            stroke="hsl(0 84% 60%)"
            fill="hsl(0 84% 60%)"
            fillOpacity={0.3}
          />
          <Legend />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

const RankProgressionChart = ({
  player1,
  player2,
}: {
  player1: PlayerData;
  player2: PlayerData;
}) => {
  const tierToValue = (tier: string, rank: string, lp: number): number => {
    const tierValues: Record<string, number> = {
      IRON: 0, BRONZE: 400, SILVER: 800, GOLD: 1200,
      PLATINUM: 1600, EMERALD: 2000, DIAMOND: 2400,
      MASTER: 2800, GRANDMASTER: 3200, CHALLENGER: 3600,
    };
    const rankValues: Record<string, number> = { IV: 0, III: 100, II: 200, I: 300 };
    return (tierValues[tier] || 0) + (rankValues[rank] || 0) + lp;
  };

  const data = useMemo(() => {
    const allDates = new Set<string>();
    player1.rankProgression.forEach(r => allDates.add(r.date));
    player2.rankProgression.forEach(r => allDates.add(r.date));

    const sortedDates = Array.from(allDates).sort();

    return sortedDates.map(date => {
      const p1Entry = player1.rankProgression.find(r => r.date === date);
      const p2Entry = player2.rankProgression.find(r => r.date === date);

      return {
        date: new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
        p1: p1Entry ? tierToValue(p1Entry.tier, p1Entry.rank, p1Entry.lp) : null,
        p2: p2Entry ? tierToValue(p2Entry.tier, p2Entry.rank, p2Entry.lp) : null,
      };
    });
  }, [player1.rankProgression, player2.rankProgression]);

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-sm text-muted-foreground">
        Pas de donnees de progression
      </div>
    );
  }

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis hide />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="p1"
            name={player1.gameName}
            stroke="hsl(221 83% 53%)"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="p2"
            name={player2.gameName}
            stroke="hsl(0 84% 60%)"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const CommonChampionsSection = ({ champions }: { champions: CommonChampion[] }) => {
  if (champions.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        Aucun champion en commun avec suffisamment de parties
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {champions.slice(0, 5).map((champ) => (
        <div key={champ.championId} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
          <ChampionIcon championId={champ.championId} size={40} />
          <div className="flex-1 grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className={champ.player1.winRate >= champ.player2.winRate ? "text-win font-semibold" : ""}>
                {champ.player1.winRate.toFixed(0)}% WR
              </div>
              <div className="text-xs text-muted-foreground">
                {champ.player1.kda.toFixed(2)} KDA ({champ.player1.games} games)
              </div>
            </div>
            <div className="text-center">
              <div className={champ.player2.winRate > champ.player1.winRate ? "text-win font-semibold" : ""}>
                {champ.player2.winRate.toFixed(0)}% WR
              </div>
              <div className="text-xs text-muted-foreground">
                {champ.player2.kda.toFixed(2)} KDA ({champ.player2.games} games)
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const DuoSynergySection = ({ synergy }: { synergy: DuoSynergy }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Compatibilite Roles</span>
          <span className="font-semibold">{synergy.roleCompatibility.toFixed(0)}%</span>
        </div>
        <Progress value={synergy.roleCompatibility} className="h-2" />
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Compatibilite Style</span>
          <span className="font-semibold">{synergy.playstyleCompatibility.toFixed(0)}%</span>
        </div>
        <Progress value={synergy.playstyleCompatibility} className="h-2" />
      </div>
    </div>
    {synergy.recommendations.length > 0 && (
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Recommandations</h4>
        <ul className="space-y-1">
          {synergy.recommendations.map((rec, i) => (
            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
              <SparklesIcon className="size-3 text-primary" />
              {rec}
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

const BanRecommendationsSection = ({
  bans,
  playerName,
}: {
  bans: BanRecommendation[];
  playerName: string;
}) => {
  if (bans.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-2">
        Aucun ban recommande
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <BanIcon className="size-4 text-loss" />
        Bans contre {playerName}
      </h4>
      <div className="flex gap-2">
        {bans.map((ban) => (
          <div key={ban.championId} className="flex flex-col items-center gap-1">
            <ChampionIcon championId={ban.championId} size={36} />
            <span className="text-xs text-muted-foreground text-center max-w-[60px] truncate">
              {ban.reason}
            </span>
          </div>
        ))}
      </div>
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
  const comparison = data?.data?.comparison || null;
  const hasData = player1 && player2 && comparison;

  return (
    <div className="container mx-auto py-6 sm:py-8 px-4 max-w-6xl">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center justify-center gap-2 sm:gap-3 mb-2">
          <SwordsIcon className="size-6 sm:size-8 text-primary" />
          Comparer des joueurs
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground">
          Analyse complete de deux joueurs
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
        <div className="space-y-6">
          {/* Player headers */}
          <Card className="border-border/60 shadow-lg overflow-hidden">
            <CardHeader className="bg-muted/30 border-b border-border/50 p-4 sm:p-6">
              <CardTitle className="text-center flex items-center justify-center gap-2 text-base sm:text-lg">
                <TrophyIcon className="size-4 sm:size-5 text-primary" />
                Vue d&apos;ensemble
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
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
            </CardContent>
          </Card>

          {hasData && (
            <Tabs defaultValue="stats" className="w-full">
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-4">
                <TabsTrigger value="stats" className="text-xs sm:text-sm">
                  <TargetIcon className="size-3 sm:size-4 mr-1" />
                  Stats
                </TabsTrigger>
                <TabsTrigger value="champions" className="text-xs sm:text-sm">
                  <CrownIcon className="size-3 sm:size-4 mr-1" />
                  Champions
                </TabsTrigger>
                <TabsTrigger value="playstyle" className="text-xs sm:text-sm">
                  <FlameIcon className="size-3 sm:size-4 mr-1" />
                  Playstyle
                </TabsTrigger>
                <TabsTrigger value="synergy" className="text-xs sm:text-sm">
                  <UsersIcon className="size-3 sm:size-4 mr-1" />
                  Duo
                </TabsTrigger>
                <TabsTrigger value="progression" className="text-xs sm:text-sm">
                  <TrendingUpIcon className="size-3 sm:size-4 mr-1" />
                  Progression
                </TabsTrigger>
              </TabsList>

              {/* Stats Tab */}
              <TabsContent value="stats">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Combat Stats */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <SwordsIcon className="size-4 text-primary" />
                        Stats de combat
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 bg-muted/20 rounded-xl p-3 border border-border/50">
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
                        label="Degats"
                        value1={player1.stats.avgDamageDealt}
                        value2={player2.stats.avgDamageDealt}
                        icon={<ZapIcon className="size-4" />}
                        format={(v) => `${(v / 1000).toFixed(1)}k`}
                      />
                      <StatCompareRow
                        label="Degats subis"
                        value1={player1.stats.avgDamageTaken}
                        value2={player2.stats.avgDamageTaken}
                        icon={<HeartIcon className="size-4" />}
                        format={(v) => `${(v / 1000).toFixed(1)}k`}
                        higherIsBetter={false}
                      />
                    </CardContent>
                  </Card>

                  {/* Economy & Vision Stats */}
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <CoinsIcon className="size-4 text-primary" />
                        Economie & Vision
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-1 bg-muted/20 rounded-xl p-3 border border-border/50">
                      <StatCompareRow
                        label="Gold/min"
                        value1={player1.stats.goldPerMin}
                        value2={player2.stats.goldPerMin}
                        icon={<CoinsIcon className="size-4" />}
                        format={(v) => v.toFixed(0)}
                      />
                      <StatCompareRow
                        label="Degats/min"
                        value1={player1.stats.damagePerMin}
                        value2={player2.stats.damagePerMin}
                        icon={<ZapIcon className="size-4" />}
                        format={(v) => v.toFixed(0)}
                      />
                      <StatCompareRow
                        label="Vision"
                        value1={player1.stats.avgVisionScore}
                        value2={player2.stats.avgVisionScore}
                        icon={<EyeIcon className="size-4" />}
                      />
                      <StatCompareRow
                        label="Gold moyen"
                        value1={player1.stats.avgGoldEarned}
                        value2={player2.stats.avgGoldEarned}
                        icon={<CoinsIcon className="size-4" />}
                        format={(v) => `${(v / 1000).toFixed(1)}k`}
                      />
                      <StatCompareRow
                        label="Duree moy."
                        value1={player1.stats.avgGameDuration}
                        value2={player2.stats.avgGameDuration}
                        icon={<ClockIcon className="size-4" />}
                        format={(v) => `${v.toFixed(0)}m`}
                        higherIsBetter={false}
                      />
                      <StatCompareRow
                        label="Parties"
                        value1={player1.stats.totalGames}
                        value2={player2.stats.totalGames}
                        icon={<TargetIcon className="size-4" />}
                        format={(v) => v.toString()}
                      />
                      <StatCompareRow
                        label="Forme recente"
                        value1={player1.recentForm.last10WinRate}
                        value2={player2.recentForm.last10WinRate}
                        icon={<FlameIcon className="size-4" />}
                        format={(v) => `${v.toFixed(0)}%`}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Champions Tab */}
              <TabsContent value="champions">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="size-2 rounded-full bg-blue-500" />
                        {player1.gameName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TopChampionsSection champions={player1.topChampions} title="Top Champions" />
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Roles</h4>
                        <RoleDistributionSection roles={player1.roleDistribution} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <SwordsIcon className="size-4 text-primary" />
                        Champions en commun
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CommonChampionsSection champions={comparison.commonChampions} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <div className="size-2 rounded-full bg-red-500" />
                        {player2.gameName}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <TopChampionsSection champions={player2.topChampions} title="Top Champions" />
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Roles</h4>
                        <RoleDistributionSection roles={player2.roleDistribution} />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Playstyle Tab */}
              <TabsContent value="playstyle">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FlameIcon className="size-4 text-primary" />
                      Analyse du Playstyle
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <PlaystyleRadar player1={player1} player2={player2} />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Duo/Synergy Tab */}
              <TabsContent value="synergy">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <UsersIcon className="size-4 text-primary" />
                        Synergie Duo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <DuoSynergySection synergy={comparison.duoSynergy} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BanIcon className="size-4 text-loss" />
                        Bans Recommandes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <BanRecommendationsSection
                        bans={comparison.bansAgainstPlayer1}
                        playerName={player1.gameName}
                      />
                      <BanRecommendationsSection
                        bans={comparison.bansAgainstPlayer2}
                        playerName={player2.gameName}
                      />
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Progression Tab */}
              <TabsContent value="progression">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <TrendingUpIcon className="size-4 text-primary" />
                      Progression de Rang
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RankProgressionChart player1={player1} player2={player2} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
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
