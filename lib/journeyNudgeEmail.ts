// lib/journeyNudgeEmail.ts
//
// Slice 7 — the end-of-trip email half of the nudge (§5c). Sent a few days
// after the itinerary end date to cover the iOS-push gap. Same Resend HTTP
// pattern as lib/notifyJourneyTakedown.ts. Non-fatal: if Resend isn't
// configured or the send fails, we log and return false — the caller decides
// whether to record the attempt.
//
// Copy contract (§5c): a card already exists and is theirs to review — never
// "you forgot to do something," and it reads the same whether they've lived in
// Composer all trip or never opened it once.

import "server-only";

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "";

function escapeHtml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function nudgeEmailHtml(opts: { location: string; composerUrl: string }): string {
  const where = escapeHtml(opts.location || "the field");
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; background: #fdf9f1; border: 1px solid #e5d8c0; border-radius: 14px; overflow: hidden;">
      <div style="background: #241123; padding: 1.75rem 2rem;">
        <p style="margin: 0 0 0.4rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.28em; color: rgba(255,204,0,0.7);">Dramatic Adventure Theatre</p>
        <h1 style="margin: 0; font-size: 1.4rem; color: #FFCC00; line-height: 1.2;">Your Journey Card is waiting</h1>
      </div>
      <div style="padding: 2rem;">
        <p style="margin: 0 0 1.25rem; font-size: 1rem; color: #241123; line-height: 1.6;">
          We put together a Journey Card from what you captured in ${where} —
          your own words and photos, arranged into chapters. Nothing is public:
          it's a private draft only you can see.
        </p>
        <p style="margin: 0 0 1.5rem; font-size: 1rem; color: #241123; line-height: 1.6;">
          Take a look — it's yours to edit, retitle, or publish whenever you're ready.
        </p>
        <p style="margin: 0 0 1.5rem;">
          <a href="${escapeHtml(opts.composerUrl)}" style="display: inline-block; background: #FFCC00; color: #241123; font-weight: 700; text-decoration: none; padding: 0.75rem 1.5rem; border-radius: 10px;">Open your card</a>
        </p>
        <p style="margin: 0; font-size: 0.85rem; color: rgba(36,17,35,0.55); line-height: 1.6;">
          Nothing goes public until you stamp it. If you have questions, just reply to this email.
        </p>
      </div>
    </div>
  `;
}

export async function sendJourneyNudgeEmail(opts: {
  toEmail: string;
  location: string;
  composerUrl: string;
}): Promise<boolean> {
  const to = String(opts.toEmail ?? "").trim();
  if (!to) return false;

  if (!RESEND_API_KEY || !CONTACT_FROM_EMAIL) {
    console.warn("[journey-nudge] RESEND_API_KEY / CONTACT_FROM_EMAIL not set — email skipped");
    return false;
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [to],
        subject: "Your Journey Card is ready to review",
        html: nudgeEmailHtml({ location: opts.location, composerUrl: opts.composerUrl }),
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[journey-nudge] Resend error:", res.status, errText);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[journey-nudge] Resend request failed:", err);
    return false;
  }
}
