import { NextResponse } from "next/server";
import { REGION_TO_ROUTING, REGION_TO_BASE_URL } from "@/constants/regions";
import { prisma } from "@/lib/prisma";
import { ShardedLeagueAccounts } from "@/lib/prisma-sharded-accounts";
import { z } from "zod";

const getAccountDetailsSchema = z.object({
  puuid: z.string().min(1, "PUUID est requis"),
  region: z.string().min(1, "Région est requise"),
  force: z.boolean().optional(),
});

// Clé API Riot Games depuis les variables d'environnement
const RIOT_API_KEY = process.env.RIOT_API_KEY;

// Base URLs importés depuis constants/regions

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

    // Normaliser et vérifier que la région est valide (accepte EUW1, euw1, etc.)
    const normalizedRegion = validatedData.region.toLowerCase();
    const routing = REGION_TO_ROUTING[normalizedRegion];
    const baseUrl = REGION_TO_BASE_URL[normalizedRegion];

    if (!routing || !baseUrl) {
      return NextResponse.json({ error: "Région invalide" }, { status: 400 });
    }

    // 1) Si pas force: tenter de retourner le cache DB
    if (!validatedData.force) {
      // Chercher dans la table shardée de la région spécifiée
      const existing = await ShardedLeagueAccounts.findUniqueByPuuid(
        validatedData.puuid,
        normalizedRegion
      );
      // Si pas trouvé, chercher dans toutes les régions (en passant la région connue)
      const existingGlobal = existing
        ? existing
        : await ShardedLeagueAccounts.findUniqueByPuuidGlobal(
            validatedData.puuid,
            normalizedRegion
          );
      if (existingGlobal) {
        return NextResponse.json(
          {
            success: true,
            data: {
              puuid: existingGlobal.puuid,
              gameName: existingGlobal.riotGameName,
              tagLine: existingGlobal.riotTagLine,
              summonerLevel: existingGlobal.summonerLevel,
              profileIconId: existingGlobal.profileIconId,
              summonerId: existingGlobal.riotSummonerId,
              accountId: existingGlobal.riotAccountId,
              revisionDate:
                existingGlobal.revisionDate !== null &&
                existingGlobal.revisionDate !== undefined
                  ? Number(existingGlobal.revisionDate)
                  : null,
            },
            cached: true,
          },
          { status: 200 }
        );
      }
    }

    // 2) Sinon: appel Riot puis mise à jour du cache DB
    // Simple rate limiter par routing (token spacing ~150ms)
    const limiterKey = `__RIOT_RATE_${routing}` as const;
    const g = globalThis as unknown as Record<string, number>;
    const now = Date.now();
    if (!g[limiterKey]) g[limiterKey] = 0;
    if (g[limiterKey] > now) {
      await new Promise((r) => setTimeout(r, g[limiterKey] - now));
    }
    g[limiterKey] = Date.now() + 150; // ~6-7 rps par routing

    // Appeler l'API Account pour obtenir le Riot ID
    let accountResponse = await fetch(
      `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${validatedData.puuid}`,
      {
        headers: {
          "X-Riot-Token": RIOT_API_KEY,
        },
      }
    );
    if (accountResponse.status === 429) {
      const retryAfter = parseInt(
        accountResponse.headers.get("Retry-After") || "2",
        10
      );
      await new Promise((r) =>
        setTimeout(r, (isNaN(retryAfter) ? 2 : retryAfter) * 1000)
      );
      accountResponse = await fetch(
        `https://${routing}.api.riotgames.com/riot/account/v1/accounts/by-puuid/${validatedData.puuid}`,
        {
          headers: {
            "X-Riot-Token": RIOT_API_KEY,
          },
        }
      );
    }

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
    } else {
      console.log(
        "Summoner API error:",
        summonerResponse.status,
        summonerResponse.statusText
      );
    }

    // Upsert en base pour persister les infos dans la table shardée
    await ShardedLeagueAccounts.upsert({
      puuid: validatedData.puuid,
      riotRegion: normalizedRegion,
      riotGameName: accountData.gameName ?? null,
      riotTagLine: accountData.tagLine ?? null,
      summonerLevel: summonerData?.summonerLevel ?? null,
      profileIconId: summonerData?.profileIconId ?? null,
      riotSummonerId: summonerData?.id ?? null,
      riotAccountId: summonerData?.accountId ?? null,
      revisionDate: summonerData?.revisionDate
        ? BigInt(summonerData.revisionDate)
        : null,
    });

    // Retourner les données complètes du compte
    return NextResponse.json(
      {
        success: true,
        data: {
          puuid: accountData.puuid,
          gameName: accountData.gameName,
          tagLine: accountData.tagLine,
          summonerLevel: summonerData?.summonerLevel || null,
          profileIconId: summonerData?.profileIconId || null,
          summonerId: summonerData?.id || null,
          accountId: summonerData?.accountId || null,
          revisionDate: summonerData?.revisionDate || null,
        },
        cached: false,
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
