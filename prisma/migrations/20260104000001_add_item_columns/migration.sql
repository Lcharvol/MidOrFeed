-- Add missing columns to items table
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "tags" TEXT;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "depth" INTEGER;
ALTER TABLE "items" ADD COLUMN IF NOT EXISTS "fromItems" TEXT;
