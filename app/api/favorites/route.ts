import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { requireCsrf } from "@/lib/csrf";
import { createLogger } from "@/lib/logger";
import { toError } from "@/lib/errors";

const logger = createLogger("favorites");

const addFavoriteSchema = z.object({
  puuid: z.string().min(1).max(78),
  region: z.string().min(1).max(10),
  gameName: z.string().max(100).nullish(),
  tagLine: z.string().max(10).nullish(),
  note: z.string().max(500).nullish(),
});

// GET /api/favorites - List all favorites for the current user
export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

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
      take: 200,
    });

    const puuids = favorites.map((f) => f.puuid);
    const accounts =
      puuids.length > 0
        ? await prisma.leagueOfLegendsAccount.findMany({
            where: { puuid: { in: puuids } },
            select: { puuid: true, profileIconId: true, summonerLevel: true },
          })
        : [];
    const accountMap = new Map(accounts.map((a) => [a.puuid, a]));

    const enriched = favorites.map((f) => ({
      ...f,
      profileIconId: accountMap.get(f.puuid)?.profileIconId ?? null,
      summonerLevel: accountMap.get(f.puuid)?.summonerLevel ?? null,
    }));

    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    logger.error("Error:", toError(error));
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add a player to favorites
export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

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
    const validation = addFavoriteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Données invalides", details: validation.error.errors },
        { status: 400 }
      );
    }

    const { puuid, region, gameName, tagLine, note } = validation.data;

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
    logger.error("Error:", toError(error));
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

// DELETE /api/favorites - Remove a player from favorites
export async function DELETE(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

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
    logger.error("Error:", toError(error));
    return NextResponse.json(
      { success: false, error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
