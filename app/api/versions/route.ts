import { NextResponse } from "next/server";
import { getVersionsUrl } from "@/constants/ddragon";
import { getOrSetCache, CacheTTL } from "@/lib/cache";
import { applySecurityHeaders } from "@/lib/security-headers";
import { logger } from "@/lib/logger";
import { fetchWithTimeout } from "@/lib/timeout";
import { getEnv } from "@/lib/env";

// GET pour récupérer les versions disponibles de LoL
export async function GET() {
  try {
    const env = getEnv();

    // Cache les versions pendant 1 heure (elles changent rarement)
    const versions = await getOrSetCache(
      "ddragon:versions",
      CacheTTL.LONG, // 15 minutes
      async () => {
        const response = await fetchWithTimeout(
          getVersionsUrl(),
          {},
          env.API_TIMEOUT_MS
        );

        if (!response.ok) {
          throw new Error("Impossible de récupérer les versions");
        }

        const allVersions: string[] = await response.json();

        // Garder seulement les 20 dernières versions majeures (format X.Y.1)
        // et filtrer pour n'avoir que les versions principales (pas les hotfixes)
        const majorVersions = allVersions
          .filter((v) => v.endsWith(".1"))
          .slice(0, 20);

        return majorVersions;
      }
    );

    const response = NextResponse.json(
      {
        success: true,
        data: versions,
      },
      { status: 200 }
    );

    return applySecurityHeaders(response);
  } catch (error) {
    logger.error("Erreur lors de la récupération des versions", error as Error);
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des versions",
      },
      { status: 500 }
    );
    return applySecurityHeaders(errorResponse);
  }
}
