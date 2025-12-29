-- AlterTable
ALTER TABLE "match_participants" ADD COLUMN IF NOT EXISTS "riotIdGameName" TEXT;
ALTER TABLE "match_participants" ADD COLUMN IF NOT EXISTS "riotIdTagline" TEXT;
