-- RedefineTables
CREATE TABLE "new_users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "riotGameName" TEXT,
    "riotTagLine" TEXT,
    "riotPuuid" TEXT,
    "riotSummonerId" TEXT,
    "riotRegion" TEXT,
    "subscriptionTier" TEXT NOT NULL DEFAULT 'free',
    "subscriptionExpiresAt" TIMESTAMP,
    "dailyAnalysesUsed" INTEGER NOT NULL DEFAULT 0,
    "lastDailyReset" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP NOT NULL
);

INSERT INTO "new_users" (
    "id",
    "email",
    "name",
    "password",
    "riotGameName",
    "riotTagLine",
    "riotPuuid",
    "riotSummonerId",
    "riotRegion",
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
    "riotGameName",
    "riotTagLine",
    "riotPuuid",
    "riotSummonerId",
    "riotRegion",
    'free',
    NULL,
    0,
    CURRENT_TIMESTAMP,
    COALESCE("createdAt", CURRENT_TIMESTAMP),
    COALESCE("updatedAt", CURRENT_TIMESTAMP)
FROM "users";

DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
