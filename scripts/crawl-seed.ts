#!/usr/bin/env ts-node

/**
 * Script de seed pour découvrir de nouveaux joueurs
 * Usage: pnpm tsx scripts/crawl-seed.ts [region] [count]
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const region = process.argv[2] || "euw1";
  const count = parseInt(process.argv[3] || "20");

  console.log(`🌱 Seeding ${count} players for region ${region}...`);

  try {
    const response = await fetch(`http://localhost:3000/api/crawl/seed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region, count }),
    });

    const result = await response.json();
    console.log("✅ Seed completed:", result);
  } catch (error) {
    console.error("❌ Seed error:", error);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
