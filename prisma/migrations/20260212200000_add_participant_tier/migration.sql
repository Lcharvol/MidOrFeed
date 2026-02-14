-- AlterTable
ALTER TABLE "match_participants" ADD COLUMN "participantTier" TEXT;

-- CreateIndex
CREATE INDEX "match_participants_championId_participantTier_idx" ON "match_participants"("championId", "participantTier");

-- CreateIndex
CREATE INDEX "match_participants_participantTier_idx" ON "match_participants"("participantTier");
