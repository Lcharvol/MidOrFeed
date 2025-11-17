import { prisma } from "../lib/prisma";

/**
 * Script pour supprimer la table de backup après vérification du sharding
 * ATTENTION: Cette action est irréversible !
 */
const dropBackupTable = async () => {
  console.log("⚠️  ATTENTION: Cette action va supprimer définitivement la table 'league_accounts_old_backup'");
  console.log("Assurez-vous que le sharding fonctionne correctement avant de continuer.\n");

  try {
    // Vérifier que la table existe
    const tableExists = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count 
       FROM information_schema.tables 
       WHERE table_schema = 'public' 
       AND table_name = 'league_accounts_old_backup'`
    );

    if (tableExists[0]?.count === BigInt(0)) {
      console.log("✅ La table 'league_accounts_old_backup' n'existe pas, rien à supprimer.");
      return;
    }

    console.log("🗑️  Suppression de la table 'league_accounts_old_backup'...");

    await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS league_accounts_old_backup`);

    console.log("✅ Table 'league_accounts_old_backup' supprimée avec succès !");
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la table:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

dropBackupTable();

