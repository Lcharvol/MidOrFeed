import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeRole } from "@/lib/compositions/roles";

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
  const url = new URL(request.url);
  const perPageParam = Number(url.searchParams.get("limit"));
  const limit =
    Number.isFinite(perPageParam) && perPageParam > 0
      ? Math.min(Math.floor(perPageParam), 50)
      : 20;
  try {
    const suggestions = await prisma.compositionSuggestion.findMany({
      where: { userId: null },
      orderBy: [
        { confidence: "desc" },
        { updatedAt: "desc" },
        { createdAt: "desc" },
      ],
    });

    const compositions = suggestions.slice(0, limit).map((suggestion, index) => {
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
    });
  } catch (error) {
    console.error("[POPULAR-COMPOSITIONS] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Impossible de récupérer les compositions populaires",
      },
      { status: 500 }
    );
  }
}
