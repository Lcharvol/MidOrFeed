import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAuth } from "@/lib/auth-utils";

// GET /api/favorites - List all favorites for the current user
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: "Non autorise" },
        { status: 401 }
      );
    }

    const favorites = await prisma.favoritePlayer.findMany({
      where: { userId: authResult.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, data: favorites });
  } catch (error) {
    console.error("[FAVORITES] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add a player to favorites
export async function POST(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: "Non autorise" },
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
          userId: authResult.user.id,
          puuid,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Deja dans les favoris" },
        { status: 409 }
      );
    }

    const favorite = await prisma.favoritePlayer.create({
      data: {
        userId: authResult.user.id,
        puuid,
        region,
        gameName: gameName || null,
        tagLine: tagLine || null,
        note: note || null,
      },
    });

    return NextResponse.json({ success: true, data: favorite }, { status: 201 });
  } catch (error) {
    console.error("[FAVORITES] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - Remove a player from favorites
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await verifyAuth(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { success: false, error: "Non autorise" },
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
          userId: authResult.user.id,
          puuid,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[FAVORITES] Error:", error);
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
