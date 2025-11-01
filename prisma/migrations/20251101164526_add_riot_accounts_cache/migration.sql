-- CreateTable
CREATE TABLE "riot_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "gameName" TEXT NOT NULL,
    "tagLine" TEXT NOT NULL,
    "puuid" TEXT,
    "region" TEXT,
    "lastSearched" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "searchCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "riot_accounts_gameName_idx" ON "riot_accounts"("gameName");

-- CreateIndex
CREATE INDEX "riot_accounts_lastSearched_idx" ON "riot_accounts"("lastSearched");

-- CreateIndex
CREATE UNIQUE INDEX "riot_accounts_gameName_tagLine_key" ON "riot_accounts"("gameName", "tagLine");
