"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/profile-utils";
import { Loader2Icon } from "lucide-react";
import Image from "next/image";

interface ProfileInfoProps {
  user: {
    name: string | null;
    email: string;
    id: string;
    riotPuuid?: string | null;
    riotRegion?: string | null;
  } | null;
}

interface RiotAccountDetails {
  puuid: string;
  gameName: string;
  tagLine: string;
  summonerLevel: number | null;
  profileIconId: number | null;
  summonerId: string | null;
  accountId: string | null;
  revisionDate: number | null;
}

export function ProfileInfo({ user }: ProfileInfoProps) {
  const [riotDetails, setRiotDetails] = useState<RiotAccountDetails | null>(
    null
  );
  const [isLoadingRiot, setIsLoadingRiot] = useState(false);

  useEffect(() => {
    const fetchRiotDetails = async () => {
      if (!user?.riotPuuid || !user?.riotRegion) {
        return;
      }

      setIsLoadingRiot(true);

      try {
        const response = await fetch("/api/riot/get-account-details", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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

  const getProfileIconUrl = (iconId: number | null) => {
    if (!iconId) return null;
    const version = "15.21.1";
    return `https://ddragon.leagueoflegends.com/cdn/${version}/img/profileicon/${iconId}.png`;
  };

  const profileIconUrl = riotDetails?.profileIconId
    ? getProfileIconUrl(riotDetails.profileIconId)
    : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informations personnelles</CardTitle>
        <CardDescription>Gérez vos informations de profil</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          {isLoadingRiot ? (
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-muted">
                <Loader2Icon className="size-8 animate-spin text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          ) : profileIconUrl ? (
            <Image
              src={profileIconUrl}
              alt="Profile Icon"
              width={96}
              height={96}
              className="rounded-full border-2 border-primary"
            />
          ) : (
            <Avatar className="h-24 w-24">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user && getInitials(user.name, user.email)}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold">
              {riotDetails?.gameName && riotDetails.tagLine
                ? `${riotDetails.gameName}#${riotDetails.tagLine}`
                : user?.name || "Utilisateur"}
            </h2>
            <p className="text-muted-foreground">{user?.email}</p>
            {riotDetails?.summonerLevel && (
              <p className="text-sm text-muted-foreground">
                Niveau {riotDetails.summonerLevel}
              </p>
            )}
          </div>
        </div>

        <div className="grid gap-4 pt-4 border-t">
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Nom complet
            </label>
            <p className="text-sm mt-1">{user?.name || "Non renseigné"}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Email
            </label>
            <p className="text-sm mt-1">{user?.email}</p>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              ID Utilisateur
            </label>
            <p className="text-sm mt-1 font-mono">{user?.id}</p>
          </div>
          {riotDetails && (
            <>
              {riotDetails.summonerId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Summoner ID
                  </label>
                  <p className="text-sm mt-1 font-mono">
                    {riotDetails.summonerId}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  PUUID
                </label>
                <p className="text-sm mt-1 font-mono break-all">
                  {riotDetails.puuid}
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
