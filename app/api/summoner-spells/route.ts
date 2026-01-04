import { NextResponse } from "next/server";
import { getSummonerSpellDataUrl, getVersionsUrl } from "@/constants/ddragon";
import { getOrSetCache, CacheTTL } from "@/lib/cache";
import { applySecurityHeaders } from "@/lib/security-headers";
import { logger } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/timeout";
import { getEnv } from "@/lib/env";

interface RiotSummonerSpell {
  id: string;
  key: string;
  name: string;
  description: string;
  cooldown: number[];
  summonerLevel: number;
  modes: string[];
  image: {
    full: string;
  };
}

interface SummonerSpellData {
  [key: string]: RiotSummonerSpell;
}

export interface SummonerSpell {
  id: string;
  key: string;
  name: string;
  description: string;
  cooldown: number;
  image: string;
}

// Summoner spells à exclure (modes spéciaux)
const EXCLUDED_SPELLS = [
  "SummonerPoroRecall",
  "SummonerPoroThrow",
  "SummonerSnowURFSnowball_Mark",
  "SummonerSnowball",
  "SummonerCherryFlash",
  "SummonerCherryHold",
  "Summoner_UltBookPlaceholder",
  "Summoner_UltBookSmitePlaceholder",
];

export async function GET() {
  try {
    const env = getEnv();

    const spells = await getOrSetCache(
      "ddragon:summoner-spells",
      CacheTTL.LONG,
      async () => {
        // Get latest version
        const versionsResponse = await fetchWithTimeout(
          getVersionsUrl(),
          {},
          env.API_TIMEOUT_MS
        );
        if (!versionsResponse.ok) {
          throw new Error("Impossible de récupérer les versions");
        }
        const versions: string[] = await versionsResponse.json();
        const latestVersion = versions[0];

        // Fetch summoner spells data
        const response = await fetchWithTimeout(
          getSummonerSpellDataUrl(latestVersion, "fr_FR"),
          {},
          env.API_TIMEOUT_MS
        );

        if (!response.ok) {
          throw new Error("Impossible de récupérer les summoner spells");
        }

        const data: { data: SummonerSpellData } = await response.json();

        // Transform and filter spells
        const spells: SummonerSpell[] = Object.values(data.data)
          .filter(
            (spell) =>
              !EXCLUDED_SPELLS.includes(spell.id) &&
              spell.modes.includes("CLASSIC")
          )
          .map((spell) => ({
            id: spell.id,
            key: spell.key,
            name: spell.name,
            description: spell.description,
            cooldown: spell.cooldown[0],
            image: spell.image.full,
          }))
          .sort((a, b) => a.name.localeCompare(b.name, "fr"));

        return spells;
      }
    );

    const response = NextResponse.json(
      {
        success: true,
        data: spells,
      },
      { status: 200 }
    );

    return applySecurityHeaders(response);
  } catch (error) {
    logger.error(
      "Erreur lors de la récupération des summoner spells",
      error as Error
    );
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des summoner spells",
      },
      { status: 500 }
    );
    return applySecurityHeaders(errorResponse);
  }
}
