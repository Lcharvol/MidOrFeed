-- CreateTable
CREATE TABLE "league_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "puuid" TEXT NOT NULL,
    "riotGameName" TEXT,
    "riotTagLine" TEXT,
    "riotRegion" TEXT NOT NULL,
    "riotSummonerId" TEXT,
    "riotAccountId" TEXT,
    "summonerLevel" INTEGER,
    "profileIconId" INTEGER,
    "revisionDate" BIGINT,
    "totalMatches" INTEGER NOT NULL DEFAULT 0,
    "totalWins" INTEGER NOT NULL DEFAULT 0,
    "totalLosses" INTEGER NOT NULL DEFAULT 0,
    "winRate" REAL NOT NULL DEFAULT 0,
    "avgKDA" REAL NOT NULL DEFAULT 0,
    "mostPlayedChampion" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "league_accounts_puuid_key" ON "league_accounts"("puuid");

-- CreateIndex
CREATE INDEX "league_accounts_puuid_idx" ON "league_accounts"("puuid");

-- CreateIndex
CREATE INDEX "league_accounts_riotRegion_idx" ON "league_accounts"("riotRegion");

-- CreateIndex
CREATE INDEX "league_accounts_riotGameName_idx" ON "league_accounts"("riotGameName");
