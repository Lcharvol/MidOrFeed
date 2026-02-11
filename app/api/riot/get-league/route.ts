import { NextResponse } from "next/server";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

const logger = createLogger("riot-get-league");

const getLeagueSchema = z.object({
  summonerId: z.string().min(1, "Summoner ID est requis"),
  region: z.string().min(1, "Région est requise"),
  puuid: z.string().optional(),
});

// Clé API Riot Games depuis les variables d'environnement
const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Mapping des régions vers les endpoints League
const REGION_TO_BASE_URL: Record<string, string> = {
  euw1: "https://euw1.api.riotgames.com",
  eun1: "https://eun1.api.riotgames.com",
  tr1: "https://tr1.api.riotgames.com",
  ru: "https://ru.api.riotgames.com",
  na1: "https://na1.api.riotgames.com",
  la1: "https://la1.api.riotgames.com",
  la2: "https://la2.api.riotgames.com",
  br1: "https://br1.api.riotgames.com",
  kr: "https://kr.api.riotgames.com",
  jp1: "https://jp1.api.riotgames.com",
  oc1: "https://oc1.api.riotgames.com",
  ph2: "https://ph2.api.riotgames.com",
  sg2: "https://sg2.api.riotgames.com",
  th2: "https://th2.api.riotgames.com",
  tw2: "https://tw2.api.riotgames.com",
  vn2: "https://vn2.api.riotgames.com",
};

async function fetchLeagueEntries(baseUrl: string, summonerId: string) {
  return fetch(
    `${baseUrl}/lol/league/v4/entries/by-summoner/${summonerId}`,
    { headers: { "X-Riot-Token": RIOT_API_KEY! } }
  );
}

async function fetchFreshSummonerId(baseUrl: string, puuid: string): Promise<string | null> {
  const response = await fetch(
    `${baseUrl}/lol/summoner/v4/summoners/by-puuid/${puuid}`,
    { headers: { "X-Riot-Token": RIOT_API_KEY! } }
  );
  if (!response.ok) return null;
  const data = await response.json();
  return data.id ?? null;
}

export async function POST(request: Request) {
  try {
    // Vérifier que la clé API est configurée
    if (!RIOT_API_KEY) {
      return NextResponse.json(
        { error: "Clé API Riot Games non configurée" },
        { status: 500 }
      );
    }

    const body = await request.json();

    // Valider les données
    const validatedData = getLeagueSchema.parse(body);

    // Vérifier que la région est valide
    const baseUrl = REGION_TO_BASE_URL[validatedData.region];

    if (!baseUrl) {
      return NextResponse.json({ error: "Région invalide" }, { status: 400 });
    }

    // Appeler l'API League pour obtenir les rangs
    let leagueResponse = await fetchLeagueEntries(baseUrl, validatedData.summonerId);

    // Si 400 (stale encrypted summonerId) et qu'on a un puuid, re-fetch un ID frais
    if (leagueResponse.status === 400 && validatedData.puuid) {
      logger.warn("Stale summonerId detected, re-fetching from PUUID", {
        puuid: validatedData.puuid,
      });
      const freshId = await fetchFreshSummonerId(baseUrl, validatedData.puuid);
      if (freshId) {
        leagueResponse = await fetchLeagueEntries(baseUrl, freshId);
      }
    }

    if (!leagueResponse.ok) {
      if (leagueResponse.status === 404) {
        return NextResponse.json(
          {
            success: true,
            data: [], // Pas de classement = joueur non classé
          },
          { status: 200 }
        );
      }
      if (leagueResponse.status === 401) {
        return NextResponse.json(
          {
            error:
              "Clé API Riot invalide ou expirée. Veuillez la mettre à jour.",
          },
          { status: 401 }
        );
      }
      if (leagueResponse.status === 403) {
        return NextResponse.json(
          {
            error:
              "Accès refusé. Vérifiez que votre clé API a les bonnes permissions.",
          },
          { status: 403 }
        );
      }
      const errorBody = await leagueResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: `Erreur API Riot: ${leagueResponse.status}`,
          details: errorBody,
        },
        { status: leagueResponse.status }
      );
    }

    const leagueData = await leagueResponse.json();

    // Retourner les données de classement
    return NextResponse.json(
      {
        success: true,
        data: leagueData || [],
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

    logger.error("Erreur lors de la récupération du classement", error as Error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du classement" },
      { status: 500 }
    );
  }
}
