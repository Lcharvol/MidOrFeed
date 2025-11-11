-- CreateTable
CREATE TABLE "challenges" (
    "challengeId" INTEGER NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "shortDescription" TEXT,
    "description" TEXT,
    "category" TEXT,
    "level" TEXT,
    "thresholds" JSON,
    "tags" TEXT,
    "maxValue" REAL,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateTable
CREATE TABLE "player_challenges" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "leagueAccountId" TEXT NOT NULL,
    "challengeId" INTEGER NOT NULL,
    "currentValue" REAL NOT NULL DEFAULT 0,
    "currentLevel" TEXT NOT NULL DEFAULT 'NONE',
    "highestLevel" TEXT,
    "percentile" REAL,
    "achievedTime" TIMESTAMP,
    "nextLevelValue" REAL,
    "progress" REAL,
    "pointsEarned" REAL,
    "completedLevels" TEXT,
    "lastUpdatedByRiot" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "player_challenges_leagueAccountId_fkey" FOREIGN KEY ("leagueAccountId") REFERENCES "league_accounts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "player_challenges_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "challenges" ("challengeId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "player_challenges_leagueAccountId_challengeId_key" ON "player_challenges"("leagueAccountId", "challengeId");
