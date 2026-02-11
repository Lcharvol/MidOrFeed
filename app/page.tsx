"use client";

import { useApiSWR, STATIC_DATA_CONFIG, SEMI_DYNAMIC_CONFIG } from "@/lib/hooks/swr";
import { useChampionStats } from "@/lib/hooks/use-champion-stats";
import { useChampions } from "@/lib/hooks/use-champions";
import {
  HeroSection,
  TopChampionsSection,
  FreeRotationSection,
  LeaderboardSection,
  FeaturedGamesSection,
  FeaturesOverview,
  CTASection,
} from "./components/home";
import type { PublicStats, LeaderboardEntry, FeaturedGame } from "./components/home/types";

export default function Home() {
  const { data: statsData, isLoading: statsLoading } = useApiSWR<{
    success: boolean;
    data: PublicStats;
  }>("/api/stats", STATIC_DATA_CONFIG);

  const { championStats, isLoading: championsLoading, totalUniqueMatches } = useChampionStats();
  const topChampions = championStats.slice(0, 6);

  const { championKeyToIdMap, resolveName, isLoading: championsListLoading } = useChampions();

  const { data: rotationData, isLoading: rotationLoading } = useApiSWR<{
    success: boolean;
    data: { freeChampionIds: number[] };
  }>("/api/riot/rotation?region=euw1", STATIC_DATA_CONFIG);

  const freeChampionIds = rotationData?.data?.freeChampionIds ?? [];

  const { data: featuredData, isLoading: featuredLoading } = useApiSWR<{
    success: boolean;
    data: { games: FeaturedGame[] };
  }>("/api/riot/featured-games?region=euw1", SEMI_DYNAMIC_CONFIG);

  const featuredGames = featuredData?.data?.games ?? [];

  const { data: leaderboardData, isLoading: leaderboardLoading } = useApiSWR<{
    success: boolean;
    data: LeaderboardEntry[];
  }>("/api/leaderboard/list?region=euw1&tier=CHALLENGER&take=5", STATIC_DATA_CONFIG);

  const stats = statsData?.data;
  const leaderboard = leaderboardData?.data ?? [];

  return (
    <div className="flex flex-col">
      <HeroSection stats={stats} statsLoading={statsLoading} />
      <TopChampionsSection
        topChampions={topChampions}
        championsLoading={championsLoading}
        totalUniqueMatches={totalUniqueMatches}
      />
      <FreeRotationSection
        freeChampionIds={freeChampionIds}
        rotationLoading={rotationLoading}
        championsListLoading={championsListLoading}
        championKeyToIdMap={championKeyToIdMap}
        resolveName={resolveName}
      />
      <LeaderboardSection
        leaderboard={leaderboard}
        leaderboardLoading={leaderboardLoading}
      />
      <FeaturedGamesSection
        featuredGames={featuredGames}
        featuredLoading={featuredLoading}
        championKeyToIdMap={championKeyToIdMap}
      />
      <FeaturesOverview />
      <CTASection />
    </div>
  );
}
