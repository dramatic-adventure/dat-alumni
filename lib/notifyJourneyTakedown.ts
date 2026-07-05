// lib/notifyJourneyTakedown.ts
//
// Sends the artist an email when DAT takes down their Journey Card, including
// the recorded reason. Sends via the shared lib/sendEmail helper (Gmail API —
// see site-BUILD-SPEC-gmail-email.md). Non-fatal: if email isn't configured or
// the send fails, we log and return false — the takedown itself still succeeds
// and the reason is stored on the card row regardless.

import "server-only";
import { sendEmail } from "@/lib/sendEmail";

function takedownEmailHtml(opts: {
  artistName: string;
  cardLabel: string;
  reason: string;
}): string {
  const reason = opts.reason.trim()
    ? `<div style="margin: 0 0 1.25rem; font-size: 0.95rem; color: #241123; line-height: 1.6; background: #f2e9d8; border-radius: 10px; padding: 1rem;">${escapeHtml(opts.reason)}</div>`
    : "";
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; background: #fdf9f1; border: 1px solid #e5d8c0; border-radius: 14px; overflow: hidden;">
      <div style="background: #241123; padding: 1.75rem 2rem;">
        <p style="margin: 0 0 0.4rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.28em; color: rgba(255,204,0,0.7);">Dramatic Adventure Theatre</p>
        <h1 style="margin: 0; font-size: 1.4rem; color: #FFCC00; line-height: 1.2;">Your Journey Card was taken down</h1>
      </div>
      <div style="padding: 2rem;">
        <p style="margin: 0 0 1rem; font-size: 1rem; color: #241123; line-height: 1.6;">
          Hi ${escapeHtml(opts.artistName || "there")},
        </p>
        <p style="margin: 0 0 1.25rem; font-size: 1rem; color: #241123; line-height: 1.6;">
          Your Journey Card <strong>${escapeHtml(opts.cardLabel)}</strong> has been removed from public view by Dramatic Adventure Theatre.
        </p>
        ${reason}
        <p style="margin: 0; font-size: 0.85rem; color: rgba(36,17,35,0.55); line-height: 1.6;">
          If you have questions, just reply to this email and we'll be in touch.
        </p>
      </div>
    </div>
  `;
}

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function notifyJourneyTakedown(opts: {
  toEmail: string;
  artistName: string;
  cardLabel: string;
  reason: string;
}): Promise<boolean> {
  const to = String(opts.toEmail ?? "").trim();
  if (!to) return false;

  const sent = await sendEmail({
    to,
    subject: "Your DAT Journey Card was taken down",
    html: takedownEmailHtml({
      artistName: opts.artistName,
      cardLabel: opts.cardLabel,
      reason: opts.reason,
    }),
  });
  if (!sent.ok) {
    console.warn(
      "[journey-takedown] email send failed — reason stored, but artist not emailed:",
      sent.error
    );
    return false;
  }
  return true;
}
