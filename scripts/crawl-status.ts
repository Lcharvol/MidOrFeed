#!/usr/bin/env ts-node

/**
 * Script de statut pour afficher les statistiques de crawl
 * Usage: pnpm tsx scripts/crawl-status.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("📊 Crawl status:");

  try {
    const stats = await prisma.discoveredPlayer.groupBy({
      by: ["crawlStatus"],
      _count: { id: true },
    });

    const total = await prisma.discoveredPlayer.count();
    const totalMatches = await prisma.discoveredPlayer.aggregate({
      _sum: { matchesCollected: true },
    });
    const totalAccounts = await prisma.leagueOfLegendsAccount.count();

    console.log(`\nTotal players: ${total}`);
    console.log(
      `Total matches collected: ${totalMatches._sum.matchesCollected || 0}`
    );
    console.log(`Total League accounts: ${totalAccounts}`);
    console.log("\nBy status:");
    stats.forEach((stat) => {
      console.log(`  ${stat.crawlStatus}: ${stat._count.id}`);
    });
  } catch (error) {
    console.error("❌ Status error:", error);
  }

  await prisma.$disconnect();
}

main().catch(console.error);
