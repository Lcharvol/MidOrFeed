-- AlterTable
ALTER TABLE "items" ADD COLUMN "maps" TEXT,
ADD COLUMN "inStore" BOOLEAN DEFAULT true,
ADD COLUMN "requiredChampion" TEXT;

-- CreateTable
CREATE TABLE "item_stats" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "totalGames" INTEGER NOT NULL DEFAULT 0,
    "totalWins" INTEGER NOT NULL DEFAULT 0,
    "winRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pickRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgKDA" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgKills" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgDeaths" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgAssists" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "lastAnalyzedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "item_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "item_stats_itemId_key" ON "item_stats"("itemId");

-- CreateIndex
CREATE INDEX "item_stats_itemId_idx" ON "item_stats"("itemId");

-- CreateIndex
CREATE INDEX "item_stats_score_idx" ON "item_stats"("score");

-- CreateIndex
CREATE INDEX "item_stats_winRate_idx" ON "item_stats"("winRate");
