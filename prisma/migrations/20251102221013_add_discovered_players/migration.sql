-- CreateTable
CREATE TABLE "discovered_players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "puuid" TEXT NOT NULL,
    "riotGameName" TEXT,
    "riotTagLine" TEXT,
    "riotRegion" TEXT NOT NULL,
    "lastCrawledAt" DATETIME,
    "crawlStatus" TEXT NOT NULL DEFAULT 'pending',
    "matchesCollected" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "discovered_players_puuid_key" ON "discovered_players"("puuid");

-- CreateIndex
CREATE INDEX "discovered_players_crawlStatus_idx" ON "discovered_players"("crawlStatus");

-- CreateIndex
CREATE INDEX "discovered_players_puuid_idx" ON "discovered_players"("puuid");

-- CreateIndex
CREATE INDEX "discovered_players_riotRegion_idx" ON "discovered_players"("riotRegion");
