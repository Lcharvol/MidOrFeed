-- CreateTable
CREATE TABLE "summoner_overview_history" (
    "id" TEXT NOT NULL,
    "summonerId" TEXT NOT NULL,
    "totalGames" INTEGER NOT NULL,
    "totalWins" INTEGER NOT NULL,
    "winRate" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "summoner_overview_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "summoner_overview_history_summonerId_recordedAt_idx" ON "summoner_overview_history"("summonerId", "recordedAt");

-- AddForeignKey
ALTER TABLE "summoner_overview_history" ADD CONSTRAINT "summoner_overview_history_summonerId_fkey" FOREIGN KEY ("summonerId") REFERENCES "league_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
