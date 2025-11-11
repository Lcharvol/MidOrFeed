"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "@/lib/hooks/use-account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getProfileIconUrl } from "@/constants/ddragon";
import { Loader2Icon, RefreshCwIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePathname,
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TabsContent } from "@/components/ui/tabs";

export default function SummonerByIdLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const puuid = typeof params?.id === "string" ? params.id : undefined;
  const region = searchParams.get("region") || undefined;

  const [isUpdating, setIsUpdating] = useState(false);
  const [details, setDetails] = useState<{
    puuid: string;
    gameName?: string;
    tagLine?: string;
    summonerLevel?: number | null;
    profileIconId?: number | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const {
    account,
    isLoading: accLoading,
    refreshAccountAndMatches,
  } = useAccount(puuid);

  // Set details from DB cache-first
  useEffect(() => {
    if (!puuid) {
      setLoading(false);
      return;
    }
    if (accLoading) {
      setLoading(true);
      return;
    }
    if (account) {
      setDetails({
        puuid,
        gameName: account.riotGameName || undefined,
        tagLine: account.riotTagLine || undefined,
        summonerLevel: account.summonerLevel || null,
        profileIconId: account.profileIconId || null,
      });
    }
    setLoading(false);
  }, [puuid, accLoading, account]);

  // If region missing in URL but present in DB, propagate it once
  useEffect(() => {
    if (!puuid) return;
    if (region) return;
    const accRegion: string | undefined = account?.riotRegion;
    if (!accRegion) return;
    router.replace(
      `/summoners/${puuid}${
        pathname.endsWith("overview")
          ? "/overview"
          : pathname.endsWith("champions")
          ? "/champions"
          : pathname.endsWith("matches")
          ? "/matches"
          : pathname.endsWith("challenges")
          ? "/challenges"
          : ""
      }?region=${accRegion}`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puuid, region, account]);

  const profileIconUrl = useMemo(() => {
    if (!details?.profileIconId) return null;
    return getProfileIconUrl(details.profileIconId);
  }, [details]);

  const currentTab = useMemo(() => {
    if (pathname?.endsWith("/challenges")) return "challenges";
    if (pathname?.endsWith("/champions")) return "champions";
    if (pathname?.endsWith("/matches")) return "matches";
    return "overview";
  }, [pathname]);

  const handleUpdateProfile = async () => {
    if (!puuid || !region) return;
    setIsUpdating(true);
    try {
      const result = await refreshAccountAndMatches(region);
      if (!result.success) {
        toast.error(result.error ?? "Erreur lors de la mise à jour");
        return;
      }
      toast.success(
        `Profil mis à jour — ${result.matchesCollected} matchs collectés`
      );
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Une erreur est survenue");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between gap-6">
          <div className="flex items-center gap-6 flex-1">
            {loading ? (
              <Skeleton className="size-24 rounded-full" aria-busy="true" />
            ) : profileIconUrl ? (
              <Avatar className="size-24 border-4 border-primary/20">
                <AvatarImage src={profileIconUrl} alt="Profile" />
                <AvatarFallback>?</AvatarFallback>
              </Avatar>
            ) : (
              <Avatar className="size-24 border-4 border-primary/20">
                <AvatarFallback className="bg-linear-to-br from-primary to-primary/60 text-4xl">
                  {details?.gameName?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
            )}

            <div className="flex-1">
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-7 w-64" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ) : (
                <>
                  <h1 className="text-4xl font-bold mb-2">
                    {details?.gameName || puuid}
                    {details?.tagLine && (
                      <span className="text-muted-foreground">
                        #{details.tagLine}
                      </span>
                    )}
                  </h1>
                  {region && (
                    <Badge variant="outline" className="text-lg px-3 py-1">
                      {region.toUpperCase()}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          <div>
            {loading ? (
              <Skeleton className="h-9 w-36" />
            ) : (
              <Button
                onClick={handleUpdateProfile}
                disabled={isUpdating || !puuid || !region}
                variant="outline"
                size="sm"
              >
                {isUpdating ? (
                  <>
                    <Loader2Icon className="mr-2 size-4 animate-spin" />
                    Mise à jour...
                  </>
                ) : (
                  <>
                    <RefreshCwIcon className="mr-2 size-4" />
                    Mettre à jour
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="mb-6">
          <div className="flex gap-8">
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-28" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
      ) : (
        <Tabs
          value={currentTab}
          onValueChange={(value) => {
            const basePath = `/summoners/${puuid}/${value}`;
            const query = region ? `?region=${region}` : "";
            router.push(`${basePath}${query}`);
          }}
          className="mb-6"
        >
          <TabsList>
            <TabsTrigger value="overview">Vue d&apos;ensemble</TabsTrigger>
            <TabsTrigger value="champions">Champions</TabsTrigger>
            <TabsTrigger value="matches">Matchs</TabsTrigger>
            <TabsTrigger value="challenges">Défis</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            {children}
          </TabsContent>
          <TabsContent value="champions" className="mt-6">
            {children}
          </TabsContent>
          <TabsContent value="matches" className="mt-6">
            {children}
          </TabsContent>
          <TabsContent value="challenges" className="mt-6">
            {children}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
