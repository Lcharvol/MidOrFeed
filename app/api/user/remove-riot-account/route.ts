import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prismaWithTimeout } from "@/lib/timeout";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { errorResponse, handleApiError } from "@/lib/api-helpers";

export async function DELETE(request: NextRequest) {
  try {
    // Vérifier l'authentification via JWT
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return errorResponse("Utilisateur non authentifié", 401);
    }

    // Vérifier que l'utilisateur existe (avec timeout)
    const user = await prismaWithTimeout(
      () =>
        prisma.user.findUnique({
          where: { id: authUser.id },
          select: { id: true, leagueAccountId: true },
        }),
      10000
    );

    if (!user) {
      return errorResponse("Utilisateur non trouvé", 404);
    }

    // Supprimer l'association du compte League of Legends, puuid et région
    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        leagueAccountId: null,
        riotPuuid: null,
        riotRegion: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        leagueAccount: {
          select: {
            id: true,
            puuid: true,
            riotRegion: true,
            riotGameName: true,
            riotTagLine: true,
            profileIconId: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: "Association au compte League of Legends supprimée",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          leagueAccount: null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    return handleApiError(error, "Suppression de l'association au compte Riot", "database");
  }
}

