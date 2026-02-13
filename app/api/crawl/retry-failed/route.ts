import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { logger } from "@/lib/logger";

/**
 * POST /api/crawl/retry-failed
 * Remet tous les discoveredPlayer en statut failed -> pending
 */
export async function POST(request: NextRequest) {
  const authError = await requireAdmin(request);
  if (authError) return authError;
  try {
    const { count } = await prisma.discoveredPlayer.updateMany({
      where: { crawlStatus: "failed" },
      data: { crawlStatus: "pending" },
    });

    return NextResponse.json(
      {
        success: true,
        message: `Réinitialisé ${count} joueurs en failed vers pending`,
        data: { playersReset: count },
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error("Erreur lors du retry des joueurs failed", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: "Erreur lors de la réinitialisation des joueurs failed" },
      { status: 500 }
    );
  }
}
