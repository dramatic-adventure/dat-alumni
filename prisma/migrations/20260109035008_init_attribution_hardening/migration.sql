-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "RecurringGift" (
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
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DonationPayment" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "StripeWebhookEvent_createdAt_idx" ON "StripeWebhookEvent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringGift_stripeSubscriptionId_key" ON "RecurringGift"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "RecurringGift_donorKey_idx" ON "RecurringGift"("donorKey");

-- CreateIndex
CREATE INDEX "RecurringGift_status_idx" ON "RecurringGift"("status");

-- CreateIndex
CREATE INDEX "RecurringGift_createdAt_idx" ON "RecurringGift"("createdAt");

-- CreateIndex
CREATE INDEX "RecurringGift_campaignSlug_idx" ON "RecurringGift"("campaignSlug");

-- CreateIndex
CREATE INDEX "RecurringGift_contextType_contextId_idx" ON "RecurringGift"("contextType", "contextId");

-- CreateIndex
CREATE INDEX "RecurringGift_tierId_idx" ON "RecurringGift"("tierId");

-- CreateIndex
CREATE UNIQUE INDEX "DonationPayment_stripePaymentIntentId_key" ON "DonationPayment"("stripePaymentIntentId");

-- CreateIndex
CREATE UNIQUE INDEX "DonationPayment_stripeInvoiceId_key" ON "DonationPayment"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "DonationPayment_donorKey_idx" ON "DonationPayment"("donorKey");

-- CreateIndex
CREATE INDEX "DonationPayment_createdAt_idx" ON "DonationPayment"("createdAt");

-- CreateIndex
CREATE INDEX "DonationPayment_stripeCustomerId_idx" ON "DonationPayment"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "DonationPayment_stripeSubscriptionId_idx" ON "DonationPayment"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "DonationPayment_status_idx" ON "DonationPayment"("status");

-- CreateIndex
CREATE INDEX "DonationPayment_campaignSlug_idx" ON "DonationPayment"("campaignSlug");

-- CreateIndex
CREATE INDEX "DonationPayment_contextType_contextId_idx" ON "DonationPayment"("contextType", "contextId");

-- CreateIndex
CREATE INDEX "DonationPayment_tierId_idx" ON "DonationPayment"("tierId");
