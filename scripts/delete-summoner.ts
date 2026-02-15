/**
 * Delete a summoner and all related data from the database.
 *
 * Usage:
 *   npx tsx scripts/delete-summoner.ts <puuid>
 *
 * Example:
 *   npx tsx scripts/delete-summoner.ts "31-8-T0O5cFFXThkIffjuMXfB-Q92An7rwiHeojyfoBKJ1LzII1S9z75LmfSpwc7LFxk3RWwyINKSw"
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const puuid = process.argv[2];
  if (!puuid) {
    console.error("Usage: npx tsx scripts/delete-summoner.ts <puuid>");
    process.exit(1);
  }

  console.log(`Deleting summoner with puuid: ${puuid}\n`);

  // 1. Find the LeagueOfLegendsAccount
  const account = await prisma.leagueOfLegendsAccount.findUnique({
    where: { puuid },
    select: { id: true, riotGameName: true, riotTagLine: true },
  });

  if (account) {
    console.log(`Found account: ${account.riotGameName}#${account.riotTagLine} (${account.id})`);

    // Unlink users referencing this account
    const unlinked = await prisma.user.updateMany({
      where: { leagueAccountId: account.id },
      data: { leagueAccountId: null, riotPuuid: null, riotRegion: null },
    });
    console.log(`  Unlinked ${unlinked.count} user(s)`);

    // Delete cascading relations (PlayerChallenge, SummonerOverviewHistory)
    // then the account itself
    await prisma.leagueOfLegendsAccount.delete({ where: { id: account.id } });
    console.log(`  Deleted LeagueOfLegendsAccount`);
  } else {
    console.log("No LeagueOfLegendsAccount found");
  }

  // 2. DiscoveredPlayer
  const discovered = await prisma.discoveredPlayer.deleteMany({ where: { puuid } });
  console.log(`Deleted ${discovered.count} DiscoveredPlayer(s)`);

  // 3. LeaderboardEntry
  const leaderboard = await prisma.leaderboardEntry.deleteMany({ where: { puuid } });
  console.log(`Deleted ${leaderboard.count} LeaderboardEntry(ies)`);

  // 4. FavoritePlayer
  const favorites = await prisma.favoritePlayer.deleteMany({ where: { puuid } });
  console.log(`Deleted ${favorites.count} FavoritePlayer(s)`);

  // 5. RankHistory
  const rankHistory = await prisma.rankHistory.deleteMany({ where: { puuid } });
  console.log(`Deleted ${rankHistory.count} RankHistory(ies)`);

  // 6. MatchParticipant (participantPUuid)
  const participants = await prisma.matchParticipant.deleteMany({
    where: { participantPUuid: puuid },
  });
  console.log(`Deleted ${participants.count} MatchParticipant(s)`);

  // 7. Sharded league_accounts_{region} tables
  const REGIONS = [
    "euw1", "eun1", "na1", "br1", "kr", "jp1", "ru", "tr1",
    "la1", "la2", "oc1", "ph2", "sg2", "th2", "tw2", "vn2",
  ];
  let shardedTotal = 0;
  for (const region of REGIONS) {
    const table = `league_accounts_${region.replace(/[^a-z0-9]/g, "_")}`;
    try {
      const result = await prisma.$executeRawUnsafe(
        `DELETE FROM "${table}" WHERE puuid = $1`,
        puuid
      );
      if (result > 0) {
        console.log(`Deleted ${result} row(s) from ${table}`);
        shardedTotal += result;
      }
    } catch {
      // Table may not exist
    }
  }
  if (shardedTotal === 0) {
    console.log("No sharded league_accounts rows found");
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
