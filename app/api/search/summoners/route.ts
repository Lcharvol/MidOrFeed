import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const searchSchema = z.object({
  query: z.string().min(2, "Requête trop courte"),
  region: z.string().optional(),
  limit: z.number().min(1).max(20).default(10),
});

/**
 * POST /api/search/summoners
 * Recherche des invocateurs dans la base de données locale
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validatedData = searchSchema.parse(body);

    const { query, region, limit } = validatedData;

    console.log("[SEARCH/SUMMONERS] Recherche:", { query, region, limit });

    // Normaliser la requête: supporter "GameName#Tag" en extrayant le nom
    const namePart = query.split("#")[0].trim();

    // Fonction de recherche
    const runSearch = async (scopedRegion?: string) => {
      const where: any = {
        AND: [
          scopedRegion ? { riotRegion: scopedRegion } : {},
          {
            OR: [
              // SQLite: contains est généralement case-insensitive ASCII
              { riotGameName: { contains: namePart } },
              { puuid: { startsWith: namePart } },
            ],
          },
        ],
      };

      const rows = await prisma.leagueOfLegendsAccount.findMany({
        where,
        take: limit,
        orderBy: { totalMatches: "desc" },
        select: {
          puuid: true,
          riotGameName: true,
          riotTagLine: true,
          riotRegion: true,
          summonerLevel: true,
          profileIconId: true,
          totalMatches: true,
          winRate: true,
          avgKDA: true,
        },
      });
      return rows;
    };

    // 1) Essayer avec région si fournie
    let rows = await runSearch(region);
    // 2) Si rien trouvé et région fournie, re-tenter sans filtre de région
    if (rows.length === 0 && region) {
      rows = await runSearch(undefined);
    }

    return NextResponse.json(
      {
        success: true,
        results: rows.map((account) => ({
          puuid: account.puuid,
          gameName: account.riotGameName,
          tagLine: account.riotTagLine,
          region: account.riotRegion,
          level: account.summonerLevel,
          profileIconId: account.profileIconId,
          stats: {
            totalMatches: account.totalMatches,
            winRate: account.winRate,
            avgKDA: account.avgKDA,
          },
        })),
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

    console.error("[SEARCH/SUMMONERS] Erreur:", error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}
