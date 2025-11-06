-- CreateTable
CREATE TABLE "champion_stats" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "championId" TEXT NOT NULL,
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "totalWins" INTEGER NOT NULL DEFAULT 0,
    "totalLosses" INTEGER NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgKills" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgDeaths" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgAssists" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgKDA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgGoldEarned" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgGoldSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgDamageDealt" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgDamageTaken" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgVisionScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topRole" TEXT,
    "topLane" TEXT,
    "lastAnalyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "champion_stats_championId_key" ON "champion_stats"("championId");

-- CreateIndex
CREATE INDEX "champion_stats_championId_idx" ON "champion_stats"("championId");

-- CreateIndex
CREATE INDEX "champion_stats_winRate_idx" ON "champion_stats"("winRate");

-- CreateIndex
CREATE INDEX "champion_stats_totalGames_idx" ON "champion_stats"("totalGames");

