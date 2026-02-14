-- AlterTable
ALTER TABLE "leaderboard_entries" ADD COLUMN "puuid" TEXT;

-- CreateIndex
CREATE INDEX "leaderboard_entries_puuid_idx" ON "leaderboard_entries"("puuid");
