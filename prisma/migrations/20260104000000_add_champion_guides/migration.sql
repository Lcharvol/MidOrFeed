-- CreateTable
CREATE TABLE "champion_guides" (
    "id" TEXT NOT NULL,
    "championId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "title" TEXT NOT NULL,
    "introduction" TEXT,
    "itemBuild" JSONB,
    "skillOrder" JSONB,
    "runeConfig" JSONB,
    "summonerSpells" JSONB,
    "earlyGameTips" TEXT,
    "midGameTips" TEXT,
    "lateGameTips" TEXT,
    "goodMatchups" JSONB,
    "badMatchups" JSONB,
    "strengths" JSONB,
    "weaknesses" JSONB,
    "patchVersion" TEXT,
    "role" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "champion_guides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "champion_guide_votes" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "champion_guide_votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "champion_guide_comments" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "content" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "champion_guide_comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "champion_guide_comment_votes" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "champion_guide_comment_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "champion_guides_championId_idx" ON "champion_guides"("championId");

-- CreateIndex
CREATE INDEX "champion_guides_authorId_idx" ON "champion_guides"("authorId");

-- CreateIndex
CREATE INDEX "champion_guides_score_createdAt_idx" ON "champion_guides"("score", "createdAt");

-- CreateIndex
CREATE INDEX "champion_guides_championId_role_idx" ON "champion_guides"("championId", "role");

-- CreateIndex
CREATE INDEX "champion_guides_status_championId_idx" ON "champion_guides"("status", "championId");

-- CreateIndex
CREATE INDEX "champion_guides_viewCount_createdAt_idx" ON "champion_guides"("viewCount", "createdAt");

-- CreateIndex
CREATE INDEX "champion_guides_patchVersion_idx" ON "champion_guides"("patchVersion");

-- CreateIndex
CREATE INDEX "champion_guide_votes_userId_idx" ON "champion_guide_votes"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "champion_guide_votes_guideId_userId_key" ON "champion_guide_votes"("guideId", "userId");

-- CreateIndex
CREATE INDEX "champion_guide_comments_guideId_idx" ON "champion_guide_comments"("guideId");

-- CreateIndex
CREATE INDEX "champion_guide_comments_authorId_idx" ON "champion_guide_comments"("authorId");

-- CreateIndex
CREATE INDEX "champion_guide_comments_parentId_idx" ON "champion_guide_comments"("parentId");

-- CreateIndex
CREATE INDEX "champion_guide_comments_score_idx" ON "champion_guide_comments"("score");

-- CreateIndex
CREATE UNIQUE INDEX "champion_guide_comment_votes_commentId_userId_key" ON "champion_guide_comment_votes"("commentId", "userId");

-- AddForeignKey
ALTER TABLE "champion_guides" ADD CONSTRAINT "champion_guides_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "champion_guide_votes" ADD CONSTRAINT "champion_guide_votes_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "champion_guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "champion_guide_votes" ADD CONSTRAINT "champion_guide_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "champion_guide_comments" ADD CONSTRAINT "champion_guide_comments_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "champion_guides"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "champion_guide_comments" ADD CONSTRAINT "champion_guide_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "champion_guide_comments" ADD CONSTRAINT "champion_guide_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "champion_guide_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "champion_guide_comment_votes" ADD CONSTRAINT "champion_guide_comment_votes_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "champion_guide_comments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "champion_guide_comment_votes" ADD CONSTRAINT "champion_guide_comment_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
