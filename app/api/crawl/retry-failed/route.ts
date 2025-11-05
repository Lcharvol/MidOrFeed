import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/crawl/retry-failed
 * Remet tous les discoveredPlayer en statut failed -> pending
 */
export async function POST() {
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
    console.error("[CRAWL/RETRY_FAILED] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la réinitialisation des joueurs failed" },
      { status: 500 }
    );
  }
}
