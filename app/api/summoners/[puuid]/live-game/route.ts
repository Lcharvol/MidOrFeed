import { NextRequest, NextResponse } from "next/server";
import { REGION_TO_BASE_URL } from "@/constants/regions";
import { getEnv } from "@/lib/env";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { measureTiming } from "@/lib/metrics";
import { riotApiRequest } from "@/lib/riot-api";
import { CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";

type Params = {
  puuid: string;
};

interface RiotBannedChampion {
  championId: number;
  teamId: number;
  pickTurn: number;
}

interface RiotCurrentGameParticipant {
  puuid: string;
  teamId: number;
  championId: number;
  profileIconId: number;
  bot: boolean;
  summonerId: string;
  gameCustomizationObjects: Array<{
    category: string;
    content: string;
  }>;
  perks: {
    perkIds: number[];
    perkStyle: number;
    perkSubStyle: number;
  };
  spell1Id: number;
  spell2Id: number;
  riotId: string;
}

interface RiotCurrentGameInfo {
  gameId: number;
  gameType: string;
  gameStartTime: number;
  mapId: number;
  gameLength: number;
  platformId: string;
  gameMode: string;
  bannedChampions: RiotBannedChampion[];
  gameQueueConfigId: number;
  observers: {
    encryptionKey: string;
  };
  participants: RiotCurrentGameParticipant[];
}

interface LiveGameResponse {
  success: boolean;
  inGame: boolean;
  data: {
    gameId: number;
    gameMode: string;
    gameType: string;
    gameLength: number;
    gameStartTime: string;
    mapId: number;
    queueId: number;
    participants: Array<{
      puuid: string;
      riotId: string;
      teamId: number;
      championId: number;
      spell1Id: number;
      spell2Id: number;
      isCurrentPlayer: boolean;
    }>;
    bannedChampions: Array<{
      championId: number;
      teamId: number;
    }>;
    observerKey: string;
  } | null;
}

const GAME_MODE_LABELS: Record<string, string> = {
  CLASSIC: "Classique",
  ARAM: "ARAM",
  URF: "URF",
  ONEFORALL: "One for All",
  ASCENSION: "Ascension",
  FIRSTBLOOD: "First Blood",
  KINGPORO: "Poro King",
  SIEGE: "Nexus Siege",
  ASSASSINATE: "Blood Hunt",
  ARSR: "All Random Summoner's Rift",
  DARKSTAR: "Dark Star",
  STARGUARDIAN: "Star Guardian",
  PROJECT: "PROJECT",
  GAMEMODEX: "Nexus Blitz",
  DOOMBOTSTEEMO: "Doom Bots",
  PRACTICETOOL: "Practice Tool",
  ULTBOOK: "Ultimate Spellbook",
  CHERRY: "Arena",
  TUTORIAL: "Tutoriel",
};

const QUEUE_LABELS: Record<number, string> = {
  420: "Solo/Duo",
  440: "Flex 5v5",
  450: "ARAM",
  400: "Draft Normal",
  430: "Blind Normal",
  700: "Clash",
  830: "Co-op vs AI (Intro)",
  840: "Co-op vs AI (Beginner)",
  850: "Co-op vs AI (Intermediate)",
  900: "URF",
  1020: "One for All",
  1300: "Nexus Blitz",
  1400: "Ultimate Spellbook",
  1700: "Arena",
  1900: "URF",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  let puuid = "";
  try {
    const env = getEnv();
    if (!env.RIOT_API_KEY) {
      throw new Error("RIOT_API_KEY est requis");
    }

    const resolvedParams = await params;
    puuid = resolvedParams.puuid || "";

    if (!puuid) {
      return NextResponse.json({ error: "PUUID requis" }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const region = searchParams.get("region");

    if (!region) {
      return NextResponse.json({ error: "Region requise" }, { status: 400 });
    }

    const normalizedRegion = region.toLowerCase();
    const baseUrl = REGION_TO_BASE_URL[normalizedRegion];

    if (!baseUrl) {
      return NextResponse.json({ error: "Region invalide" }, { status: 400 });
    }

    // Fetch current game info (spectator-v5)
    const gameResponse = await measureTiming(
      "api.riot.spectator.activeGame",
      () =>
        riotApiRequest<RiotCurrentGameInfo>(
          `${baseUrl}/lol/spectator/v5/active-games/by-summoner/${puuid}`,
          {
            region: normalizedRegion,
            cacheKey: `riot:spectator:${puuid}:${normalizedRegion}`,
            cacheTTL: CacheTTL.SHORT, // 1 minute - live data
          }
        ),
      { region: normalizedRegion }
    );

    const gameData = gameResponse.data;

    const response: LiveGameResponse = {
      success: true,
      inGame: true,
      data: {
        gameId: gameData.gameId,
        gameMode: GAME_MODE_LABELS[gameData.gameMode] || gameData.gameMode,
        gameType: QUEUE_LABELS[gameData.gameQueueConfigId] || gameData.gameType,
        gameLength: gameData.gameLength,
        gameStartTime: new Date(gameData.gameStartTime).toISOString(),
        mapId: gameData.mapId,
        queueId: gameData.gameQueueConfigId,
        participants: gameData.participants.map((p) => ({
          puuid: p.puuid,
          riotId: p.riotId,
          teamId: p.teamId,
          championId: p.championId,
          spell1Id: p.spell1Id,
          spell2Id: p.spell2Id,
          isCurrentPlayer: p.puuid === puuid,
        })),
        bannedChampions: gameData.bannedChampions.map((b) => ({
          championId: b.championId,
          teamId: b.teamId,
        })),
        observerKey: gameData.observers.encryptionKey,
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // 404 means player is not in a game - this is normal
    if (error instanceof Error && error.message.includes("404")) {
      const response: LiveGameResponse = {
        success: true,
        inGame: false,
        data: null,
      };
      return NextResponse.json(response, { status: 200 });
    }

    const spectatorLogger = createLogger("spectator");
    spectatorLogger.error("Erreur lors de la recuperation de la partie en cours", error as Error, {
      puuid,
    });
    return NextResponse.json(
      {
        error: "Erreur lors de la recuperation de la partie en cours",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
