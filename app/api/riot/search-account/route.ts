import { NextResponse } from "next/server";
import { z } from "zod";

const searchSchema = z.object({
  summonerName: z.string().min(1, "Le nom d'invocateur est requis"),
  region: z.string().min(1, "La région est requise"),
});

// Clé API Riot Games depuis les variables d'environnement
const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Mapping des régions vers leurs routing regions pour l'API Summoner
const REGION_TO_BASE_URL: Record<string, string> = {
  // Europe
  euw1: "https://euw1.api.riotgames.com",
  eun1: "https://eun1.api.riotgames.com",
  tr1: "https://tr1.api.riotgames.com",
  ru: "https://ru.api.riotgames.com",
  // Americas
  na1: "https://na1.api.riotgames.com",
  la1: "https://la1.api.riotgames.com",
  la2: "https://la2.api.riotgames.com",
  br1: "https://br1.api.riotgames.com",
  // Asia
  kr: "https://kr.api.riotgames.com",
  jp1: "https://jp1.api.riotgames.com",
  oc1: "https://oc1.api.riotgames.com",
  ph2: "https://ph2.api.riotgames.com",
  sg2: "https://sg2.api.riotgames.com",
  th2: "https://th2.api.riotgames.com",
  tw2: "https://tw2.api.riotgames.com",
  vn2: "https://vn2.api.riotgames.com",
};

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
    const validatedData = searchSchema.parse(body);

    // Vérifier que la région est valide
    const baseUrl = REGION_TO_BASE_URL[validatedData.region];
    if (!baseUrl) {
      return NextResponse.json({ error: "Région invalide" }, { status: 400 });
    }

    // Encoder le nom d'invocateur pour l'URL
    const encodedSummonerName = encodeURIComponent(validatedData.summonerName);

    // Appeler l'API Summoner pour obtenir le PUUID
    const summonerResponse = await fetch(
      `${baseUrl}/lol/summoner/v4/summoners/by-name/${encodedSummonerName}`,
      {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      }
    );

    if (!summonerResponse.ok) {
      if (summonerResponse.status === 404) {
        return NextResponse.json(
          { error: "Invocateur non trouvé. Vérifiez le nom et la région." },
          { status: 404 }
        );
      }
      throw new Error(`Erreur API Riot: ${summonerResponse.status}`);
    }

    const summonerData = await summonerResponse.json();

    // Retourner les données du compte
    return NextResponse.json(
      {
        success: true,
        data: {
          puuid: summonerData.puuid,
          summonerId: summonerData.id,
          accountId: summonerData.accountId,
          profileIconId: summonerData.profileIconId,
          summonerLevel: summonerData.summonerLevel,
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

    console.error("Erreur lors de la recherche du compte:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche du compte" },
      { status: 500 }
    );
  }
}
