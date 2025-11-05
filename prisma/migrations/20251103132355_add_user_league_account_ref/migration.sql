/*
  Warnings:

  - You are about to drop the column `riotGameName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `riotPuuid` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `riotRegion` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `riotSummonerId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `riotTagLine` on the `users` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "leagueAccountId" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "subscriptionExpiresAt" DATETIME,
    "dailyAnalysesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastDailyReset" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "users_leagueAccountId_fkey" FOREIGN KEY ("leagueAccountId") REFERENCES "league_accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_users" ("createdAt", "dailyAnalysesUsed", "email", "id", "lastDailyReset", "name", "password", "subscriptionExpiresAt", "subscriptionTier", "updatedAt") SELECT "createdAt", "dailyAnalysesUsed", "email", "id", "lastDailyReset", "name", "password", "subscriptionExpiresAt", "subscriptionTier", "updatedAt" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
