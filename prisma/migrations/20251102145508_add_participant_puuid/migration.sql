/*
  Warnings:

  - You are about to drop the `riot_accounts` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "match_participants" ADD COLUMN "participantPUuid" TEXT;

-- DropTable
DROP TABLE IF EXISTS "riot_accounts";

-- CreateIndex
CREATE INDEX "match_participants_participantPUuid_idx" ON "match_participants"("participantPUuid");
