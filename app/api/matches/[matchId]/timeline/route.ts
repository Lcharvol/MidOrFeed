import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";

const logger = createLogger("matches");

interface TeamStats {
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  damage: number;
  vision: number;
}

interface ParticipantTimeline {
  participantId: number;
  championId: string;
  teamId: number;
  puuid: string | null;
  kills: number;
  deaths: number;
  assists: number;
  gold: number;
  damage: number;
  vision: number;
  items: number[];
  win: boolean;
  role: string | null;
}

interface TimelineData {
  matchId: string;
  gameDuration: number;
  gameMode: string;
  queueId: number;
  blueTeam: {
    participants: ParticipantTimeline[];
    stats: TeamStats;
    won: boolean;
  };
  redTeam: {
    participants: ParticipantTimeline[];
    stats: TeamStats;
    won: boolean;
  };
  phases: {
    early: { start: number; end: number; description: string };
    mid: { start: number; end: number; description: string };
    late: { start: number; end: number; description: string };
  };
}

/**
 * GET /api/matches/[matchId]/timeline
 * Returns match data structured for timeline visualization
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;

    if (!matchId) {
      return NextResponse.json(
        { success: false, error: "matchId parameter required" },
        { status: 400 }
      );
    }

    // Fetch match with participants
    const match = await prisma.match.findUnique({
      where: { matchId },
      include: {
        participants: {
          orderBy: [{ teamId: "asc" }, { participantId: "asc" }],
        },
      },
    });

    if (!match) {
      return NextResponse.json(
        { success: false, error: "Match not found" },
        { status: 404 }
      );
    }

    // Separate participants by team
    const blueParticipants = match.participants.filter((p) => p.teamId === 100);
    const redParticipants = match.participants.filter((p) => p.teamId === 200);

    // Calculate team stats
    const calculateTeamStats = (
      participants: typeof match.participants
    ): TeamStats => ({
      kills: participants.reduce((sum, p) => sum + p.kills, 0),
      deaths: participants.reduce((sum, p) => sum + p.deaths, 0),
      assists: participants.reduce((sum, p) => sum + p.assists, 0),
      gold: participants.reduce((sum, p) => sum + p.goldEarned, 0),
      damage: participants.reduce(
        (sum, p) => sum + p.totalDamageDealtToChampions,
        0
      ),
      vision: participants.reduce((sum, p) => sum + p.visionScore, 0),
    });

    // Transform participant data
    const transformParticipant = (
      p: (typeof match.participants)[0]
    ): ParticipantTimeline => ({
      participantId: p.participantId,
      championId: p.championId,
      teamId: p.teamId,
      puuid: p.participantPUuid,
      kills: p.kills,
      deaths: p.deaths,
      assists: p.assists,
      gold: p.goldEarned,
      damage: p.totalDamageDealtToChampions,
      vision: p.visionScore,
      items: [p.item0, p.item1, p.item2, p.item3, p.item4, p.item5, p.item6]
        .filter((i): i is number => i !== null && i > 0),
      win: p.win,
      role: p.role,
    });

    // Determine game phases based on duration
    const durationMinutes = Math.floor(match.gameDuration / 60);
    const phases = {
      early: {
        start: 0,
        end: Math.min(15, durationMinutes),
        description: "Laning phase",
      },
      mid: {
        start: Math.min(15, durationMinutes),
        end: Math.min(25, durationMinutes),
        description: "Mid game",
      },
      late: {
        start: Math.min(25, durationMinutes),
        end: durationMinutes,
        description: "Late game",
      },
    };

    const blueWon = blueParticipants.some((p) => p.win);
    const redWon = redParticipants.some((p) => p.win);

    const timelineData: TimelineData = {
      matchId: match.matchId,
      gameDuration: match.gameDuration,
      gameMode: match.gameMode,
      queueId: match.queueId,
      blueTeam: {
        participants: blueParticipants.map(transformParticipant),
        stats: calculateTeamStats(blueParticipants),
        won: blueWon,
      },
      redTeam: {
        participants: redParticipants.map(transformParticipant),
        stats: calculateTeamStats(redParticipants),
        won: redWon,
      },
      phases,
    };

    return NextResponse.json({
      success: true,
      data: timelineData,
    });
  } catch (error) {
    logger.error("Error fetching match timeline", error as Error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch match timeline" },
      { status: 500 }
    );
  }
}
