-- CreateTable
CREATE TABLE "compositions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "top" TEXT,
    "jungle" TEXT,
    "mid" TEXT,
    "adc" TEXT,
    "support" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE INDEX "compositions_userId_idx" ON "compositions"("userId");

-- AddForeignKey
ALTER TABLE "compositions" ADD CONSTRAINT "compositions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

