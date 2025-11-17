import { prisma } from "../lib/prisma";
import {
  ShardedLeagueAccounts,
  getLeagueAccountsTableName,
} from "../lib/prisma-sharded-accounts";

/**
 * Script de vérification du sharding
 * Vérifie que les tables shardées sont correctement configurées et que les données sont cohérentes
 */
async function verifySharding() {
  console.log("🔍 Vérification du système de sharding...\n");

  const regions = [
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

  try {
    // 1. Vérifier que toutes les tables existent
    console.log("1. Vérification des tables shardées...");
    const missingTables: string[] = [];
    for (const region of regions) {
      const tableName = getLeagueAccountsTableName(region);
      const tableExists = await prisma.$queryRawUnsafe<
        Array<{ count: bigint }>
      >(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1`,
        tableName
      );

      if (tableExists[0]?.count === 0n) {
        missingTables.push(tableName);
        console.log(`  ❌ Table manquante: ${tableName}`);
      } else {
        console.log(`  ✓ Table existe: ${tableName}`);
      }
    }

    if (missingTables.length > 0) {
      console.log(`\n⚠️  ${missingTables.length} table(s) manquante(s).`);
      console.log("   Exécutez le script de migration pour les créer.\n");
    }

    // 2. Compter les comptes dans chaque table
    console.log("\n2. Comptage des comptes par région...");
    const counts: Array<{ region: string; count: number }> = [];
    let totalSharded = 0;

    for (const region of regions) {
      const tableName = getLeagueAccountsTableName(region);
      try {
        const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*) as count FROM "${tableName}"`
        );
        const count = Number(result[0]?.count ?? 0);
        counts.push({ region, count });
        totalSharded += count;
        console.log(
          `  ${region.padEnd(8)}: ${count.toString().padStart(6)} compte(s)`
        );
      } catch (error) {
        console.log(`  ${region.padEnd(8)}: Erreur - ${error}`);
      }
    }

    // 3. Compter les comptes dans la table originale (si elle existe)
    console.log("\n3. Vérification de la table originale...");
    let totalOriginal = 0;
    try {
      const originalExists = await prisma.$queryRawUnsafe<
        Array<{ count: bigint }>
      >(
        `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'league_accounts'`
      );

      if (originalExists[0]?.count > 0n) {
        const result = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*) as count FROM "league_accounts"`
        );
        totalOriginal = Number(result[0]?.count ?? 0);
        console.log(`  Table originale: ${totalOriginal} compte(s)`);
        console.log(`  Total shardé:    ${totalSharded} compte(s)`);

        if (totalSharded === totalOriginal) {
          console.log("  ✓ Les comptes correspondent !");
        } else {
          const diff = totalOriginal - totalSharded;
          console.log(`  ⚠️  Différence de ${diff} compte(s)`);
        }
      } else {
        console.log("  ℹ️  Table originale n'existe plus (migration complète)");
      }
    } catch (error) {
      console.log(`  ⚠️  Erreur lors de la vérification: ${error}`);
    }

    // 4. Vérifier qu'il n'y a pas de doublons de PUUID
    console.log("\n4. Vérification des doublons de PUUID...");
    const allPuuids = new Map<string, string[]>();

    for (const region of regions) {
      const tableName = getLeagueAccountsTableName(region);
      try {
        const puuids = await prisma.$queryRawUnsafe<Array<{ puuid: string }>>(
          `SELECT "puuid" FROM "${tableName}"`
        );

        for (const row of puuids) {
          if (!allPuuids.has(row.puuid)) {
            allPuuids.set(row.puuid, []);
          }
          allPuuids.get(row.puuid)!.push(region);
        }
      } catch (error) {
        // Table n'existe pas ou erreur
      }
    }

    const duplicates = Array.from(allPuuids.entries()).filter(
      ([_, regions]) => regions.length > 1
    );

    if (duplicates.length === 0) {
      console.log("  ✓ Aucun doublon de PUUID trouvé");
    } else {
      console.log(
        `  ⚠️  ${duplicates.length} PUUID trouvé(s) dans plusieurs régions:`
      );
      duplicates.slice(0, 5).forEach(([puuid, dupRegions]) => {
        console.log(`     ${puuid}: ${dupRegions.join(", ")}`);
      });
      if (duplicates.length > 5) {
        console.log(`     ... et ${duplicates.length - 5} autres`);
      }
    }

    // 5. Tester quelques opérations de base
    console.log("\n5. Tests des opérations de base...");

    // Test findUniqueByPuuidGlobal avec un PUUID inexistant
    try {
      const result = await ShardedLeagueAccounts.findUniqueByPuuidGlobal(
        "test-puuid-inexistant-12345"
      );
      if (result === null) {
        console.log(
          "  ✓ findUniqueByPuuidGlobal fonctionne (retourne null pour PUUID inexistant)"
        );
      } else {
        console.log(
          "  ⚠️  findUniqueByPuuidGlobal a retourné un résultat inattendu"
        );
      }
    } catch (error) {
      console.log(`  ❌ Erreur avec findUniqueByPuuidGlobal: ${error}`);
    }

    // Test avec un vrai PUUID si disponible
    if (totalSharded > 0) {
      // Récupérer un PUUID aléatoire pour tester
      const randomRegion = counts.find((c) => c.count > 0)?.region;
      if (randomRegion) {
        try {
          const testAccounts = await prisma.$queryRawUnsafe<
            Array<{ puuid: string }>
          >(
            `SELECT "puuid" FROM "${getLeagueAccountsTableName(
              randomRegion
            )}" LIMIT 1`
          );

          if (testAccounts.length > 0) {
            const testPuuid = testAccounts[0].puuid;
            const found = await ShardedLeagueAccounts.findUniqueByPuuidGlobal(
              testPuuid
            );
            if (found && found.puuid === testPuuid) {
              console.log(
                `  ✓ Recherche d'un PUUID existant fonctionne (${testPuuid.substring(
                  0,
                  12
                )}...)`
              );
            } else {
              console.log(
                `  ⚠️  Problème lors de la recherche du PUUID de test`
              );
            }
          }
        } catch (error) {
          console.log(`  ⚠️  Erreur lors du test avec un PUUID réel: ${error}`);
        }
      }
    }

    // 6. Résumé
    console.log("\n📊 Résumé:");
    console.log(
      `   Tables shardées: ${regions.length - missingTables.length}/${
        regions.length
      }`
    );
    console.log(`   Total comptes shardés: ${totalSharded}`);
    if (totalOriginal > 0) {
      console.log(`   Total comptes origine: ${totalOriginal}`);
    }
    console.log(`   Doublons PUUID: ${duplicates.length}`);

    if (missingTables.length === 0 && duplicates.length === 0) {
      console.log(
        "\n✅ Vérification réussie ! Le système de sharding est correctement configuré."
      );
      return 0;
    } else {
      console.log(
        "\n⚠️  Vérification terminée avec des avertissements. Vérifiez les détails ci-dessus."
      );
      return 1;
    }
  } catch (error) {
    console.error("\n❌ Erreur lors de la vérification:", error);
    return 1;
  }
}

// Exécuter la vérification
verifySharding()
  .then((exitCode) => {
    process.exit(exitCode);
  })
  .catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
  });
