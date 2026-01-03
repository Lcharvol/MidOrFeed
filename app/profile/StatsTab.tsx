"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  TrophyIcon,
  SwordsIcon,
  UsersIcon,
  Loader2Icon,
  AlertCircleIcon,
  LinkIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface User {
  id: string;
  riotPuuid?: string | null;
  riotRegion?: string | null;
  leagueAccount?: {
    riotGameName?: string | null;
    riotTagLine?: string | null;
  } | null;
}

interface RankData {
  current: {
    tier: string;
    rank: string;
    lp: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  best: {
    tier: string;
    rank: string;
    lp: number;
  };
}

interface RankedData {
  solo: RankData | null;
  flex: RankData | null;
}

interface StatsTabProps {
  user: User;
}

const TIER_ORDER = [
  "IRON",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "EMERALD",
  "DIAMOND",
  "MASTER",
  "GRANDMASTER",
  "CHALLENGER",
];

const TIER_COLORS: Record<string, string> = {
  IRON: "from-zinc-400 to-zinc-600",
  BRONZE: "from-amber-700 to-amber-900",
  SILVER: "from-slate-300 to-slate-500",
  GOLD: "from-yellow-400 to-yellow-600",
  PLATINUM: "from-cyan-300 to-cyan-500",
  EMERALD: "from-emerald-400 to-emerald-600",
  DIAMOND: "from-blue-300 to-blue-500",
  MASTER: "from-purple-400 to-purple-600",
  GRANDMASTER: "from-red-400 to-red-600",
  CHALLENGER: "from-amber-300 via-yellow-400 to-amber-500",
};

function RankCard({
  title,
  icon: Icon,
  data,
  isLoading,
}: {
  title: string;
  icon: React.ElementType;
  data: RankData | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Icon className="size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">Non classé</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Jouez des parties classées pour voir votre rang
          </p>
        </CardContent>
      </Card>
    );
  }

  const tierColor = TIER_COLORS[data.current.tier] || "from-gray-400 to-gray-600";
  const totalGames = data.current.wins + data.current.losses;
  const lpProgress = (data.current.lp / 100) * 100;

  return (
    <Card className="overflow-hidden">
      <div className={`h-2 bg-gradient-to-r ${tierColor}`} />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="size-4 text-primary" />
            {title}
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {totalGames} games
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rank display */}
        <div className="flex items-center gap-4">
          <div
            className={`flex size-16 items-center justify-center rounded-full bg-gradient-to-br ${tierColor} text-white font-bold text-lg shadow-lg`}
          >
            {data.current.tier.charAt(0)}
            {data.current.rank !== "I" && (
              <span className="text-sm">{data.current.rank}</span>
            )}
          </div>
          <div className="flex-1">
            <p className="text-lg font-bold">
              {data.current.tier.charAt(0) + data.current.tier.slice(1).toLowerCase()}{" "}
              {data.current.rank}
            </p>
            <p className="text-sm text-muted-foreground">
              {data.current.lp} LP
            </p>
          </div>
        </div>

        {/* LP Progress */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0 LP</span>
            <span>100 LP</span>
          </div>
          <Progress value={lpProgress} className="h-2" />
        </div>

        {/* Win/Loss stats */}
        <div className="grid grid-cols-3 gap-2 rounded-lg bg-muted/50 p-3">
          <div className="text-center">
            <p className="text-lg font-bold text-success-muted-foreground">
              {data.current.wins}
            </p>
            <p className="text-xs text-muted-foreground">Victoires</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-danger-muted-foreground">
              {data.current.losses}
            </p>
            <p className="text-xs text-muted-foreground">Défaites</p>
          </div>
          <div className="text-center">
            <p
              className={`text-lg font-bold ${
                data.current.winRate >= 50
                  ? "text-success-muted-foreground"
                  : "text-danger-muted-foreground"
              }`}
            >
              {data.current.winRate.toFixed(1)}%
            </p>
            <p className="text-xs text-muted-foreground">Win Rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsTab({ user }: StatsTabProps) {
  const [rankedData, setRankedData] = useState<RankedData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasRiotAccount = user.riotPuuid && user.riotRegion;

  useEffect(() => {
    const fetchRankedData = async () => {
      if (!hasRiotAccount) return;

      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/summoners/${user.riotPuuid}/ranked?region=${user.riotRegion}`
        );

        const result = await response.json();

        if (response.ok && result.success) {
          setRankedData(result.data);
        } else {
          setError(result.error || "Erreur lors de la récupération du rang");
        }
      } catch (err) {
        setError("Erreur de connexion");
        console.error("Erreur:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRankedData();
  }, [user.riotPuuid, user.riotRegion, hasRiotAccount]);

  if (!hasRiotAccount) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <LinkIcon className="size-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Liez votre compte Riot Games
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            Pour voir vos statistiques et votre classement, liez votre compte
            League of Legends dans l'onglet Compte.
          </p>
          <Button variant="outline" asChild>
            <Link href="#account">Lier mon compte</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircleIcon className="size-10 text-destructive mb-3" />
          <p className="text-sm text-destructive">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <RankCard
          title="Solo/Duo"
          icon={SwordsIcon}
          data={rankedData?.solo ?? null}
          isLoading={isLoading}
        />
        <RankCard
          title="Flex"
          icon={UsersIcon}
          data={rankedData?.flex ?? null}
          isLoading={isLoading}
        />
      </div>

      {/* Link to full stats */}
      {user.leagueAccount?.riotGameName && user.riotRegion && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <TrophyIcon className="size-5 text-primary" />
              <div>
                <p className="font-medium">Voir toutes les statistiques</p>
                <p className="text-sm text-muted-foreground">
                  Historique des matchs, champions joués, et plus
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link
                href={`/summoners/${user.riotRegion}/${user.leagueAccount.riotGameName}-${user.leagueAccount.riotTagLine}`}
              >
                Voir le profil
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
