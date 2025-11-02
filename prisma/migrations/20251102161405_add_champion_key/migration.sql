-- AlterTable
ALTER TABLE "champions" ADD COLUMN "championKey" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "champions_championKey_key" ON "champions"("championKey");
