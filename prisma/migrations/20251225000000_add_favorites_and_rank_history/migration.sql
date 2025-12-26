-- CreateTable
CREATE TABLE "favorite_players" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "puuid" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "gameName" TEXT,
    "tagLine" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorite_players_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rank_history" (
    "id" TEXT NOT NULL,
    "puuid" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "queueType" TEXT NOT NULL DEFAULT 'RANKED_SOLO_5x5',
    "tier" TEXT NOT NULL,
    "rank" TEXT NOT NULL,
    "leaguePoints" INTEGER NOT NULL,
    "wins" INTEGER NOT NULL,
    "losses" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rank_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "favorite_players_userId_idx" ON "favorite_players"("userId");

-- CreateIndex
CREATE INDEX "favorite_players_puuid_idx" ON "favorite_players"("puuid");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_players_userId_puuid_key" ON "favorite_players"("userId", "puuid");

-- CreateIndex
CREATE INDEX "rank_history_puuid_queueType_idx" ON "rank_history"("puuid", "queueType");

-- CreateIndex
CREATE INDEX "rank_history_puuid_recordedAt_idx" ON "rank_history"("puuid", "recordedAt");
