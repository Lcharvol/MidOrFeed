import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-utils";
import { getOrSetCache, CacheTTL, invalidateCachePrefix } from "@/lib/cache";

export const GET = async () => {
  try {
    const cacheKey = "riot:versions";

    const result = await getOrSetCache(
      cacheKey,
      CacheTTL.VERY_LONG, // 1 heure - les versions changent rarement
      async () => {
        const versions = await prisma.gameVersion.findMany({
          orderBy: [
            { isCurrent: "desc" },
            { createdAt: "desc" },
          ],
        });

        const current = versions.find((entry) => entry.isCurrent)?.version ?? null;

        return {
          versions,
          currentVersion: current,
        };
      }
    );

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[RIOT-VERSIONS] GET error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la récupération des versions du jeu.",
      },
      { status: 500 }
    );
  }
};

export const PATCH = async (request: NextRequest) => {
  const authError = await requireAdmin(request);
  if (authError) {
    return authError;
  }

  try {
    const payload = await request.json();
    const version = typeof payload?.version === "string" ? payload.version.trim() : null;

    if (!version) {
      return NextResponse.json(
        {
          success: false,
          error: "Version manquante ou invalide.",
        },
        { status: 422 }
      );
    }

    const target = await prisma.gameVersion.findUnique({
      where: { version },
    });

    if (!target) {
      return NextResponse.json(
        {
          success: false,
          error: "Cette version n'existe pas en base. Synchronisez d'abord les versions Riot.",
        },
        { status: 404 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.gameVersion.updateMany({
        where: { isCurrent: true, version: { not: version } },
        data: { isCurrent: false },
      });

      await tx.gameVersion.update({
        where: { version },
        data: { isCurrent: true },
      });
    });

    // Invalider le cache après mise à jour
    invalidateCachePrefix("riot:versions");

    return NextResponse.json(
      {
        success: true,
        data: { currentVersion: version },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[RIOT-VERSIONS] PATCH error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erreur lors de la mise à jour de la version courante.",
      },
      { status: 500 }
    );
  }
};

