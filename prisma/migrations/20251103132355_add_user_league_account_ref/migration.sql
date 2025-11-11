/*
  Warnings:

  - You are about to drop the column `riotGameName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `riotPuuid` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `riotRegion` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `riotSummonerId` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `riotTagLine` on the `users` table. All the data in the column will be lost.
*/
-- RedefineTables
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "leagueAccountId" TEXT,
    "role" TEXT NOT NULL DEFAULT 'user',
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "subscriptionExpiresAt" TIMESTAMP,
    "dailyAnalysesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastDailyReset" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL,
    CONSTRAINT "users_leagueAccountId_fkey" FOREIGN KEY ("leagueAccountId") REFERENCES "league_accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

INSERT INTO "new_users" (
    "id",
    "email",
    "name",
    "password",
    "leagueAccountId",
    "role",
    "subscriptionTier",
    "subscriptionExpiresAt",
    "dailyAnalysesUsed",
    "lastDailyReset",
    "createdAt",
    "updatedAt"
)
SELECT
    "id",
    "email",
    "name",
    "password",
    NULL,
    'user',
    COALESCE("subscriptionTier", 'free'),
    "subscriptionExpiresAt",
    COALESCE("dailyAnalysesUsed", 0),
    COALESCE("lastDailyReset", CURRENT_TIMESTAMP),
    COALESCE("createdAt", CURRENT_TIMESTAMP),
    COALESCE("updatedAt", CURRENT_TIMESTAMP)
FROM "users";

DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
