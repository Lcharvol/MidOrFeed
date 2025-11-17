-- CreateTable
CREATE TABLE "champion_win_rate_history" (
    "id" TEXT NOT NULL,
    "championId" TEXT NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "totalGames" INTEGER NOT NULL,
    "totalWins" INTEGER NOT NULL,
    "totalLosses" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "champion_win_rate_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "champion_win_rate_history_championId_idx" ON "champion_win_rate_history"("championId");

-- CreateIndex
CREATE INDEX "champion_win_rate_history_championId_recordedAt_idx" ON "champion_win_rate_history"("championId", "recordedAt");

-- CreateIndex
CREATE INDEX "champion_win_rate_history_recordedAt_idx" ON "champion_win_rate_history"("recordedAt");
