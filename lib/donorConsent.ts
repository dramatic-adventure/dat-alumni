// lib/donorConsent.ts
//
// Donor display-consent (SCAFFOLD).
//
// The donor wall is a *consent* problem, not a data problem: names already
// exist in the Neon `DonationPayment` table, but they may only be displayed
// publicly with explicit opt-in permission. This module is the single place
// the wall asks "which donors may I name?".
//
// STATUS: scaffold only. There is no consent column on DonationPayment yet,
// so `partitionDonorWall()` names NO ONE and folds every donor into the
// anonymized "+N more" count. When the opt-in flag is added at checkout
// (a `displayConsent` / `displayName` column + Stripe checkout wiring),
// update this function to surface consenting names — the donor wall UI needs
// no changes.

import type { CampaignTotals } from "@/lib/getCampaignTotals";

export type DonorWall = {
  /** Display names of donors who opted in to public recognition. */
  names: string[];
  /** Count of remaining (non-consenting / anonymous) donors → "+N more". */
  hiddenCount: number;
};

/**
 * Partition campaign totals into a consent-respecting donor wall.
 *
 * TODO: once DonationPayment has a display-consent flag, read consenting
 * supporters here and populate `names`. Until then, names is empty and every
 * donor is counted in `hiddenCount`.
 */
export function partitionDonorWall(totals: CampaignTotals): DonorWall {
  // No consent signal available yet → name no one.
  const names: string[] = [];
  const hiddenCount = Math.max(0, totals.donorCount - names.length);
  return { names, hiddenCount };
}
