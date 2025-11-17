import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(request: Request) {
  try {
    // Récupérer l'utilisateur depuis les headers
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "Utilisateur non authentifié" },
        { status: 401 }
      );
    }

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, leagueAccountId: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer l'association du compte League of Legends
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        leagueAccountId: null,
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
    console.error(
      "Erreur lors de la suppression de l'association au compte Riot:",
      error
    );
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'association" },
      { status: 500 }
    );
  }
}

