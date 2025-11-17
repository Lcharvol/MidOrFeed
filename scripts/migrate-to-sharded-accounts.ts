import { prisma } from "../lib/prisma";
import { getLeagueAccountsTableName } from "../lib/prisma-sharded-accounts";

/**
 * Liste des régions supportées
 */
const REGIONS = [
  "euw1",
  "eun1",
  "na1",
  "br1",
  "kr",
  "jp1",
  "ru",
  "tr1",
  "la1",
  "la2",
  "oc1",
  "ph2",
  "sg2",
  "th2",
  "tw2",
  "vn2",
];

/**
 * Script de migration pour créer les tables shardées et migrer les données
 */
async function migrateToShardedAccounts() {
  console.log("Starting migration to sharded accounts...");

  try {
    // Étape 1: Créer les tables shardées pour chaque région
    console.log("Creating sharded tables...");
    for (const region of REGIONS) {
      const tableName = getLeagueAccountsTableName(region);

      // Vérifier si la table existe déjà
      const tableExists = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
        tableName
      );

      if (tableExists[0]?.count === 0n) {
        console.log(`Creating table ${tableName}...`);

        await prisma.$executeRawUnsafe(`
          CREATE TABLE "${tableName}" (
            "id" TEXT NOT NULL,
            "puuid" TEXT NOT NULL,
            "riotGameName" TEXT,
            "riotTagLine" TEXT,
            "riotRegion" TEXT NOT NULL,
            "riotSummonerId" TEXT,
            "riotAccountId" TEXT,
            "summonerLevel" INTEGER,
            "profileIconId" INTEGER,
            "revisionDate" BIGINT,
            "totalMatches" INTEGER NOT NULL DEFAULT 0,
            "totalWins" INTEGER NOT NULL DEFAULT 0,
            "totalLosses" INTEGER NOT NULL DEFAULT 0,
            "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "avgKDA" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "mostPlayedChampion" TEXT,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

            CONSTRAINT "${tableName}_pkey" PRIMARY KEY ("id")
          )
        `);

        // Créer les index
        await prisma.$executeRawUnsafe(`
          CREATE UNIQUE INDEX "${tableName}_puuid_key" ON "${tableName}"("puuid")
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX "${tableName}_puuid_idx" ON "${tableName}"("puuid")
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX "${tableName}_riotRegion_idx" ON "${tableName}"("riotRegion")
        `);

        await prisma.$executeRawUnsafe(`
          CREATE INDEX "${tableName}_riotGameName_idx" ON "${tableName}"("riotGameName")
        `);

        console.log(`✓ Created table ${tableName}`);
      } else {
        console.log(`✓ Table ${tableName} already exists`);
      }
    }

    // Étape 2: Migrer les données de league_accounts vers les tables shardées
    console.log("\nMigrating data from league_accounts to sharded tables...");

    // Récupérer tous les comptes de la table principale
    const accounts = await prisma.$queryRawUnsafe<Array<{
      id: string;
      puuid: string;
      riotGameName: string | null;
      riotTagLine: string | null;
      riotRegion: string;
      riotSummonerId: string | null;
      riotAccountId: string | null;
      summonerLevel: number | null;
      profileIconId: number | null;
      revisionDate: bigint | null;
      totalMatches: number;
      totalWins: number;
      totalLosses: number;
      winRate: number;
      avgKDA: number;
      mostPlayedChampion: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>>(`SELECT * FROM "league_accounts"`);

    console.log(`Found ${accounts.length} accounts to migrate`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const account of accounts) {
      try {
        const region = account.riotRegion?.toLowerCase() || "euw1"; // Default to EUW1 if region is missing
        const tableName = getLeagueAccountsTableName(region);

        // Vérifier si le compte existe déjà dans la table shardée
        const existing = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*) as count FROM "${tableName}" WHERE "puuid" = $1`,
          account.puuid
        );

        if (existing[0]?.count === 0n) {
          // Insérer le compte dans la table shardée
          await prisma.$executeRawUnsafe(
            `INSERT INTO "${tableName}" (
              "id", "puuid", "riotGameName", "riotTagLine", "riotRegion",
              "riotSummonerId", "riotAccountId", "summonerLevel", "profileIconId",
              "revisionDate", "totalMatches", "totalWins", "totalLosses",
              "winRate", "avgKDA", "mostPlayedChampion", "createdAt", "updatedAt"
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
            )`,
            account.id,
            account.puuid,
            account.riotGameName,
            account.riotTagLine,
            region,
            account.riotSummonerId,
            account.riotAccountId,
            account.summonerLevel,
            account.profileIconId,
            account.revisionDate,
            account.totalMatches,
            account.totalWins,
            account.totalLosses,
            account.winRate,
            account.avgKDA,
            account.mostPlayedChampion,
            account.createdAt,
            account.updatedAt
          );

          migrated++;
          if (migrated % 100 === 0) {
            console.log(`  Migrated ${migrated} accounts...`);
          }
        } else {
          skipped++;
        }
      } catch (error) {
        errors++;
        console.error(`Error migrating account ${account.puuid}:`, error);
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`  ✓ Migrated: ${migrated}`);
    console.log(`  ⊘ Skipped (already exists): ${skipped}`);
    console.log(`  ✗ Errors: ${errors}`);

    // Note: Ne pas supprimer la table league_accounts tout de suite
    // Gardez-la comme backup et supprimez-la après avoir vérifié que tout fonctionne
    console.log(
      "\n⚠️  IMPORTANT: The original 'league_accounts' table is still present."
    );
    console.log(
      "   You can delete it manually after verifying everything works correctly."
    );
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  }
}

// Exécuter la migration
migrateToShardedAccounts()
  .then(() => {
    console.log("\n✓ Migration completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n✗ Migration failed:", error);
    process.exit(1);
  });

