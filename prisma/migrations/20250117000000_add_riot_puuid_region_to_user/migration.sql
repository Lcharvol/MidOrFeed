-- AlterTable
ALTER TABLE "users" ADD COLUMN "riotPuuid" TEXT;
ALTER TABLE "users" ADD COLUMN "riotRegion" TEXT;

-- CreateIndex
CREATE INDEX "users_riotPuuid_riotRegion_idx" ON "users"("riotPuuid", "riotRegion");

