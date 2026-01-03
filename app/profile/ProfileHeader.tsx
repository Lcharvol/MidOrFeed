"use client";

import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getInitials } from "@/lib/profile-utils";
import { Loader2Icon, CrownIcon, SparklesIcon, ZapIcon } from "lucide-react";
import Image from "next/image";
import { DDRAGON_VERSION, getProfileIconUrl } from "@/constants/ddragon";

interface User {
  id: string;
  email: string;
  name: string | null;
  role?: string;
  subscriptionTier?: string;
  subscriptionExpiresAt?: string | null;
  dailyAnalysesUsed?: number;
  riotPuuid?: string | null;
  riotRegion?: string | null;
  leagueAccount?: {
    profileIconId?: number | null;
    riotGameName?: string | null;
    riotTagLine?: string | null;
  } | null;
}

interface RiotAccountDetails {
  gameName: string;
  tagLine: string;
  summonerLevel: number | null;
  profileIconId: number | null;
}

interface ProfileHeaderProps {
  user: User;
}

const FREE_DAILY_LIMIT = 3;

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const [riotDetails, setRiotDetails] = useState<RiotAccountDetails | null>(null);
  const [isLoadingRiot, setIsLoadingRiot] = useState(false);

  useEffect(() => {
    const fetchRiotDetails = async () => {
      if (!user?.riotPuuid || !user?.riotRegion) return;

      setIsLoadingRiot(true);
      try {
        const response = await fetch("/api/riot/get-account-details", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            puuid: user.riotPuuid,
            region: user.riotRegion,
          }),
        });

        const result = await response.json();
        if (response.ok && result.data) {
          setRiotDetails(result.data);
        }
      } catch (error) {
        console.error("Erreur:", error);
      } finally {
        setIsLoadingRiot(false);
      }
    };

    fetchRiotDetails();
  }, [user?.riotPuuid, user?.riotRegion]);

  const profileIconId =
    riotDetails?.profileIconId ?? user.leagueAccount?.profileIconId;
  const profileIconUrl = profileIconId
    ? getProfileIconUrl(profileIconId, DDRAGON_VERSION)
    : null;

  const displayName =
    riotDetails?.gameName && riotDetails.tagLine
      ? `${riotDetails.gameName}#${riotDetails.tagLine}`
      : user.leagueAccount?.riotGameName && user.leagueAccount?.riotTagLine
      ? `${user.leagueAccount.riotGameName}#${user.leagueAccount.riotTagLine}`
      : user.name || "Utilisateur";

  const isPremium =
    user.subscriptionTier === "premium" &&
    user.subscriptionExpiresAt &&
    new Date(user.subscriptionExpiresAt) > new Date();

  const isAdmin = user.role === "admin";

  const dailyUsed = user.dailyAnalysesUsed ?? 0;
  const dailyLimit = isPremium ? Infinity : FREE_DAILY_LIMIT;
  const dailyRemaining = isPremium ? Infinity : Math.max(0, dailyLimit - dailyUsed);
  const dailyProgress = isPremium ? 100 : (dailyUsed / FREE_DAILY_LIMIT) * 100;

  return (
    <div className="relative overflow-hidden rounded-xl border bg-gradient-to-br from-card via-card to-primary/5">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -right-20 -top-20 size-40 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-10 -left-10 size-32 rounded-full bg-primary/5 blur-2xl" />
      </div>

      <div className="relative p-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            {isLoadingRiot ? (
              <Avatar className="size-20 sm:size-24 ring-4 ring-primary/20">
                <AvatarFallback className="bg-muted">
                  <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
            ) : profileIconUrl ? (
              <div className="relative">
                <Image
                  src={profileIconUrl}
                  alt="Profile Icon"
                  width={96}
                  height={96}
                  className="size-20 sm:size-24 rounded-full ring-4 ring-primary/20"
                />
                {riotDetails?.summonerLevel && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-background px-2 py-0.5 text-xs font-bold shadow-lg border">
                    {riotDetails.summonerLevel}
                  </div>
                )}
              </div>
            ) : (
              <Avatar className="size-20 sm:size-24 ring-4 ring-primary/20">
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                  {getInitials(user.name, user.email)}
                </AvatarFallback>
              </Avatar>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold sm:text-3xl">{displayName}</h1>
              {isAdmin && (
                <Badge variant="destructive" className="gap-1">
                  <CrownIcon className="size-3" />
                  Admin
                </Badge>
              )}
              {isPremium ? (
                <Badge className="gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
                  <SparklesIcon className="size-3" />
                  Premium
                </Badge>
              ) : (
                <Badge variant="outline" className="gap-1">
                  Free
                </Badge>
              )}
            </div>

            <p className="text-muted-foreground">{user.email}</p>

            {/* Daily analyses */}
            {!isPremium && (
              <div className="max-w-xs space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <ZapIcon className="size-3.5" />
                    Analyses quotidiennes
                  </span>
                  <span className="font-medium">
                    {dailyRemaining}/{FREE_DAILY_LIMIT}
                  </span>
                </div>
                <Progress
                  value={100 - dailyProgress}
                  className="h-2"
                  indicatorClassName={
                    dailyRemaining === 0
                      ? "bg-destructive"
                      : dailyRemaining === 1
                      ? "bg-warning"
                      : "bg-primary"
                  }
                />
              </div>
            )}

            {isPremium && user.subscriptionExpiresAt && (
              <p className="text-sm text-muted-foreground">
                Premium jusqu'au{" "}
                {new Date(user.subscriptionExpiresAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
