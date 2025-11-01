import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const saveRiotAccountSchema = z.object({
  gameName: z.string().min(1, "Le nom de jeu est requis"),
  tagLine: z.string().nullable().optional(),
  puuid: z.string().optional().default(""),
  summonerId: z.string().optional(),
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
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour l'utilisateur avec les informations Riot
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        riotGameName: validatedData.gameName,
        riotTagLine: validatedData.tagLine || null,
        riotPuuid: validatedData.puuid || null,
        riotSummonerId: validatedData.summonerId || null,
        riotRegion: validatedData.region,
      } as any,
    });

    return NextResponse.json(
      {
        message: "Compte Riot sauvegardé avec succès",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          riotGameName: (updatedUser as any).riotGameName,
          riotTagLine: (updatedUser as any).riotTagLine,
          riotPuuid: (updatedUser as any).riotPuuid,
          riotSummonerId: (updatedUser as any).riotSummonerId,
          riotRegion: (updatedUser as any).riotRegion,
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
