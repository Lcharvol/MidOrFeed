"use client";

import Image from "next/image";
import {
  Card,
  CardContent,
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
import { useApiSWR, SEMI_DYNAMIC_CONFIG } from "@/lib/hooks/swr";
import { useI18n } from "@/lib/i18n-context";
import { getTierIconUrl } from "@/constants/ddragon";
import { cn } from "@/lib/utils";

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

const TIER_TEXT_COLOR: Record<string, string> = {
  IRON: "text-tier-iron",
  BRONZE: "text-tier-bronze",
  SILVER: "text-tier-silver",
  GOLD: "text-tier-gold",
  PLATINUM: "text-tier-platinum",
  EMERALD: "text-tier-emerald",
  DIAMOND: "text-tier-diamond",
  MASTER: "text-tier-master",
  GRANDMASTER: "text-tier-grandmaster",
  CHALLENGER: "text-tier-challenger",
};

const TIER_BG_COLOR: Record<string, string> = {
  IRON: "bg-tier-iron",
  BRONZE: "bg-tier-bronze",
  SILVER: "bg-tier-silver",
  GOLD: "bg-tier-gold",
  PLATINUM: "bg-tier-platinum",
  EMERALD: "bg-tier-emerald",
  DIAMOND: "bg-tier-diamond",
  MASTER: "bg-tier-master",
  GRANDMASTER: "bg-tier-grandmaster",
  CHALLENGER: "bg-tier-challenger",
};

const TIER_KEYS: Record<string, string> = {
  IRON: "tierIron",
  BRONZE: "tierBronze",
  SILVER: "tierSilver",
  GOLD: "tierGold",
  PLATINUM: "tierPlatinum",
  EMERALD: "tierEmerald",
  DIAMOND: "tierDiamond",
  MASTER: "tierMaster",
  GRANDMASTER: "tierGrandmaster",
  CHALLENGER: "tierChallenger",
};

function RankCard({
  title,
  icon: Icon,
  data,
  isLoading,
  t,
}: {
  title: string;
  icon: React.ElementType;
  data: RankData | null;
  isLoading: boolean;
  t: (key: string) => string;
}) {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center">
          <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center text-center">
          <Icon className="size-10 text-muted-foreground/50 mb-3" />
          <p className="text-sm text-muted-foreground">{t("profile.stats.unranked")}</p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            {t("profile.stats.unrankedMessage")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const { tier, rank } = data.current;
  const tierKey = TIER_KEYS[tier];
  const tierName = tierKey ? t(`ranking.${tierKey}`) : tier.charAt(0) + tier.slice(1).toLowerCase();
  const totalGames = data.current.wins + data.current.losses;
  const lpProgress = (data.current.lp / 100) * 100;

  const bestTierKey = TIER_KEYS[data.best.tier];
  const bestTierName = bestTierKey
    ? t(`ranking.${bestTierKey}`)
    : data.best.tier.charAt(0) + data.best.tier.slice(1).toLowerCase();

  return (
    <Card className="overflow-hidden">
      <div className={cn("h-1.5", TIER_BG_COLOR[tier] || "bg-muted")} />
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="size-4 text-primary" />
            {title}
          </CardTitle>
          <Badge variant="outline" className="font-mono text-xs">
            {totalGames} {t("profile.stats.games")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Rank display */}
        <div className="flex items-center gap-4">
          <Image
            src={getTierIconUrl(tier, rank, "medals")}
            alt={tierName}
            width={64}
            height={64}
            className="shrink-0"
            unoptimized
          />
          <div className="flex-1">
            <p className={cn("text-lg font-bold", TIER_TEXT_COLOR[tier])}>
              {tierName} {rank}
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
            <p className="text-xs text-muted-foreground">{t("profile.stats.victories")}</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-danger-muted-foreground">
              {data.current.losses}
            </p>
            <p className="text-xs text-muted-foreground">{t("profile.stats.defeats")}</p>
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
            <p className="text-xs text-muted-foreground">{t("profile.stats.winRate")}</p>
          </div>
        </div>

        {/* Best rank */}
        {data.best && (
          <div className="flex items-center justify-between border-t border-border/50 pt-3">
            <div className="flex items-center gap-2">
              <Image
                src={getTierIconUrl(data.best.tier, data.best.rank, "medals_mini")}
                alt={bestTierName}
                width={40}
                height={40}
                unoptimized
              />
              <div>
                <p className={cn("text-sm font-bold", TIER_TEXT_COLOR[data.best.tier])}>
                  {bestTierName} {data.best.rank}
                </p>
                <p className="text-[10px] text-muted-foreground">{data.best.lp} LP</p>
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground">{t("profile.stats.bestRank")}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function StatsTab({ user }: StatsTabProps) {
  const { t } = useI18n();
  const hasRiotAccount = user.riotPuuid && user.riotRegion;

  const { data: response, isLoading, error } = useApiSWR<{
    success: boolean;
    data: RankedData;
    error?: string;
  }>(
    hasRiotAccount
      ? `/api/summoners/${user.riotPuuid}/ranked?region=${user.riotRegion}`
      : null,
    SEMI_DYNAMIC_CONFIG
  );

  const rankedData = response?.data ?? null;

  if (!hasRiotAccount) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center text-center">
          <LinkIcon className="size-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            {t("profile.stats.linkRiotTitle")}
          </h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">
            {t("profile.stats.linkRiotDescription")}
          </p>
          <Button variant="outline" asChild>
            <Link href="#account">{t("profile.stats.linkAccount")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex flex-col items-center justify-center text-center">
          <AlertCircleIcon className="size-10 text-destructive mb-3" />
          <p className="text-sm text-destructive">
            {error instanceof Error ? error.message : t("profile.stats.connectionError")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <RankCard
          title={t("profile.stats.soloDuo")}
          icon={SwordsIcon}
          data={rankedData?.solo ?? null}
          isLoading={isLoading}
          t={t}
        />
        <RankCard
          title={t("profile.stats.flex")}
          icon={UsersIcon}
          data={rankedData?.flex ?? null}
          isLoading={isLoading}
          t={t}
        />
      </div>

      {/* Link to full stats */}
      {user.leagueAccount?.riotGameName && user.riotRegion && (
        <Card>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrophyIcon className="size-5 text-primary" />
              <div>
                <p className="font-medium">{t("profile.stats.viewAllStats")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("profile.stats.viewAllStatsDescription")}
                </p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link
                href={`/summoners/${user.riotRegion}/${user.leagueAccount.riotGameName}-${user.leagueAccount.riotTagLine}`}
              >
                {t("profile.stats.viewProfile")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
