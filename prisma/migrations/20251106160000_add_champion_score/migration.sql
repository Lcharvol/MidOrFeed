-- AlterTable
ALTER TABLE "champion_stats" ADD COLUMN "score" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "champion_stats_score_idx" ON "champion_stats"("score");

