-- CreateIndex
CREATE INDEX "champion_guide_comments_guideId_parentId_idx" ON "champion_guide_comments"("guideId", "parentId");

-- CreateIndex
CREATE INDEX "champion_guide_comment_votes_userId_idx" ON "champion_guide_comment_votes"("userId");
