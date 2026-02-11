-- AlterTable: User.leagueAccountId SET NULL on delete
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_leagueAccountId_fkey";
ALTER TABLE "users" ADD CONSTRAINT "users_leagueAccountId_fkey"
  FOREIGN KEY ("leagueAccountId") REFERENCES "league_accounts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: FavoritePlayer -> User (cascade delete)
ALTER TABLE "favorite_players" ADD CONSTRAINT "favorite_players_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: CompositionSuggestion -> User (set null on delete)
ALTER TABLE "composition_suggestions" ADD CONSTRAINT "composition_suggestions_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex: FavoritePlayer(userId, createdAt)
CREATE INDEX IF NOT EXISTS "favorite_players_userId_createdAt_idx"
  ON "favorite_players"("userId", "createdAt");

-- CreateIndex: RankHistory(region, queueType, recordedAt DESC)
CREATE INDEX IF NOT EXISTS "rank_history_region_queueType_recordedAt_idx"
  ON "rank_history"("region", "queueType", "recordedAt" DESC);
