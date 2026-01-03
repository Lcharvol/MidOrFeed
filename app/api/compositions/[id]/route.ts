import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { createLogger } from "@/lib/logger";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { requireCsrf } from "@/lib/csrf";

const compositionsLogger = createLogger("compositions");

/**
 * DELETE /api/compositions/[id] - Supprimer une composition
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // CSRF validation
  const csrfError = await requireCsrf(request);
  if (csrfError) return csrfError;

  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const { id } = await params;

    // Vérifier que la composition existe et appartient à l'utilisateur
    const composition = await prisma.composition.findUnique({
      where: { id },
    });

    if (!composition) {
      return NextResponse.json({ error: "Composition non trouvée" }, { status: 404 });
    }

    if (composition.userId !== authUser.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await prisma.composition.delete({
      where: { id },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Composition supprimée",
      },
      { status: 200 }
    );
  } catch (error) {
    compositionsLogger.error("Erreur lors de la suppression de la composition", error as Error);
    return NextResponse.json(
      { error: "Erreur lors de la suppression de la composition" },
      { status: 500 }
    );
  }
}

