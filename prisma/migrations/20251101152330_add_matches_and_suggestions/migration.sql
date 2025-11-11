-- CreateTable
CREATE TABLE "matches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "gameCreation" BIGINT NOT NULL,
    "gameDuration" INTEGER NOT NULL,
    "gameMode" TEXT NOT NULL,
    "gameType" TEXT NOT NULL,
    "gameVersion" TEXT NOT NULL,
    "mapId" INTEGER NOT NULL,
    "platformId" TEXT NOT NULL,
    "queueId" INTEGER NOT NULL,
    "region" TEXT NOT NULL,
    "blueTeamWon" BOOLEAN,
    "redTeamWon" BOOLEAN,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateTable
CREATE TABLE "match_participants" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "participantId" INTEGER NOT NULL,
    "teamId" INTEGER NOT NULL,
    "championId" TEXT NOT NULL,
    "role" TEXT,
    "lane" TEXT,
    "kills" INTEGER NOT NULL DEFAULT 0,
    "deaths" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "goldEarned" INTEGER NOT NULL DEFAULT 0,
    "goldSpent" INTEGER NOT NULL DEFAULT 0,
    "totalDamageDealtToChampions" INTEGER NOT NULL DEFAULT 0,
    "totalDamageTaken" INTEGER NOT NULL DEFAULT 0,
    "visionScore" INTEGER NOT NULL DEFAULT 0,
    "win" BOOLEAN NOT NULL DEFAULT false,
    "item0" INTEGER,
    "item1" INTEGER,
    "item2" INTEGER,
    "item3" INTEGER,
    "item4" INTEGER,
    "item5" INTEGER,
    "item6" INTEGER,
    "summoner1Id" INTEGER,
    "summoner2Id" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "match_participants_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "matches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "composition_suggestions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "teamChampions" TEXT NOT NULL,
    "enemyChampions" TEXT,
    "role" TEXT NOT NULL,
    "suggestedChampion" TEXT NOT NULL,
    "confidence" REAL NOT NULL DEFAULT 0,
    "reasoning" TEXT,
    "gameMode" TEXT,
    "tier" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "matches_matchId_key" ON "matches"("matchId");

-- CreateIndex
CREATE INDEX "matches_platformId_idx" ON "matches"("platformId");

-- CreateIndex
CREATE INDEX "matches_queueId_idx" ON "matches"("queueId");

-- CreateIndex
CREATE INDEX "matches_gameCreation_idx" ON "matches"("gameCreation");

-- CreateIndex
CREATE INDEX "match_participants_championId_idx" ON "match_participants"("championId");

-- CreateIndex
CREATE INDEX "match_participants_teamId_idx" ON "match_participants"("teamId");

-- CreateIndex
CREATE INDEX "match_participants_matchId_idx" ON "match_participants"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "match_participants_matchId_participantId_key" ON "match_participants"("matchId", "participantId");

-- CreateIndex
CREATE INDEX "composition_suggestions_role_idx" ON "composition_suggestions"("role");

-- CreateIndex
CREATE INDEX "composition_suggestions_userId_idx" ON "composition_suggestions"("userId");
