import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
import { getVersionsUrl } from "@/constants/ddragon";

const VERSIONS_ENDPOINT = getVersionsUrl();

const parseVersions = (input: unknown): string[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
};

export const POST = async (request: NextRequest) => {
  const authError = await requireAdmin(request, { skipCsrf: true });
  if (authError) {
    return authError;
  }

  try {
    const response = await fetch(VERSIONS_ENDPOINT, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: `Impossible de récupérer les versions Riot (status ${response.status})`,
        },
        { status: 502 }
      );
    }

    const body = await response.json();
    const versions = parseVersions(body);

    if (versions.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucune version valide n'a été renvoyée par l'API Riot.",
        },
        { status: 422 }
      );
    }

    const latestVersion = versions[0];
    let createdCount = 0;

    await prisma.$transaction(async (tx) => {
      const existingVersions = await tx.gameVersion.findMany({
        select: { version: true },
      });
      const existingSet = new Set(
        existingVersions.map(({ version }) => version)
      );

      const newVersions = versions.filter(
        (version) => !existingSet.has(version)
      );

      if (newVersions.length > 0) {
        await tx.gameVersion.createMany({
          data: newVersions.map((version) => ({ version })),
          skipDuplicates: true,
        });
        createdCount = newVersions.length;
      }

      await tx.gameVersion.updateMany({
        where: {
          isCurrent: true,
          version: { not: latestVersion },
        },
        data: { isCurrent: false },
      });

      await tx.gameVersion.upsert({
        where: { version: latestVersion },
        create: { version: latestVersion, isCurrent: true },
        update: { isCurrent: true },
      });
    });

    const totalVersions = await prisma.gameVersion.count();

    return NextResponse.json(
      {
        success: true,
        data: {
          createdCount,
          totalVersions,
          currentVersion: latestVersion,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "[RIOT-VERSIONS] Erreur lors de la synchronisation des versions:",
      error
    );
    return NextResponse.json(
      {
        success: false,
        error: "Erreur interne lors de la synchronisation des versions Riot.",
      },
      { status: 500 }
    );
  }
};
