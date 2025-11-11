-- CreateTable
CREATE TABLE "ml_training_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'running',
    "message" TEXT,
    "logs" TEXT
);

-- CreateTable
CREATE TABLE "ml_predictions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "trainingRunId" TEXT NOT NULL,
    "matchId" TEXT,
    "participantPUuid" TEXT,
    "championId" TEXT NOT NULL,
    "queueId" INTEGER,
    "teamId" INTEGER,
    "winProbability" REAL NOT NULL,
    "sampleCount" INTEGER,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ml_predictions_trainingRunId_fkey" FOREIGN KEY ("trainingRunId") REFERENCES "ml_training_runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ml_predictions_championId_idx" ON "ml_predictions"("championId");

-- CreateIndex
CREATE INDEX "ml_predictions_matchId_idx" ON "ml_predictions"("matchId");

