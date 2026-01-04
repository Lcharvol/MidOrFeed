import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ShardedLeagueAccounts } from "@/lib/prisma-sharded-accounts";
import { readAndValidateBody } from "@/lib/request-validation";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { requireCsrf } from "@/lib/csrf";
import {
  getRequestContext,
  handleZodError,
  handleApiError,
  errorResponse,
} from "@/lib/api-helpers";

const createSaveRiotAccountSchema = (t: (key: string) => string) =>
  z.object({
    gameName: z.string().min(1, t("profile.gameNameRequired") ?? "Le nom de jeu est requis"),
    tagLine: z.string().min(1, t("profile.tagLineRequired") ?? "Le tag est requis"),
    puuid: z.string().optional().default(""),
    region: z.string().min(1, t("profile.regionRequired") ?? "La région est requise"),
  });

export async function POST(request: NextRequest) {
  // CSRF validation
  const csrfError = await requireCsrf(request);
  if (csrfError) return csrfError;

  // Récupérer le contexte de la requête une seule fois
  const { t } = getRequestContext(request);

  try {
    // Vérifier l'authentification via JWT
    const authUser = await getAuthenticatedUser(request);

    if (!authUser) {
      return errorResponse("Utilisateur non authentifié", 401);
    }

    // Lire et valider la taille du body
    const body = await readAndValidateBody(request);

    // Créer le schéma avec les traductions
    const saveRiotAccountSchema = createSaveRiotAccountSchema(t);

    // Valider les données
    const validatedData = saveRiotAccountSchema.parse(body);

    // Vérifier que l'utilisateur existe
    const user = await prisma.user.findUnique({
      where: { id: authUser.id },
      select: { id: true },
    });

    if (!user) {
      return errorResponse("Utilisateur non trouvé", 404);
    }

    // Vérifier que le PUUID est fourni (requis pour les tables shardées)
    if (!validatedData.puuid) {
      return errorResponse("PUUID requis pour créer ou trouver un compte", 400);
    }

    // Créer ou mettre à jour le compte League of Legends via ShardedLeagueAccounts
    const upserted = await ShardedLeagueAccounts.upsert({
      puuid: validatedData.puuid,
      riotRegion: validatedData.region,
      riotGameName: validatedData.gameName,
      riotTagLine: validatedData.tagLine,
    });

    const leagueAccount = {
      id: upserted.id,
      puuid: upserted.puuid,
      riotRegion: upserted.riotRegion,
      riotGameName: upserted.riotGameName,
      riotTagLine: upserted.riotTagLine,
      profileIconId: upserted.profileIconId ?? null,
    };

    // Mettre à jour l'utilisateur avec l'ID du compte, puuid et région
    const updatedUser = await prisma.user.update({
      where: { id: authUser.id },
      data: {
        leagueAccountId: leagueAccount.id,
        riotPuuid: leagueAccount.puuid,
        riotRegion: leagueAccount.riotRegion,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    // Retourner les données du compte
    return NextResponse.json(
      {
        message: "Compte Riot sauvegardé avec succès",
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          // Include riotPuuid and riotRegion directly for easier access
          riotPuuid: leagueAccount.puuid,
          riotRegion: leagueAccount.riotRegion,
          leagueAccount: {
            id: leagueAccount.id,
            puuid: leagueAccount.puuid,
            riotRegion: leagueAccount.riotRegion,
            riotGameName: leagueAccount.riotGameName,
            riotTagLine: leagueAccount.riotTagLine,
            profileIconId: leagueAccount.profileIconId,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return handleZodError(error);
    }
    return handleApiError(error, "Sauvegarde du compte Riot", "database");
  }
}
