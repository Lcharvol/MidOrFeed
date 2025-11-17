import useSWR from "swr";
import { apiKeys } from "@/lib/api/keys";
import { z } from "zod";

const rankedResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    solo: z
      .object({
        current: z.object({
          tier: z.string(),
          rank: z.string(),
          lp: z.number(),
          wins: z.number(),
          losses: z.number(),
          winRate: z.number(),
        }),
        best: z.object({
          tier: z.string(),
          rank: z.string(),
          lp: z.number(),
        }),
        seasonHistory: z.array(
          z.object({
            season: z.string(),
            tier: z.string(),
            rank: z.string(),
            lp: z.number(),
          })
        ),
      })
      .nullable(),
    flex: z
      .object({
        current: z.object({
          tier: z.string(),
          rank: z.string(),
          lp: z.number(),
          wins: z.number(),
          losses: z.number(),
          winRate: z.number(),
        }),
        best: z.object({
          tier: z.string(),
          rank: z.string(),
          lp: z.number(),
        }),
        seasonHistory: z.array(
          z.object({
            season: z.string(),
            tier: z.string(),
            rank: z.string(),
            lp: z.number(),
          })
        ),
      })
      .nullable(),
  }),
});

type RankedResponse = z.infer<typeof rankedResponseSchema>;

const fetcher = async (url: string): Promise<RankedResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Erreur lors de la récupération du classement`);
  }
  const data = await response.json();
  return rankedResponseSchema.parse(data);
};

export const useSummonerRanked = (
  puuid: string | undefined,
  region: string | null | undefined
) => {
  const key =
    puuid && region ? apiKeys.summonerRanked(puuid, region) : null;

  const { data, error, isLoading, mutate } = useSWR<RankedResponse>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 1 minute
    }
  );

  return {
    solo: data?.data.solo ?? null,
    flex: data?.data.flex ?? null,
    isLoading,
    error,
    mutate,
  };
};

