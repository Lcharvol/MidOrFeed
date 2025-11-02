#!/usr/bin/env ts-node

/**
 * Script de traitement pour crawler les joueurs en attente
 * Usage: pnpm tsx scripts/crawl-process.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Processing pending players...");

  try {
    const response = await fetch(`http://localhost:3000/api/crawl/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    const result = await response.json();
    console.log("✅ Process completed:", result);
  } catch (error) {
    console.error("❌ Process error:", error);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
