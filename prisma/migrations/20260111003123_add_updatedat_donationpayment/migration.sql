ALTER TABLE "DonationPayment" ADD COLUMN "updatedAt" DATETIME;

-- Backfill existing rows so NOT NULL / @updatedAt semantics won't break
UPDATE "DonationPayment"
SET "updatedAt" = COALESCE("updatedAt", "createdAt", CURRENT_TIMESTAMP);
-- AlterTable

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_RecurringGift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorKey" TEXT,
    "donorEmail" TEXT,
    "donorName" TEXT,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "amountMinor" INTEGER NOT NULL,
    "campaignSlug" TEXT NOT NULL,
    "contextType" TEXT NOT NULL,
    "contextId" TEXT NOT NULL,
    "contextLabel" TEXT,
    "tierId" TEXT,
    "tierLabel" TEXT,
    "amountType" TEXT NOT NULL,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "referrer" TEXT,
    "landingPath" TEXT,
    "canceledAt" DATETIME,
    "currentPeriodEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_RecurringGift" ("amountMinor", "amountType", "campaignSlug", "canceledAt", "contextId", "contextLabel", "contextType", "createdAt", "currency", "currentPeriodEnd", "donorEmail", "donorKey", "donorName", "id", "landingPath", "referrer", "status", "stripeCustomerId", "stripeSubscriptionId", "tierId", "tierLabel", "updatedAt", "utmCampaign", "utmContent", "utmMedium", "utmSource", "utmTerm") SELECT "amountMinor", "amountType", "campaignSlug", "canceledAt", "contextId", "contextLabel", "contextType", "createdAt", "currency", "currentPeriodEnd", "donorEmail", "donorKey", "donorName", "id", "landingPath", "referrer", "status", "stripeCustomerId", "stripeSubscriptionId", "tierId", "tierLabel", "updatedAt", "utmCampaign", "utmContent", "utmMedium", "utmSource", "utmTerm" FROM "RecurringGift";
DROP TABLE "RecurringGift";
ALTER TABLE "new_RecurringGift" RENAME TO "RecurringGift";
CREATE UNIQUE INDEX "RecurringGift_stripeSubscriptionId_key" ON "RecurringGift"("stripeSubscriptionId");
CREATE INDEX "RecurringGift_donorKey_idx" ON "RecurringGift"("donorKey");
CREATE INDEX "RecurringGift_status_idx" ON "RecurringGift"("status");
CREATE INDEX "RecurringGift_createdAt_idx" ON "RecurringGift"("createdAt");
CREATE INDEX "RecurringGift_campaignSlug_idx" ON "RecurringGift"("campaignSlug");
CREATE INDEX "RecurringGift_contextType_contextId_idx" ON "RecurringGift"("contextType", "contextId");
CREATE INDEX "RecurringGift_tierId_idx" ON "RecurringGift"("tierId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
