import { NextResponse } from "next/server";
import { z } from "zod";

const getAccountDetailsSchema = z.object({
  puuid: z.string().min(1, "PUUID est requis"),
  region: z.string().min(1, "Région est requise"),
});

// Clé API Riot Games depuis les variables d'environnement
const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Mapping des régions vers leurs routing regions pour l'API Account
const REGION_TO_ROUTING: Record<string, string> = {
  // Europe
  euw1: "europe",
  eun1: "europe",
  tr1: "europe",
  ru: "europe",
  // Americas
  na1: "americas",
  la1: "americas",
  la2: "americas",
  br1: "americas",
  // Asia
  kr: "asia",
  jp1: "asia",
  oc1: "asia",
  ph2: "asia",
  sg2: "asia",
  th2: "asia",
  tw2: "asia",
  vn2: "asia",
};

// Mapping des régions vers les endpoints Summoner
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
    const validatedData = getAccountDetailsSchema.parse(body);

    // Vérifier que la région est valide
    const routing = REGION_TO_ROUTING[validatedData.region];
    const baseUrl = REGION_TO_BASE_URL[validatedData.region];

    if (!routing || !baseUrl) {
      return NextResponse.json({ error: "Région invalide" }, { status: 400 });
    }

    // Appeler l'API Account pour obtenir le Riot ID
    const accountResponse = await fetch(
      `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${validatedData.puuid}`,
      {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      }
    );

    if (!accountResponse.ok) {
      if (accountResponse.status === 404) {
        return NextResponse.json(
          {
            error: "Compte non trouvé.",
          },
          { status: 404 }
        );
      }
      if (accountResponse.status === 401) {
        return NextResponse.json(
          {
            error:
              "Clé API Riot invalide ou expirée. Veuillez la mettre à jour.",
          },
          { status: 401 }
        );
      }
      if (accountResponse.status === 403) {
        return NextResponse.json(
          {
            error:
              "Accès refusé. Vérifiez que votre clé API a les bonnes permissions.",
          },
          { status: 403 }
        );
      }
      const errorBody = await accountResponse.json().catch(() => ({}));
      return NextResponse.json(
        {
          error: `Erreur API Riot: ${accountResponse.status}`,
          details: errorBody,
        },
        { status: accountResponse.status }
      );
    }

    const accountData = await accountResponse.json();

    // Appeler l'API Summoner pour obtenir plus de détails
    const summonerResponse = await fetch(
      `${baseUrl}/lol/summoner/v4/summoners/by-puuid/${validatedData.puuid}`,
      {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      }
    );

    let summonerData = null;
    if (summonerResponse.ok) {
      summonerData = await summonerResponse.json();
      console.log("Summoner data:", summonerData);
      console.log("Keys in summonerData:", Object.keys(summonerData));
    } else {
      console.log(
        "Summoner API error:",
        summonerResponse.status,
        summonerResponse.statusText
      );
      const errorText = await summonerResponse.text().catch(() => "");
      console.log("Summoner API error body:", errorText);
    }

    // Retourner les données complètes du compte
    return NextResponse.json(
      {
        success: true,
        data: {
          // Données Account API
          puuid: accountData.puuid,
          gameName: accountData.gameName,
          tagLine: accountData.tagLine,
          // Données Summoner API
          summonerLevel: summonerData?.summonerLevel || null,
          profileIconId: summonerData?.profileIconId || null,
          summonerId: summonerData?.id || null,
          accountId: summonerData?.accountId || null,
          revisionDate: summonerData?.revisionDate || null,
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

    console.error("Erreur lors de la récupération des détails:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération des détails" },
      { status: 500 }
    );
  }
}
