import { NextRequest, NextResponse } from "next/server";
import { REGION_TO_ROUTING } from "@/constants/regions";
import { z } from "zod";
import { createLogger } from "@/lib/logger";
import { getEnv } from "@/lib/env";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";

const logger = createLogger("riot-search-account");

const searchSchema = z.object({
  gameName: z.string().min(1, "Le nom de jeu est requis"),
  tagLine: z.string().min(1, "Le tag est requis"),
  region: z.string().min(1, "La région est requise"),
});

// Routing mapping centralisé dans constants/regions

export async function POST(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    // Vérifier que la clé API est configurée
    const RIOT_API_KEY = getEnv().RIOT_API_KEY;
    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { success: false, error: "Clé API Riot Games non configurée" },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Valider les données
    const validatedData = searchSchema.parse(body);

    // Vérifier que la région est valide
    const routing = REGION_TO_ROUTING[validatedData.region];
    if (!routing) {
      return NextResponse.json({ success: false, error: "Région invalide" }, { status: 400 });
    }

    // Encoder le nom de jeu et le tag pour l'URL
    const encodedGameName = encodeURIComponent(validatedData.gameName);
    const encodedTagLine = encodeURIComponent(validatedData.tagLine);

    // Appeler l'API Account pour obtenir le PUUID
    const accountResponse = await fetch(
      `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-riot-id/${encodedGameName}/${encodedTagLine}`,
      {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      }
    );

    if (!accountResponse.ok) {
      // Log internal error details server-side only
      const errorBody = await accountResponse.json().catch(() => ({}));
      logger.warn("Riot API error", { status: accountResponse.status, errorBody });

      if (accountResponse.status === 404) {
        return NextResponse.json(
          {
            success: false,
            error: "Compte non trouvé. Vérifiez le nom de jeu et le tag.",
          },
          { status: 404 }
        );
      }
      if (accountResponse.status === 401) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Clé API Riot invalide ou expirée. Veuillez la mettre à jour.",
          },
          { status: 401 }
        );
      }
      if (accountResponse.status === 403) {
        return NextResponse.json(
          {
            success: false,
            error:
              "Accès refusé. Vérifiez que votre clé API a les bonnes permissions.",
          },
          { status: 403 }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: `Erreur API Riot: ${accountResponse.status}`,
        },
        { status: accountResponse.status }
      );
    }

    const accountData = await accountResponse.json();

    // Retourner les données du compte
    return NextResponse.json(
      {
        success: true,
        data: {
          puuid: accountData.puuid,
          gameName: accountData.gameName,
          tagLine: accountData.tagLine,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: "Données invalides", details: error.errors },
        { status: 400 }
      );
    }

    logger.error("Erreur lors de la recherche du compte", error as Error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la recherche du compte" },
      { status: 500 }
    );
  }
}
