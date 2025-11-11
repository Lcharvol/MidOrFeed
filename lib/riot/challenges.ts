import { REGION_TO_BASE_URL, REGION_TO_ROUTING } from "@/constants/regions";

const DEFAULT_REGION = "euw1";

const buildRegionalBaseUrl = (region: string) => {
  const normalized = region.toLowerCase();
  return REGION_TO_BASE_URL[normalized] ?? REGION_TO_BASE_URL[DEFAULT_REGION];
};

const buildRoutingHostname = (region: string) => {
  const normalized = region.toLowerCase();
  return REGION_TO_ROUTING[normalized] ?? REGION_TO_ROUTING[DEFAULT_REGION];
};

export type RiotChallengeConfig = {
  id: number;
  name: string;
  description?: string;
  shortDescription?: string;
  category?: string;
  level?: string;
  tags?: string[];
  thresholds?: Record<string, number>;
  maxValue?: number;
};

export type RiotPlayerChallenge = {
  challengeId: number;
  value?: number;
  level?: string;
  highestLevel?: string;
  percentile?: number;
  achievedTime?: string | number;
  nextLevel?: number;
  progress?: number;
  pointsEarned?: number;
  completedObjectives?: string[];
};

export type RiotPlayerChallengeData = {
  totalPoints: Record<string, unknown>;
  challenges: RiotPlayerChallenge[];
};

const fetchJson = async <T>(url: string, apiKey: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      "X-Riot-Token": apiKey,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Riot API ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
};

export const fetchChallengeConfig = async (
  apiKey: string,
  region: string = DEFAULT_REGION
): Promise<RiotChallengeConfig[]> => {
  const routing = buildRoutingHostname(region);
  const url = `https://${routing}.api.riotgames.com/lol/challenges/v1/config`;
  const data = await fetchJson<any[]>(url, apiKey);

  return data.map((item) => {
    const localizedNames =
      item.localizedNames?.["fr_FR"] || item.localizedNames?.["en_US"] || {};
    return {
      id: item.id as number,
      name:
        (localizedNames.name as string) ?? item.name ?? `Challenge ${item.id}`,
      description: localizedNames.description as string | undefined,
      shortDescription: localizedNames.shortDescription as string | undefined,
      category: item.category as string | undefined,
      level: item.level as string | undefined,
      tags: Array.isArray(item.tags) ? (item.tags as string[]) : undefined,
      thresholds: item.thresholds as Record<string, number> | undefined,
      maxValue: typeof item.maxValue === "number" ? item.maxValue : undefined,
    } satisfies RiotChallengeConfig;
  });
};

export const fetchPlayerChallenges = async (
  apiKey: string,
  region: string,
  puuid: string
): Promise<RiotPlayerChallengeData> => {
  const baseUrl = buildRegionalBaseUrl(region);
  const url = `${baseUrl}/lol/challenges/v1/player-data/${puuid}`;
  const data = await fetchJson<any>(url, apiKey);

  const challenges = Array.isArray(data.challenges) ? data.challenges : [];

  return {
    totalPoints: data.totalPoints ?? {},
    challenges: challenges.map((entry: any) => ({
      challengeId: entry.challengeId,
      value: entry.value,
      level: entry.level,
      highestLevel: entry.highestLevel,
      percentile: entry.percentile,
      achievedTime: entry.achievedTime ?? entry.achievedDate,
      nextLevel: entry.nextLevel,
      progress: entry.progress,
      pointsEarned: entry.pointsEarned,
      completedObjectives: entry.completedObjectives,
    })),
  } satisfies RiotPlayerChallengeData;
};
