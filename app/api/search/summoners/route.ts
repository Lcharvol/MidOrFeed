import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLeagueAccountsTableName } from "@/lib/prisma-sharded-accounts";
import { validateRegion, validateTableName, escapeSqlIdentifier, escapeLikePattern } from "@/lib/sql-sanitization";
import { z } from "zod";
import { createLogger } from "@/lib/logger";

const logger = createLogger("search-summoners");

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

    logger.info("Recherche", { query, region, limit });

    // Normaliser et valider la requête: supporter "GameName#Tag" en extrayant le nom
    const namePart = query.split("#")[0].trim();
    // Escape LIKE special characters to prevent pattern injection
    const safeNamePart = escapeLikePattern(namePart);
    
    // Valider que la requête ne contient pas de caractères dangereux pour SQL
    if (namePart.length > 100) {
      return NextResponse.json(
        { error: "Requête trop longue" },
        { status: 400 }
      );
    }

    // Note: La recherche par nom de jeu nécessite des requêtes SQL brutes
    // car les tables shardées ne supportent pas facilement les recherches textuelles
    // On utilise des paramètres préparés pour éviter les injections SQL
    
    // 1) Essayer avec région si fournie
    let rows: Array<{
      puuid: string;
      riotGameName: string | null;
      riotTagLine: string | null;
      riotRegion: string;
      summonerLevel: number | null;
      profileIconId: number | null;
      totalMatches: number;
      winRate: number;
      avgKDA: number;
    }> = [];
    
    if (region) {
      // Valider la région
      if (!validateRegion(region)) {
        return NextResponse.json(
          { error: "Région invalide" },
          { status: 400 }
        );
      }
      
      const tableName = getLeagueAccountsTableName(region);
      
      // Valider le nom de table
      if (!validateTableName(tableName)) {
        return NextResponse.json(
          { error: "Nom de table invalide" },
          { status: 500 }
        );
      }
      
      try {
        // Utiliser des paramètres préparés pour éviter les injections SQL
        const escapedTableName = escapeSqlIdentifier(tableName);
        rows = await prisma.$queryRawUnsafe<
          Array<{
            puuid: string;
            riotGameName: string | null;
            riotTagLine: string | null;
            riotRegion: string;
            summonerLevel: number | null;
            profileIconId: number | null;
            totalMatches: number;
            winRate: number;
            avgKDA: number;
          }>
        >(
          `SELECT "puuid", "riotGameName", "riotTagLine", "riotRegion", "summonerLevel", "profileIconId", "totalMatches", "winRate", "avgKDA" FROM ${escapedTableName} WHERE ("riotGameName" ILIKE $1 OR "puuid" LIKE $2) ORDER BY "totalMatches" DESC LIMIT $3`,
          `%${safeNamePart}%`,
          `${safeNamePart}%`,
          limit
        );
      } catch (error) {
        logger.error(`Erreur recherche dans ${tableName}`, error as Error);
      }
    }
    
    // 2) Si rien trouvé, chercher dans toutes les régions
    if (rows.length === 0) {
      const { MAIN_REGIONS } = await import("@/constants/riot-regions");
      for (const reg of MAIN_REGIONS) {
        if (rows.length >= limit) break;
        
        const tableName = getLeagueAccountsTableName(reg);
        
        // Valider le nom de table
        if (!validateTableName(tableName)) {
          continue; // Skip cette région si le nom de table est invalide
        }
        
        try {
          // Utiliser des paramètres préparés pour éviter les injections SQL
          const escapedTableName = escapeSqlIdentifier(tableName);
          const results = await prisma.$queryRawUnsafe<
            Array<{
              puuid: string;
              riotGameName: string | null;
              riotTagLine: string | null;
              riotRegion: string;
              summonerLevel: number | null;
              profileIconId: number | null;
              totalMatches: number;
              winRate: number;
              avgKDA: number;
            }>
          >(
            `SELECT "puuid", "riotGameName", "riotTagLine", "riotRegion", "summonerLevel", "profileIconId", "totalMatches", "winRate", "avgKDA" FROM ${escapedTableName} WHERE ("riotGameName" ILIKE $1 OR "puuid" LIKE $2) ORDER BY "totalMatches" DESC LIMIT $3`,
            `%${safeNamePart}%`,
            `${safeNamePart}%`,
            limit - rows.length
          );
          rows.push(...results);
        } catch (error) {
          logger.error(`Erreur recherche dans ${tableName}`, error as Error);
        }
      }
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

    logger.error("Erreur", error as Error);
    return NextResponse.json(
      { error: "Erreur lors de la recherche" },
      { status: 500 }
    );
  }
}
