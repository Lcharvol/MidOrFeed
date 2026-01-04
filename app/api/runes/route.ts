import { NextResponse } from "next/server";
import { getRunesDataUrl, getVersionsUrl } from "@/constants/ddragon";
import { getOrSetCache, CacheTTL } from "@/lib/cache";
import { applySecurityHeaders } from "@/lib/security-headers";
import { logger } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/timeout";
import { getEnv } from "@/lib/env";

interface RiotRune {
  id: number;
  key: string;
  icon: string;
  name: string;
  shortDesc: string;
  longDesc: string;
}

interface RiotRuneSlot {
  runes: RiotRune[];
}

interface RiotRuneTree {
  id: number;
  key: string;
  icon: string;
  name: string;
  slots: RiotRuneSlot[];
}

export interface Rune {
  id: number;
  key: string;
  name: string;
  icon: string;
  description: string;
}

export interface RuneTree {
  id: number;
  key: string;
  name: string;
  icon: string;
  keystones: Rune[];
  slots: Rune[][];
}

export async function GET() {
  try {
    const env = getEnv();

    const trees = await getOrSetCache(
      "ddragon:runes",
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

        // Fetch runes data
        const response = await fetchWithTimeout(
          getRunesDataUrl(latestVersion, "fr_FR"),
          {},
          env.API_TIMEOUT_MS
        );

        if (!response.ok) {
          throw new Error("Impossible de récupérer les runes");
        }

        const data: RiotRuneTree[] = await response.json();

        // Transform to simplified structure
        const trees: RuneTree[] = data.map((tree) => ({
          id: tree.id,
          key: tree.key,
          name: tree.name,
          icon: tree.icon,
          keystones: tree.slots[0].runes.map((rune) => ({
            id: rune.id,
            key: rune.key,
            name: rune.name,
            icon: rune.icon,
            description: rune.shortDesc,
          })),
          slots: tree.slots.slice(1).map((slot) =>
            slot.runes.map((rune) => ({
              id: rune.id,
              key: rune.key,
              name: rune.name,
              icon: rune.icon,
              description: rune.shortDesc,
            }))
          ),
        }));

        return trees;
      }
    );

    const response = NextResponse.json(
      {
        success: true,
        data: trees,
      },
      { status: 200 }
    );

    return applySecurityHeaders(response);
  } catch (error) {
    logger.error("Erreur lors de la récupération des runes", error as Error);
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des runes",
      },
      { status: 500 }
    );
    return applySecurityHeaders(errorResponse);
  }
}
