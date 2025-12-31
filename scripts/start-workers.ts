/**
 * Script to start BullMQ workers
 * Run with: npx tsx scripts/start-workers.ts
 */

import { startAllWorkers } from "../lib/workers";

async function main() {
  console.log("=".repeat(50));
  console.log("Starting BullMQ Workers");
  console.log("=".repeat(50));

  try {
    await startAllWorkers();
    console.log("Workers are running. Press Ctrl+C to stop.");
  } catch (error) {
    console.error("Failed to start workers:", error);
    process.exit(1);
  }
}

main();
