-- CreateTable
CREATE TABLE "game_versions" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "game_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "game_versions_version_key" ON "game_versions"("version");

-- Ensure only one current version at a time
CREATE UNIQUE INDEX "game_versions_isCurrent_unique" ON "game_versions"("isCurrent") WHERE "isCurrent" = true;

