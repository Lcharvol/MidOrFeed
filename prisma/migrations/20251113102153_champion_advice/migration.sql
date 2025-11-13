-- CreateTable
CREATE TABLE "champion_advices" (
    "id" TEXT NOT NULL,
    "championId" TEXT NOT NULL,
    "authorId" TEXT,
    "authorName" TEXT,
    "content" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "champion_advices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "champion_advice_votes" (
    "id" TEXT NOT NULL,
    "adviceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "champion_advice_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "champion_advices_championId_idx" ON "champion_advices"("championId");

-- CreateIndex
CREATE INDEX "champion_advices_score_createdAt_idx" ON "champion_advices"("score", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "champion_advice_votes_adviceId_userId_key" ON "champion_advice_votes"("adviceId", "userId");

-- AddForeignKey
ALTER TABLE "champion_advices" ADD CONSTRAINT "champion_advices_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "champion_advice_votes" ADD CONSTRAINT "champion_advice_votes_adviceId_fkey" FOREIGN KEY ("adviceId") REFERENCES "champion_advices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "champion_advice_votes" ADD CONSTRAINT "champion_advice_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
