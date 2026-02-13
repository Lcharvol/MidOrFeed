import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { normalizeRole } from "@/lib/compositions/roles";
import { createLogger } from "@/lib/logger";
import { getPaginationParams, getSkip } from "@/lib/pagination";
import { toError } from "@/lib/errors";

const logger = createLogger("popular-compositions");

const parseChampionArray = (value?: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
  } catch {
    return [];
  }
};

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

  const { page, limit } = getPaginationParams(request);
  try {
    // Select only columns that exist in production (exclude new columns not yet migrated)
    const skip = getSkip(page, limit);
    const suggestions = await prisma.compositionSuggestion.findMany({
      where: { userId: null },
      select: {
        id: true,
        userId: true,
        teamChampions: true,
        enemyChampions: true,
        role: true,
        suggestedChampion: true,
        confidence: true,
        reasoning: true,
        gameMode: true,
        tier: true,
        createdAt: true,
        updatedAt: true,
        playstyle: true,
        strengths: true,
        weaknesses: true,
      },
      orderBy: [
        { confidence: "desc" },
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
      take: limit,
      skip,
    });

    const compositions = suggestions.map((suggestion, index) => {
      const normalizedRole = normalizeRole(suggestion.role) ?? "UTILITY";
      return {
        id: suggestion.id,
        rank: index + 1,
        role: normalizedRole,
        teamChampions: parseChampionArray(suggestion.teamChampions),
        enemyChampions: parseChampionArray(suggestion.enemyChampions),
        suggestedChampion: suggestion.suggestedChampion,
        confidence: suggestion.confidence ?? 0,
        reasoning: suggestion.reasoning,
        strengths: suggestion.strengths,
        weaknesses: suggestion.weaknesses,
        playstyle: suggestion.playstyle,
        gameMode: suggestion.gameMode,
        tier: suggestion.tier,
        updatedAt: suggestion.updatedAt.toISOString(),
      };
    });

    const latestUpdate = suggestions[0]?.updatedAt ?? null;

    return NextResponse.json({
      success: true,
      data: {
        compositions,
        total: suggestions.length,
        generatedAt: latestUpdate ? latestUpdate.toISOString() : null,
      },
    }, {
      headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" },
    });
  } catch (error) {
    logger.error("Error:", toError(error));
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de récupérer les compositions populaires",
      },
      { status: 500 }
    );
  }
}
