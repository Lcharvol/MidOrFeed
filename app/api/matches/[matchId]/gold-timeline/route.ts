import { NextRequest, NextResponse } from "next/server";
import { REGION_TO_ROUTING } from "@/constants/regions";
import { getEnv } from "@/lib/env";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { riotApiRequest } from "@/lib/riot-api";
import { CacheTTL } from "@/lib/cache";
import { createLogger } from "@/lib/logger";

const logger = createLogger("gold-timeline");

/** Map match ID prefix (e.g. "EUW1") → platform region (e.g. "euw1") */
const PLATFORM_PREFIX_TO_REGION: Record<string, string> = {
  EUW1: "euw1",
  EUN1: "eun1",
  TR1: "tr1",
  RU: "ru",
  NA1: "na1",
  LA1: "la1",
  LA2: "la2",
  BR1: "br1",
  KR: "kr",
  JP1: "jp1",
  OC1: "oc1",
  PH2: "ph2",
  SG2: "sg2",
  TH2: "th2",
  TW2: "tw2",
  VN2: "vn2",
};

interface ParticipantFrame {
  totalGold: number;
  currentGold: number;
  level: number;
  xp: number;
  minionsKilled: number;
  jungleMinionsKilled: number;
}

interface TimelineFrame {
  timestamp: number;
  participantFrames: Record<string, ParticipantFrame>;
}

interface RiotTimeline {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    frameInterval: number;
    frames: TimelineFrame[];
  };
}

interface GoldFrame {
  minute: number;
  blueGold: number;
  redGold: number;
  goldDiff: number;
}

/**
 * GET /api/matches/[matchId]/gold-timeline
 * Returns per-minute gold data for both teams from Riot timeline API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const env = getEnv();
    if (!env.RIOT_API_KEY) {
      throw new Error("RIOT_API_KEY est requis");
    }

    const { matchId } = await params;
    if (!matchId) {
      return NextResponse.json({ success: false, error: "matchId requis" }, { status: 400 });
    }

    // Extract routing region from match ID prefix (e.g. "EUW1_12345" → "europe")
    const underscoreIdx = matchId.indexOf("_");
    const prefix = underscoreIdx > 0 ? matchId.slice(0, underscoreIdx).toUpperCase() : "";
    const platformRegion = PLATFORM_PREFIX_TO_REGION[prefix];
    const routing = platformRegion ? REGION_TO_ROUTING[platformRegion] : null;

    if (!routing) {
      return NextResponse.json(
        { success: false, error: "Impossible de determiner la region depuis le matchId" },
        { status: 400 }
      );
    }

    const timelineResponse = await riotApiRequest<RiotTimeline>(
      `https://${routing}.api.riotgames.com/lol/match/v5/matches/${matchId}/timeline`,
      {
        region: routing,
        cacheKey: `riot:match-timeline:${matchId}`,
        cacheTTL: CacheTTL.VERY_LONG, // match data is immutable
      }
    );

    const frames = timelineResponse.data.info.frames;

    // Participants 1-5 = blue team, 6-10 = red team
    const goldFrames: GoldFrame[] = frames.map((frame) => {
      let blueGold = 0;
      let redGold = 0;

      for (const [id, pf] of Object.entries(frame.participantFrames)) {
        const participantId = parseInt(id, 10);
        if (participantId <= 5) {
          blueGold += pf.totalGold;
        } else {
          redGold += pf.totalGold;
        }
      }

      return {
        minute: Math.round(frame.timestamp / 60000),
        blueGold,
        redGold,
        goldDiff: blueGold - redGold,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: { matchId, frames: goldFrames },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Erreur gold-timeline", error as Error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération de la timeline",
        details: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.message : "Erreur inconnue") : undefined,
      },
      { status: 500 }
    );
  }
}
