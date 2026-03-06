-- AlterTable
ALTER TABLE "composition_suggestions" ADD COLUMN IF NOT EXISTS "counters" TEXT;
ALTER TABLE "composition_suggestions" ADD COLUMN IF NOT EXISTS "roleSynergies" TEXT;
ALTER TABLE "composition_suggestions" ADD COLUMN IF NOT EXISTS "avgDamagePerMin" DOUBLE PRECISION;
ALTER TABLE "composition_suggestions" ADD COLUMN IF NOT EXISTS "avgGoldPerMin" DOUBLE PRECISION;
ALTER TABLE "composition_suggestions" ADD COLUMN IF NOT EXISTS "avgVisionPerMin" DOUBLE PRECISION;
ALTER TABLE "composition_suggestions" ADD COLUMN IF NOT EXISTS "aiReasoning" TEXT;
