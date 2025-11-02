/*
  Warnings:

  - You are about to drop the `riot_accounts` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "match_participants" ADD COLUMN "participantPUuid" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "riot_accounts";
PRAGMA foreign_keys=on;

-- CreateIndex
CREATE INDEX "match_participants_participantPUuid_idx" ON "match_participants"("participantPUuid");
