import { exportMatchesToCsv } from "../lib/server/ml/exportMatches";

async function run() {
  const { total, path } = await exportMatchesToCsv();
  console.log(`Export terminé: ${total} enregistrements -> ${path}`);
}

run()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erreur lors de l'export:", error);
    process.exit(1);
  });
