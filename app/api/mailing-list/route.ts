// app/api/mailing-list/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// Mailing list signup endpoint.
//
// ON SUBMIT:
//   1. Appends a row to the "Mailing List" sheet in GOOGLE_SHEET_ID
//   2. Sends a welcome confirmation email to the subscriber (via Resend)
//   3. Sends a notification email to the DAT inbox (via Resend)
//
// GOOGLE SHEET SETUP (one-time):
//   - Open the DAT Google Sheet (GOOGLE_SHEET_ID)
//   - Add a new tab named exactly: "Mailing List"
//   - Row 1 headers (exact):  Timestamp | Name | Email | Source
//   That's it. The API will append rows automatically.
// ─────────────────────────────────────────────────────────────────────────────
import "server-only";
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  email: string;
  name?: string;
  source?: string;
  /** Honeypot — bots fill this, humans leave it blank */
  website?: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "";
const INBOX_EMAIL =
  process.env.CONTACT_INBOX_EMAIL ||
  "hello@dramaticadventure.com";
const GOOGLE_SHEET_ID = process.env.GOOGLE_SHEET_ID || "";

export async function POST(req: Request) {
  let body: Body;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { email, name, source, website } = body;

  // Honeypot — silently succeed for bots
  if (website) {
    return NextResponse.json({ ok: true });
  }

  const emailTrim = (email ?? "").trim().toLowerCase();
  const nameTrim = (name ?? "").trim();

  // Basic email validation
  if (!emailTrim || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 422 });
  }

  const timestamp = new Date().toISOString();
  const sourceTrim = (source ?? "events-page").trim();

  // ── 1. Append to Google Sheet ──────────────────────────────────────────────
  if (GOOGLE_SHEET_ID) {
    try {
      const sheets = sheetsClient();
      await sheets.spreadsheets.values.append({
        spreadsheetId: GOOGLE_SHEET_ID,
        // Sheet tab must be named exactly "Mailing List" (see setup note above)
        range: "Mailing List!A:D",
        valueInputOption: "RAW",
        requestBody: {
          values: [[timestamp, nameTrim, emailTrim, sourceTrim]],
        },
      });
    } catch (err) {
      // Don't fail the whole request if sheets write fails — log and continue
      console.error("[mailing-list] Google Sheets write error:", err);
    }
  } else {
    console.warn("[mailing-list] GOOGLE_SHEET_ID not set — skipping sheet append");
  }

  // ── 2. Send emails via Resend ──────────────────────────────────────────────
  if (!RESEND_API_KEY || !CONTACT_FROM_EMAIL) {
    console.warn("[mailing-list] Resend not configured — skipping emails");
    return NextResponse.json({ ok: true });
  }

  const greeting = nameTrim ? `Hi ${nameTrim.split(" ")[0]},` : "Hello,";

  // Welcome email → subscriber
  const welcomeHtml = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #fdf9f1; border: 1px solid #e5d8c0; border-radius: 14px; overflow: hidden;">
      <div style="background: #241123; padding: 2rem 2.5rem;">
        <p style="margin: 0 0 0.4rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.28em; color: rgba(255,204,0,0.7);">Dramatic Adventure Theatre</p>
        <h1 style="margin: 0; font-size: 1.6rem; color: #FFCC00; line-height: 1.2;">You're on the list.</h1>
      </div>
      <div style="padding: 2rem 2.5rem;">
        <p style="margin: 0 0 1rem; font-size: 1rem; color: #241123; line-height: 1.65;">${greeting}</p>
        <p style="margin: 0 0 1rem; font-size: 1rem; color: #241123; line-height: 1.65;">
          Thanks for signing up. You'll hear from us first when we announce new events, productions, and ways to get involved — from Edinburgh to Ecuador and beyond.
        </p>
        <p style="margin: 0 0 1.75rem; font-size: 1rem; color: #241123; line-height: 1.65;">
          In the meantime, explore what's coming up:
        </p>
        <a href="https://stories.dramaticadventure.com/events"
           style="display: inline-block; padding: 0.85rem 1.75rem; background: #F23359; color: #fff; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.12em; text-transform: uppercase;">
          See Upcoming Events →
        </a>
        <p style="margin: 2rem 0 0; font-size: 0.82rem; color: rgba(36,17,35,0.5); line-height: 1.6;">
          You're receiving this because you signed up at dramaticadventure.com.
          To unsubscribe, reply with "unsubscribe" and we'll take care of it immediately.
        </p>
      </div>
    </div>
  `;

  // Notification email → DAT inbox
  const notifyHtml = `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #F23359; color: #fff; padding: 1.5rem 2rem; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.3rem; letter-spacing: 0.04em;">New Mailing List Signup</h1>
        <p style="margin: 0.3rem 0 0; opacity: 0.85; font-size: 0.85rem;">via ${sourceTrim}</p>
      </div>
      <div style="background: #fdf9f1; border: 1px solid #e5d8c0; border-top: 0; border-radius: 0 0 12px 12px; padding: 1.75rem 2rem;">
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          ${nameTrim ? `<tr>
            <td style="padding: 0.5rem 0; color: #F23359; font-weight: 700; width: 36%;">Name</td>
            <td style="padding: 0.5rem 0; color: #241123;">${nameTrim}</td>
          </tr>` : ""}
          <tr>
            <td style="padding: 0.5rem 0; color: #F23359; font-weight: 700; width: 36%;">Email</td>
            <td style="padding: 0.5rem 0; color: #241123;"><a href="mailto:${emailTrim}" style="color: #2493A9;">${emailTrim}</a></td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #F23359; font-weight: 700;">Source</td>
            <td style="padding: 0.5rem 0; color: #241123;">${sourceTrim}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #F23359; font-weight: 700;">Time</td>
            <td style="padding: 0.5rem 0; color: #241123;">${timestamp}</td>
          </tr>
        </table>
        <div style="margin-top: 1.5rem; padding-top: 1.25rem; border-top: 1px solid #e5d8c0;">
          <a href="mailto:${emailTrim}" style="display: inline-block; padding: 0.65rem 1.25rem; background: #F23359; color: #fff; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.1em; text-transform: uppercase;">
            Reply to ${nameTrim || emailTrim} →
          </a>
        </div>
      </div>
    </div>
  `;

  // Fire both emails in parallel — don't block the response on either
  const emailPromises = [
    // Welcome to subscriber
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [emailTrim],
        subject: "You're on the DAT list. 🎭",
        html: welcomeHtml,
      }),
    }),
    // Notify DAT
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: CONTACT_FROM_EMAIL,
        to: [INBOX_EMAIL],
        reply_to: emailTrim,
        subject: `📬 New mailing list signup: ${nameTrim || emailTrim}`,
        html: notifyHtml,
      }),
    }),
  ];

  try {
    await Promise.all(emailPromises);
  } catch (err) {
    console.error("[mailing-list] Resend error:", err);
    // Still return ok — the sheet write already happened
  }

  return NextResponse.json({ ok: true });
}
