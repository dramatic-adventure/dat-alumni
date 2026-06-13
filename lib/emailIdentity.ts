// /lib/emailIdentity.ts
//
// Shared email identity normalization for the email-based auth flows
// (sign-in codes + email/password accounts). Using the same normalization
// everywhere means a code sent to "J.Doe+dat@gmail.com" and a password
// account created for "jdoe@gmail.com" resolve to the same identity —
// consistent with how lib/ownership.ts matches signed-in emails to alumni
// records.
import "server-only";

/** Normalize gmail/googlemail and strip +tag/dots for gmail. Lowercases + trims all emails. */
export function normalizeEmailIdentity(raw: string): string {
  const e = String(raw || "").trim().toLowerCase();
  const [user, domain] = e.split("@");
  if (!user || !domain) return e;
  const canon = domain === "googlemail.com" ? "gmail.com" : domain;
  if (canon !== "gmail.com") return `${user}@${canon}`;
  const noPlus = user.split("+")[0];
  const noDots = noPlus.replace(/\./g, "");
  return `${noDots}@gmail.com`;
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
