import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ShardedLeagueAccounts } from "@/lib/prisma-sharded-accounts";
import { readAndValidateBody } from "@/lib/request-validation";

const saveRiotAccountSchema = z.object({
  gameName: z.string().min(1, "Le nom de jeu est requis"),
  tagLine: z.string().min(1, "Le tag est requis"),
  puuid: z.string().optional().default(""),
  region: z.string().min(1, "La région est requise"),
});

export async function POST(request: NextRequest) {
  try {
    // Lire et valider la taille du body
    const body = await readAndValidateBody(request);

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
      // Utiliser ShardedLeagueAccounts pour upsert dans la bonne table
      const upserted = await ShardedLeagueAccounts.upsert({
        puuid: validatedData.puuid,
        riotRegion: validatedData.region,
        riotGameName: validatedData.gameName,
        riotTagLine: validatedData.tagLine,
      });
      leagueAccount = {
        id: upserted.id,
        puuid: upserted.puuid,
        riotRegion: upserted.riotRegion,
        riotGameName: upserted.riotGameName,
        riotTagLine: upserted.riotTagLine,
        profileIconId: upserted.profileIconId ?? null,
      };
    } else {
      // Pas de PUUID: chercher dans la table shardée de la région
      const accounts = await ShardedLeagueAccounts.findManyByPuuids(
        [],
        validatedData.region
      );
      // Note: findManyByPuuids ne peut pas chercher par gameName/tagLine
      // On doit chercher dans toutes les régions ou utiliser une autre approche
      // Pour l'instant, on retourne une erreur si PUUID manquant
      return NextResponse.json(
        { error: "PUUID requis pour créer ou trouver un compte" },
        { status: 400 }
      );
    }

    if (!leagueAccount) {
      return NextResponse.json(
        { error: "Aucun compte League of Legends déterminé" },
        { status: 400 }
      );
    }

    // Mettre à jour l'utilisateur avec l'ID du compte
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        leagueAccountId: leagueAccount.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Note: On ne peut plus utiliser include: { leagueAccount: true } avec les tables shardées
    // On retourne directement les données du compte qu'on a déjà
    return NextResponse.json(
      {
        message: "Compte Riot sauvegardé avec succès",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          leagueAccount: leagueAccount
            ? {
                id: leagueAccount.id,
                puuid: leagueAccount.puuid,
                riotRegion: leagueAccount.riotRegion,
                riotGameName: leagueAccount.riotGameName,
                riotTagLine: leagueAccount.riotTagLine,
                profileIconId: leagueAccount.profileIconId,
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
