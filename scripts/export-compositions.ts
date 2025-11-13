import { exportCompositionsToCsv } from "@/lib/server/ml/exportCompositions";

async function run() {
  const { total, path } = await exportCompositionsToCsv();
  console.log(`Export compositions terminé : ${total} échantillons -> ${path}`);
}

run()
  .then(() => {
    console.log("Done");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Erreur lors de l'export des compositions :", error);
    process.exit(1);
  });


