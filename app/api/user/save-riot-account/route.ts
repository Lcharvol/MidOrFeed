import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const saveRiotAccountSchema = z.object({
  gameName: z.string().min(1, "Le nom de jeu est requis"),
  tagLine: z.string().min(1, "Le tag est requis"),
  puuid: z.string().optional().default(""),
  region: z.string().min(1, "La région est requise"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Valider les données
    const validatedData = saveRiotAccountSchema.parse(body);

    // TODO: Récupérer l'utilisateur depuis la session
    // Pour l'instant, on va utiliser un userId mocké depuis les headers
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
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Créer ou mettre à jour le compte League of Legends et lier à l'utilisateur
    let leagueAccount = null as null | {
      id: string;
      puuid: string;
      riotRegion: string;
      riotGameName: string | null;
      riotTagLine: string | null;
      profileIconId: number | null;
    };

    if (validatedData.puuid) {
      const upserted = await prisma.leagueOfLegendsAccount.upsert({
        where: { puuid: validatedData.puuid },
        update: {
          riotRegion: validatedData.region,
          riotGameName: validatedData.gameName,
          riotTagLine: validatedData.tagLine,
        },
        create: {
          puuid: validatedData.puuid,
          riotRegion: validatedData.region,
          riotGameName: validatedData.gameName,
          riotTagLine: validatedData.tagLine,
        },
      });
      leagueAccount = upserted as any;
    } else {
      // Pas de PUUID: tenter de trouver par (gameName, tagLine, region)
      const existing = await prisma.leagueOfLegendsAccount.findFirst({
        where: {
          riotGameName: validatedData.gameName,
          riotTagLine: validatedData.tagLine,
          riotRegion: validatedData.region,
        },
      });
      if (!existing) {
        return NextResponse.json(
          { error: "PUUID manquant et aucun compte correspondant trouvé" },
          { status: 400 }
        );
      }
      leagueAccount = existing as any;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        leagueAccountId: leagueAccount.id,
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
        message: "Compte Riot sauvegardé avec succès",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          leagueAccount: updatedUser.leagueAccount
            ? {
                id: updatedUser.leagueAccount.id,
                puuid: updatedUser.leagueAccount.puuid,
                riotRegion: updatedUser.leagueAccount.riotRegion,
                riotGameName: updatedUser.leagueAccount.riotGameName,
                riotTagLine: updatedUser.leagueAccount.riotTagLine,
                profileIconId: updatedUser.leagueAccount.profileIconId,
              }
            : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Erreur lors de la sauvegarde du compte Riot:", error);
    return NextResponse.json(
      { error: "Erreur lors de la sauvegarde du compte Riot" },
      { status: 500 }
    );
  }
}
