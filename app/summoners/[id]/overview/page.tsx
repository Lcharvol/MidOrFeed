"use client";

import { useMemo } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { LoadingState } from "./components/LoadingState";
import { ErrorState } from "./components/ErrorState";
import { EmptyStateCard } from "./components/EmptyStateCard";
import { StatsGrid } from "./components/StatsGrid";
import { TopChampionsSection } from "./components/TopChampionsSection";
import type { RecentMatchEntry } from "./components/RecentMatchesSection";
import { RankInfoSection } from "./components/RankInfoSection";
import { RecentGamesSummary } from "./components/RecentGamesSummary";
import { RecentMatchesList } from "./components/RecentMatchesList";
import { ProgressionCharts } from "./components/ProgressionCharts";
import { ChampionMasterySection } from "./components/ChampionMasterySection";
import { ChampionPoolAdvisor } from "./components/ChampionPoolAdvisor";
import { LiveGameBanner } from "./components/LiveGameBanner";
import { useSummonerOverview } from "@/lib/hooks/use-summoner-overview";

const SummonerOverviewByIdPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const puuid = typeof params?.id === "string" ? params.id : undefined;
  const region = searchParams.get("region") || null;
  const {
    overview,
    topChampions,
    rolePerformance,
    winRateValue,
    isLoading,
    error,
    championNameMap,
    championKeyToIdMap,
    resolveSlug,
    championStats,
  } = useSummonerOverview(puuid);

  const recentMatches = useMemo<RecentMatchEntry[]>(() => {
    if (!overview || !puuid) {
      return [];
    }

    const entries: RecentMatchEntry[] = [];

    for (const match of overview.matches.slice(0, 10)) {
      const participant = match.participants.find(
        (entry) => entry.participantPUuid === puuid
      );

      if (!participant) {
        continue;
      }

      // Extraire les items et autres données du participant
      const items = [
        (participant as { item0?: number | null }).item0 ?? null,
        (participant as { item1?: number | null }).item1 ?? null,
        (participant as { item2?: number | null }).item2 ?? null,
        (participant as { item3?: number | null }).item3 ?? null,
        (participant as { item4?: number | null }).item4 ?? null,
        (participant as { item5?: number | null }).item5 ?? null,
        (participant as { item6?: number | null }).item6 ?? null,
      ].filter((item) => item !== null && item !== 0);

      // Extraire tous les participants du match
      const allParticipants = match.participants.map((p) => ({
        participantId: p.participantId,
        participantPUuid: p.participantPUuid,
        teamId: p.teamId,
        championId: p.championId,
        championName: p.championName ?? null,
        riotIdGameName: (p as { riotIdGameName?: string | null }).riotIdGameName ?? null,
        riotIdTagline: (p as { riotIdTagline?: string | null }).riotIdTagline ?? null,
      }));

      entries.push({
        id: match.id,
        matchId: match.matchId,
        championId: participant.championId,
        championSlug: resolveSlug(participant.championId),
        championKey: participant.championId,
        queueId: match.queueId,
        gameCreation: match.gameCreation,
        gameDuration: match.gameDuration,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        win: Boolean(participant.win),
        items: items.length > 0 ? items : undefined,
        summoner1Id:
          (participant as { summoner1Id?: number | null }).summoner1Id ?? null,
        summoner2Id:
          (participant as { summoner2Id?: number | null }).summoner2Id ?? null,
        role: participant.role ?? null,
        lane: participant.lane ?? null,
        goldEarned: participant.goldEarned,
        visionScore: participant.visionScore,
        participant: participant as { [key: string]: unknown },
        teamId: participant.teamId,
        participants: allParticipants,
      });
    }

    return entries;
  }, [overview, puuid, resolveSlug]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState />;
  if (!overview || overview.stats.totalGames === 0) return <EmptyStateCard />;

  return (
    <div className="space-y-4">
      {/* Live Game Banner - shown when player is in game */}
      {puuid && region && <LiveGameBanner puuid={puuid} region={region} />}

      <StatsGrid
        stats={overview.stats}
        winRateValue={winRateValue}
        championStats={championStats}
        championNameMap={championNameMap}
        championKeyToId={championKeyToIdMap}
        resolveSlug={resolveSlug}
      />
      <div className="flex flex-col gap-4 lg:flex-row">
        <aside className="w-full space-y-4 lg:w-[350px] lg:shrink-0">
          <RankInfoSection puuid={puuid || ""} region={region} />
          <TopChampionsSection
            champions={topChampions}
            championIdToName={championNameMap}
            championKeyToId={championKeyToIdMap}
            resolveSlug={resolveSlug}
          />
          {puuid && region && <ChampionMasterySection puuid={puuid} region={region} />}
          {puuid && <ChampionPoolAdvisor puuid={puuid} />}
          {puuid && <ProgressionCharts puuid={puuid} />}
        </aside>
        <main className="flex-1 space-y-4 min-w-0">
          <RecentGamesSummary
            matches={recentMatches}
            championKeyToId={championKeyToIdMap}
            resolveSlug={resolveSlug}
            rolePerformance={rolePerformance}
          />
          <RecentMatchesList
            matches={recentMatches}
            championNameMap={championNameMap}
            championKeyToId={championKeyToIdMap}
            resolveSlug={resolveSlug}
            puuid={puuid}
          />
        </main>
      </div>
    </div>
  );
};

export default SummonerOverviewByIdPage;
