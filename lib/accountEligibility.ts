// lib/accountEligibility.ts
//
// Gate for who may create/reset an email+password account (see
// app/api/auth/email-code/request and app/api/auth/account/set-password).
// Anyone who completes this flow gets a permanent AlumniCredential row that
// lets them sign in as that email indefinitely, so before sending a code or
// setting a password we require the email to be one of:
//
//   1. An existing Profile-Owner — already linked to an alumni profile
//      (password reset for a known account).
//   2. An admin (ADMIN_EMAILS).
//   3. Backed by a valid, unused, unexpired invite token — first-time setup
//      for an artist without a Google account, redeeming an invite.
import "server-only";
import { isAdmin, getAlumniIdForOwnerEmail } from "@/lib/ownership";
import { getInvitePreview } from "@/lib/invites";

export const INELIGIBLE_EMAIL_ERROR =
  "We don't recognize that email. If you have an invite link, use that to sign in — or email hello@dramaticadventure.com and we'll help.";

export async function isEligibleForPasswordAccount(
  rawEmail: string,
  inviteToken?: string
): Promise<boolean> {
  const email = String(rawEmail || "").trim().toLowerCase();
  if (!email) return false;

  if (isAdmin(email)) return true;

  const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
  if (spreadsheetId) {
    const ownedId = await getAlumniIdForOwnerEmail(spreadsheetId, email);
    if (ownedId) return true;
  }

  const token = String(inviteToken || "").trim();
  if (token) {
    const preview = await getInvitePreview(token);
    if (preview.ok && !preview.expired && !preview.used) return true;
  }

  return false;
}
