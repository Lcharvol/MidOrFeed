import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ShardedLeagueAccounts } from "@/lib/prisma-sharded-accounts";
import { REGION_TO_ROUTING, REGION_TO_BASE_URL, PLATFORM_TO_REGION } from "@/constants/regions";
import { createLogger } from "@/lib/logger";

const logger = createLogger("league-accounts-get-by-puuid");

const schema = z.object({
  puuid: z.string().min(1),
  region: z.string().optional(),
  autoFetch: z.boolean().optional().default(true),
});

const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Try to find a region for a puuid from existing match data
async function findRegionFromMatches(puuid: string): Promise<string | null> {
  const participant = await prisma.matchParticipant.findFirst({
    where: { participantPUuid: puuid },
    include: { match: { select: { platformId: true, region: true } } },
  });

  if (participant?.match) {
    // Try region first, then platformId
    if (participant.match.region) {
      return participant.match.region.toLowerCase();
    }
    if (participant.match.platformId) {
      const mapped = PLATFORM_TO_REGION[participant.match.platformId.toLowerCase()];
      if (mapped) return mapped;
    }
  }

  return null;
}

// Fetch account from Riot API and save to DB
async function fetchFromRiotAndSave(
  puuid: string,
  region: string
): Promise<{
  success: boolean;
  data?: {
    id: string;
    puuid: string;
    riotRegion: string;
    riotGameName: string | null;
    riotTagLine: string | null;
    profileIconId: number | null;
    summonerLevel: number | null;
  };
  error?: string;
}> {
  if (!RIOT_API_KEY) {
    return { success: false, error: "API key not configured" };
  }

  const normalizedRegion = region.toLowerCase();
  const routing = REGION_TO_ROUTING[normalizedRegion];
  const baseUrl = REGION_TO_BASE_URL[normalizedRegion];

  if (!routing || !baseUrl) {
    return { success: false, error: "Invalid region" };
  }

  try {
    // Fetch account data from Riot API
    const accountResponse = await fetch(
      `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${puuid}`,
      { headers: { "X-Riot-Token": RIOT_API_KEY } }
    );

    if (!accountResponse.ok) {
      if (accountResponse.status === 404) {
        return { success: false, error: "Account not found on Riot API" };
      }
      return { success: false, error: `Riot API error: ${accountResponse.status}` };
    }

    const accountData = await accountResponse.json();

    // Fetch summoner data for additional details
    const summonerResponse = await fetch(
      `${baseUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`,
      { headers: { "X-Riot-Token": RIOT_API_KEY } }
    );

    let summonerData = null;
    if (summonerResponse.ok) {
      summonerData = await summonerResponse.json();
    }

    // Save to database
    const saved = await ShardedLeagueAccounts.upsert({
      puuid,
      riotRegion: normalizedRegion,
      riotGameName: accountData.gameName ?? null,
      riotTagLine: accountData.tagLine ?? null,
      summonerLevel: summonerData?.summonerLevel ?? null,
      profileIconId: summonerData?.profileIconId ?? null,
      riotSummonerId: summonerData?.id ?? null,
      riotAccountId: summonerData?.accountId ?? null,
      revisionDate: summonerData?.revisionDate
        ? BigInt(summonerData.revisionDate)
        : null,
    });

    return {
      success: true,
      data: {
        id: saved.id,
        puuid: saved.puuid,
        riotRegion: saved.riotRegion,
        riotGameName: saved.riotGameName,
        riotTagLine: saved.riotTagLine,
        profileIconId: saved.profileIconId,
        summonerLevel: saved.summonerLevel,
      },
    };
  } catch (error) {
    logger.error("Riot fetch error", error as Error);
    return { success: false, error: "Failed to fetch from Riot API" };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { puuid, region, autoFetch } = schema.parse(body);

    // 1. Try to find in database first
    const account = await ShardedLeagueAccounts.findUniqueByPuuidGlobal(puuid);

    if (account) {
      return NextResponse.json(
        {
          success: true,
          data: {
            id: account.id,
            puuid: account.puuid,
            riotRegion: account.riotRegion,
            riotGameName: account.riotGameName,
            riotTagLine: account.riotTagLine,
            profileIconId: account.profileIconId,
            summonerLevel: account.summonerLevel,
          },
        },
        { status: 200 }
      );
    }

    // 2. Account not found - try to auto-fetch from Riot API if enabled
    if (!autoFetch) {
      return NextResponse.json(
        { error: "Compte introuvable", needsRegion: !region },
        { status: 404 }
      );
    }

    // 3. Determine region: use provided region or try to find from match data
    let targetRegion = region?.toLowerCase();

    if (!targetRegion) {
      targetRegion = await findRegionFromMatches(puuid) ?? undefined;
    }

    if (!targetRegion) {
      return NextResponse.json(
        {
          error: "Compte introuvable",
          needsRegion: true,
          message: "Region required to fetch new account",
        },
        { status: 404 }
      );
    }

    // 4. Fetch from Riot API and save
    const result = await fetchFromRiotAndSave(puuid, targetRegion);

    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error || "Failed to fetch account" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: result.data,
        autoFetched: true,
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }
    logger.error("Error", error as Error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
