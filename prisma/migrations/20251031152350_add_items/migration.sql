-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "itemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "plaintext" TEXT,
    "image" TEXT,
    "gold" TEXT,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "items_itemId_key" ON "items"("itemId");

-- CreateIndex
CREATE UNIQUE INDEX "items_name_key" ON "items"("name");
