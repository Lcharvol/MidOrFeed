-- CreateTable
CREATE TABLE "champions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "championId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "blurb" TEXT,
    "attack" INTEGER NOT NULL,
    "defense" INTEGER NOT NULL,
    "magic" INTEGER NOT NULL,
    "difficulty" INTEGER NOT NULL,
    "hp" REAL NOT NULL,
    "hpPerLevel" REAL NOT NULL,
    "mp" REAL,
    "mpPerLevel" REAL,
    "moveSpeed" INTEGER NOT NULL,
    "armor" REAL NOT NULL,
    "armorPerLevel" REAL NOT NULL,
    "spellBlock" REAL NOT NULL,
    "spellBlockPerLevel" REAL NOT NULL,
    "attackRange" REAL NOT NULL,
    "hpRegen" REAL NOT NULL,
    "hpRegenPerLevel" REAL NOT NULL,
    "mpRegen" REAL,
    "mpRegenPerLevel" REAL,
    "crit" REAL NOT NULL,
    "critPerLevel" REAL NOT NULL,
    "attackDamage" REAL NOT NULL,
    "attackDamagePerLevel" REAL NOT NULL,
    "attackSpeed" REAL NOT NULL,
    "attackSpeedPerLevel" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "champions_championId_key" ON "champions"("championId");

-- CreateIndex
CREATE UNIQUE INDEX "champions_name_key" ON "champions"("name");
