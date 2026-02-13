import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitPresets } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { toError } from "@/lib/errors";

const logger = createLogger("patches");

export async function GET(request: NextRequest) {
  const rateLimitResponse = await rateLimit(request, rateLimitPresets.api);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const matches = await prisma.match.findMany({
      select: { gameVersion: true },
      distinct: ["gameVersion"],
    });

    // Extract major.minor from versions like "15.21.1" and deduplicate
    const patchSet = new Set<string>();
    for (const match of matches) {
      const parts = match.gameVersion.split(".");
      if (parts.length >= 2) {
        patchSet.add(`${parts[0]}.${parts[1]}`);
      }
    }

    // Sort by version descending
    const patches = Array.from(patchSet).sort((a, b) => {
      const [aMajor, aMinor] = a.split(".").map(Number);
      const [bMajor, bMinor] = b.split(".").map(Number);
      if (bMajor !== aMajor) return bMajor - aMajor;
      return bMinor - aMinor;
    });

    return NextResponse.json(
      {
        success: true,
        data: { patches },
      },
      {
        status: 200,
        headers: {
          "Cache-Control":
            "public, s-maxage=3600, stale-while-revalidate=7200",
        },
      }
    );
  } catch (error) {
    logger.error("Erreur lors de la récupération des patches", toError(error));
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des patches",
      },
      { status: 500 }
    );
  }
}
