-- CreateTable
CREATE TABLE "draft_history" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "blueWinProbability" DOUBLE PRECISION NOT NULL,
    "bluePicks" JSONB NOT NULL,
    "redPicks" JSONB NOT NULL,
    "blueAvgWinRate" DOUBLE PRECISION NOT NULL,
    "blueAvgKDA" DOUBLE PRECISION NOT NULL,
    "blueAvgScore" DOUBLE PRECISION NOT NULL,
    "redAvgWinRate" DOUBLE PRECISION NOT NULL,
    "redAvgKDA" DOUBLE PRECISION NOT NULL,
    "redAvgScore" DOUBLE PRECISION NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "draft_history_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "draft_history_userId_recordedAt_idx" ON "draft_history"("userId", "recordedAt");

-- AddForeignKey
ALTER TABLE "draft_history" ADD CONSTRAINT "draft_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
