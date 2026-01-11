-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DonationPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "donorKey" TEXT,
    "donorEmail" TEXT,
    "donorName" TEXT,
    "billingCountry" TEXT,
    "amountMinor" INTEGER NOT NULL,
    "currency" TEXT NOT NULL,
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
    "refundedAmountMinor" INTEGER,
    "refundedAt" DATETIME,
    "disputeStatus" TEXT,
    "stripeEventId" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "stripeCustomerId" TEXT,
    "stripePaymentIntentId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripeInvoiceId" TEXT,
    "periodStart" DATETIME,
    "periodEnd" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_DonationPayment" ("amountMinor", "amountType", "billingCountry", "campaignSlug", "contextId", "contextLabel", "contextType", "createdAt", "currency", "disputeStatus", "donorEmail", "donorKey", "donorName", "id", "kind", "landingPath", "periodEnd", "periodStart", "referrer", "refundedAmountMinor", "refundedAt", "status", "stripeCustomerId", "stripeEventId", "stripeInvoiceId", "stripePaymentIntentId", "stripeSessionId", "stripeSubscriptionId", "tierId", "tierLabel", "updatedAt", "utmCampaign", "utmContent", "utmMedium", "utmSource", "utmTerm") SELECT "amountMinor", "amountType", "billingCountry", "campaignSlug", "contextId", "contextLabel", "contextType", "createdAt", "currency", "disputeStatus", "donorEmail", "donorKey", "donorName", "id", "kind", "landingPath", "periodEnd", "periodStart", "referrer", "refundedAmountMinor", "refundedAt", "status", "stripeCustomerId", "stripeEventId", "stripeInvoiceId", "stripePaymentIntentId", "stripeSessionId", "stripeSubscriptionId", "tierId", "tierLabel", coalesce("updatedAt", CURRENT_TIMESTAMP) AS "updatedAt", "utmCampaign", "utmContent", "utmMedium", "utmSource", "utmTerm" FROM "DonationPayment";
DROP TABLE "DonationPayment";
ALTER TABLE "new_DonationPayment" RENAME TO "DonationPayment";
CREATE UNIQUE INDEX "DonationPayment_stripePaymentIntentId_key" ON "DonationPayment"("stripePaymentIntentId");
CREATE UNIQUE INDEX "DonationPayment_stripeInvoiceId_key" ON "DonationPayment"("stripeInvoiceId");
CREATE INDEX "DonationPayment_donorKey_idx" ON "DonationPayment"("donorKey");
CREATE INDEX "DonationPayment_createdAt_idx" ON "DonationPayment"("createdAt");
CREATE INDEX "DonationPayment_stripeCustomerId_idx" ON "DonationPayment"("stripeCustomerId");
CREATE INDEX "DonationPayment_stripeSubscriptionId_idx" ON "DonationPayment"("stripeSubscriptionId");
CREATE INDEX "DonationPayment_status_idx" ON "DonationPayment"("status");
CREATE INDEX "DonationPayment_campaignSlug_idx" ON "DonationPayment"("campaignSlug");
CREATE INDEX "DonationPayment_contextType_contextId_idx" ON "DonationPayment"("contextType", "contextId");
CREATE INDEX "DonationPayment_tierId_idx" ON "DonationPayment"("tierId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
