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
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  HomeIcon,
  LayoutDashboardIcon,
  SwordsIcon,
  TrophyIcon,
  TargetIcon,
} from "lucide-react";
import Link from "next/link";
import {
  usePathname,
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function SummonerProfileLayout({
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
  } = useSummonerDetails(puuid, region);
  const { solo } = useSummonerRanked(puuid, region);
  const { ladderRank, topPercentage } = useLadderRank(solo);

  // If region missing in URL but present in DB, propagate it once
  useEffect(() => {
    if (!puuid) return;
    if (region) return;
    const accRegion: string | undefined = account?.riotRegion;
    if (!accRegion) return;
    const sub = pathname.endsWith("overview")
      ? "/overview"
      : pathname.endsWith("ranking")
      ? "/ranking"
      : pathname.endsWith("champions")
      ? "/champions"
      : pathname.endsWith("challenges")
      ? "/challenges"
      : "";
    router.replace(`/summoners/${puuid}${sub}?region=${accRegion}`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puuid, region, account]);

  const currentTab = useMemo(() => {
    if (pathname?.endsWith("/challenges")) return "challenges";
    if (pathname?.endsWith("/champions")) return "champions";
    if (pathname?.endsWith("/ranking")) return "ranking";
    return "overview";
  }, [pathname]);

  const handleUpdateProfile = async () => {
    if (!puuid || !region) return;
    setIsUpdating(true);
    try {
      const result = await refreshAccountAndMatches(region);
      if (!result.success) {
        // Handle auto-resolved PUUID: redirect to new profile
        if ("newPuuid" in result && result.newPuuid) {
          toast.info("PUUID mis à jour, redirection...");
          router.replace(`/summoners/${result.newPuuid}/overview?region=${region}`);
          return;
        }
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
    <div className="container mx-auto py-8 sm:py-12 px-4">
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/"><HomeIcon className="size-4" /></Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/summoners">Invocateurs</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{details?.gameName || "Profil"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="mb-10 space-y-4">
        <SummonerHeader
          loading={loading}
          details={details}
          profileIconUrl={profileIconUrl}
          region={region}
          ladderRank={ladderRank}
          topPercentage={topPercentage}
          soloTier={solo?.current.tier ?? null}
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
          <div className="flex gap-2">
            <Skeleton className="h-9 w-10 sm:w-32 rounded-md" />
            <Skeleton className="h-9 w-10 sm:w-28 rounded-md" />
            <Skeleton className="h-9 w-10 sm:w-28 rounded-md" />
            <Skeleton className="h-9 w-10 sm:w-20 rounded-md" />
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
            <TabsTrigger value="overview">
              <LayoutDashboardIcon className="size-4" />
              <span className="hidden sm:inline">Vue d&apos;ensemble</span>
            </TabsTrigger>
            <TabsTrigger value="ranking">
              <TrophyIcon className="size-4" />
              <span className="hidden sm:inline">Classement</span>
            </TabsTrigger>
            <TabsTrigger value="champions">
              <SwordsIcon className="size-4" />
              <span className="hidden sm:inline">Champions</span>
            </TabsTrigger>
            <TabsTrigger value="challenges">
              <TargetIcon className="size-4" />
              <span className="hidden sm:inline">Défis</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            {children}
          </TabsContent>
          <TabsContent value="ranking" className="mt-6">
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
