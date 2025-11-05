-- CreateTable
CREATE TABLE "leaderboard_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "region" TEXT NOT NULL,
    "queueType" TEXT NOT NULL DEFAULT 'RANKED_SOLO_5x5',
    "tier" TEXT NOT NULL,
    "rank" TEXT,
    "summonerId" TEXT NOT NULL,
    "summonerName" TEXT NOT NULL,
    "leaguePoints" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "leaderboard_entries_region_tier_idx" ON "leaderboard_entries"("region", "tier");

-- CreateIndex
CREATE UNIQUE INDEX "leaderboard_entries_region_queueType_tier_summonerId_key" ON "leaderboard_entries"("region", "queueType", "tier", "summonerId");
