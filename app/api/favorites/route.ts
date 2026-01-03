import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { requireCsrf } from "@/lib/csrf";
import { createLogger } from "@/lib/logger";

const logger = createLogger("favorites");

// GET /api/favorites - List all favorites for the current user
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 401 }
      );
    }

    const favorites = await prisma.favoritePlayer.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: favorites });
  } catch (error) {
    logger.error("Error:", error as Error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add a player to favorites
export async function POST(request: NextRequest) {
  // CSRF validation
  const csrfError = await requireCsrf(request);
  if (csrfError) return csrfError;

  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { puuid, region, gameName, tagLine, note } = body;

    if (!puuid || !region) {
      return NextResponse.json(
        { success: false, error: "puuid et region requis" },
        { status: 400 }
      );
    }

    // Check if already favorited
    const existing = await prisma.favoritePlayer.findUnique({
      where: {
        userId_puuid: {
          userId: user.id,
          puuid,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Déjà dans les favoris" },
        { status: 409 }
      );
    }

    const favorite = await prisma.favoritePlayer.create({
      data: {
        userId: user.id,
        puuid,
        region,
        gameName: gameName || null,
        tagLine: tagLine || null,
        note: note || null,
      },
    });

    return NextResponse.json({ success: true, data: favorite }, { status: 201 });
  } catch (error) {
    logger.error("Error:", error as Error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - Remove a player from favorites
export async function DELETE(request: NextRequest) {
  // CSRF validation
  const csrfError = await requireCsrf(request);
  if (csrfError) return csrfError;

  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const puuid = searchParams.get("puuid");

    if (!puuid) {
      return NextResponse.json(
        { success: false, error: "puuid requis" },
        { status: 400 }
      );
    }

    await prisma.favoritePlayer.delete({
      where: {
        userId_puuid: {
          userId: user.id,
          puuid,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error:", error as Error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
