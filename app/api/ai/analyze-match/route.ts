import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  analyzeMatch,
  incrementDailyAnalysisCount,
  canUserAnalyze,
} from "@/lib/ai/match-analysis";
import { verifyToken } from "@/lib/jwt";
import { createLogger } from "@/lib/logger";
import { handleApiError, errorResponse } from "@/lib/api-helpers";

const logger = createLogger("ai-analyze-match");

const analyzeMatchSchema = z.object({
  matchId: z.string().min(1, "matchId est requis"),
  participantPuuid: z.string().min(1, "participantPuuid est requis"),
});

// POST /api/ai/analyze-match
export async function POST(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Non authentifié", 401);
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload?.userId) {
      return errorResponse("Token invalide", 401);
    }

    const userId = payload.userId;

    // Vérifier si l'utilisateur peut analyser
    const { canAnalyze, remaining, isPremium } = await canUserAnalyze(userId);

    if (!canAnalyze) {
      return NextResponse.json(
        {
          success: false,
          error: "Limite d'analyses quotidiennes atteinte",
          remaining: 0,
          isPremium: false,
        },
        { status: 429 }
      );
    }

    // Parser et valider le body
    const body = await request.json();
    const validation = analyzeMatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Données invalides",
          details: validation.error.errors,
        },
        { status: 400 }
      );
    }

    const { matchId, participantPuuid } = validation.data;

    logger.info("Démarrage analyse de match", {
      userId,
      matchId,
      participantPuuid,
    });

    // Incrémenter le compteur AVANT l'analyse (pour éviter les abus)
    const { remaining: newRemaining } = await incrementDailyAnalysisCount(userId);

    // Effectuer l'analyse
    const analysis = await analyzeMatch({
      matchId,
      participantPuuid,
    });

    logger.info("Analyse de match terminée", {
      userId,
      matchId,
      score: analysis.overall.score,
    });

    return NextResponse.json({
      success: true,
      data: analysis,
      remaining: isPremium ? Infinity : newRemaining,
      isPremium,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("non trouvé")) {
        return errorResponse(error.message, 404);
      }
    }
    return handleApiError(error, "Erreur lors de l'analyse du match", "api");
  }
}

// GET /api/ai/analyze-match - Vérifier le quota
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse("Non authentifié", 401);
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload?.userId) {
      return errorResponse("Token invalide", 401);
    }

    const { canAnalyze, remaining, isPremium } = await canUserAnalyze(
      payload.userId
    );

    return NextResponse.json({
      success: true,
      canAnalyze,
      remaining,
      isPremium,
    });
  } catch (error) {
    return handleApiError(error, "Erreur lors de la vérification du quota", "api");
  }
}
