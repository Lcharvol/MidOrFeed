import { prisma } from "../lib/prisma";

async function main() {
  console.log("[WIPE] Starting data wipe (keeping champions and items)...");

  // Order matters due to foreign keys
  await prisma.$transaction(async (tx) => {
    console.log("[WIPE] Deleting match participants...");
    await tx.matchParticipant.deleteMany({});

    console.log("[WIPE] Deleting matches...");
    await tx.match.deleteMany({});

    console.log("[WIPE] Deleting composition suggestions...");
    await tx.compositionSuggestion.deleteMany({});

    console.log("[WIPE] Deleting discovered players...");
    await tx.discoveredPlayer.deleteMany({});

    console.log("[WIPE] Unlinking users from league accounts...");
    await tx.user.updateMany({ data: { leagueAccountId: null } });

    console.log("[WIPE] Deleting league accounts...");
    await tx.leagueOfLegendsAccount.deleteMany({});
  });

  console.log("[WIPE] Completed. Champions and Items preserved.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
