-- AlterTable
ALTER TABLE "DonationPayment" ADD COLUMN "donorEmailNorm" TEXT;

-- CreateTable
CREATE TABLE "DonorSummary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorKey" TEXT,
    "donorEmailNorm" TEXT,
    "rolling365UsdMinor" INTEGER NOT NULL DEFAULT 0,
    "tier" TEXT NOT NULL DEFAULT 'community',
    "lastTierEmailed" TEXT,
    "lastTierComputedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "DonorSummary_donorKey_key" ON "DonorSummary"("donorKey");

-- CreateIndex
CREATE UNIQUE INDEX "DonorSummary_donorEmailNorm_key" ON "DonorSummary"("donorEmailNorm");

-- CreateIndex
CREATE INDEX "DonorSummary_tier_idx" ON "DonorSummary"("tier");

-- CreateIndex
CREATE INDEX "DonationPayment_donorKey_createdAt_idx" ON "DonationPayment"("donorKey", "createdAt");

-- CreateIndex
CREATE INDEX "DonationPayment_donorEmailNorm_createdAt_idx" ON "DonationPayment"("donorEmailNorm", "createdAt");
