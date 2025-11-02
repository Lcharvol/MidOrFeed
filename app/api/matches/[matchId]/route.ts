import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Route API pour obtenir les détails complets d'un match
 * GET /api/matches/[matchId]
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const { matchId } = await params;
  try {
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: {
        participants: true,
      },
    });

    if (!match) {
      return NextResponse.json(
        {
          success: false,
          error: "Match non trouvé",
        },
        { status: 404 }
      );
    }

    // Convertir les BigInt en strings pour la sérialisation JSON
    const serializedMatch = {
      ...match,
      gameCreation: match.gameCreation.toString(),
    };

    return NextResponse.json(
      {
        success: true,
        data: serializedMatch,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la récupération du match:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération du match",
      },
      { status: 500 }
    );
  }
}
