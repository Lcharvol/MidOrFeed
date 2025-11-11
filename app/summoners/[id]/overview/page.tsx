"use client";

import { useParams } from "next/navigation";
import { LoadingState } from "./components/LoadingState";
import { ErrorState } from "./components/ErrorState";
import { EmptyStateCard } from "./components/EmptyStateCard";
import { StatsGrid } from "./components/StatsGrid";
import { InsightsSection } from "./components/InsightsSection";
import { TopChampionsSection } from "./components/TopChampionsSection";
import { RolePerformanceSection } from "./components/RolePerformanceSection";
import { useSummonerOverview } from "@/lib/hooks/use-summoner-overview";

const SummonerOverviewByIdPage = () => {
  const params = useParams();
  const puuid = typeof params?.id === "string" ? params.id : undefined;
  const {
    overview,
    topChampions,
    rolePerformance,
    aiInsights,
    winRateValue,
    isLoading,
    error,
    championNameMap,
    championKeyToIdMap,
    resolveSlug,
  } = useSummonerOverview(puuid);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;
  if (!overview || overview.stats.totalGames === 0) return <EmptyStateCard />;

  return (
    <div className="space-y-6">
      <StatsGrid stats={overview.stats} winRateValue={winRateValue} />
      <InsightsSection insights={aiInsights} />
      <TopChampionsSection
        champions={topChampions}
        championIdToName={championNameMap}
        championKeyToId={championKeyToIdMap}
        resolveSlug={resolveSlug}
      />
      <RolePerformanceSection entries={rolePerformance} />
    </div>
  );
};

export default SummonerOverviewByIdPage;
