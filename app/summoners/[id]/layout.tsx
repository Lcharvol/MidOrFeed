"use client";

import { useEffect, useMemo, useState } from "react";
import { useSummonerRanked } from "@/lib/hooks/use-summoner-ranked";
import { useSummonerDetails } from "./hooks/useSummonerDetails";
import { useLadderRank } from "./hooks/useLadderRank";
import { SummonerHeader } from "./components/SummonerHeader";
import { RiotConnectionBanner } from "./components/RiotConnectionBanner";
import { SummonerActions } from "./components/SummonerActions";
import { Skeleton } from "@/components/ui/skeleton";
import {
  usePathname,
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

  const {
    details,
    loading,
    account,
    profileIconUrl,
    refreshAccountAndMatches,
  } = useSummonerDetails(puuid);
  const { solo } = useSummonerRanked(puuid, region);
  const { ladderRank, topPercentage } = useLadderRank(solo);

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
          : pathname.endsWith("challenges")
          ? "/challenges"
          : ""
      }?region=${accRegion}`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puuid, region, account]);

  const currentTab = useMemo(() => {
    if (pathname?.endsWith("/challenges")) return "challenges";
    if (pathname?.endsWith("/champions")) return "champions";
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
    } catch (e) {
      console.error(e);
      toast.error("Une erreur est survenue");
    } finally {
      setIsUpdating(false);
    }
  };

  const hasConnectedAccount = Boolean(
    account?.riotGameName && account?.riotTagLine
  );

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8 space-y-4">
        <SummonerHeader
          loading={loading}
          details={details}
          profileIconUrl={profileIconUrl}
          region={region}
          ladderRank={ladderRank}
          topPercentage={topPercentage}
        />

        <RiotConnectionBanner hasConnectedAccount={hasConnectedAccount} />

        <SummonerActions
          isUpdating={isUpdating}
          puuid={puuid}
          region={region}
          onUpdate={handleUpdateProfile}
        />
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
            <TabsTrigger value="challenges">Défis</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            {children}
          </TabsContent>
          <TabsContent value="champions" className="mt-6">
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
