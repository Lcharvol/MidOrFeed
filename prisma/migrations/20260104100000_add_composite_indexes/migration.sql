-- Add composite indexes for better query performance

-- MatchParticipant composite indexes
CREATE INDEX IF NOT EXISTS "match_participants_championId_role_idx" ON "match_participants"("championId", "role");
CREATE INDEX IF NOT EXISTS "match_participants_participantPUuid_createdAt_idx" ON "match_participants"("participantPUuid", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "match_participants_championId_win_idx" ON "match_participants"("championId", "win");

-- Match composite indexes
CREATE INDEX IF NOT EXISTS "matches_region_gameCreation_idx" ON "matches"("region", "gameCreation" DESC);
CREATE INDEX IF NOT EXISTS "matches_queueId_gameCreation_idx" ON "matches"("queueId", "gameCreation" DESC);
