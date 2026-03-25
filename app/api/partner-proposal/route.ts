// app/api/partner-proposal/route.ts
import "server-only";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  name: string;
  email: string;
  org?: string;
  orgType?: string;
  vision: string;
  timeline?: string;
  community?: string;
  hear?: string;
  // Honeypot
  website?: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "";
const PARTNERSHIPS_EMAIL =
  process.env.PARTNERSHIPS_INBOX_EMAIL ||
  process.env.CONTACT_INBOX_EMAIL ||
  "hello@dramaticadventure.com";

export async function POST(req: Request) {
  let body: Body;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, org, orgType, vision, timeline, community, hear, website } = body;

  // Honeypot check — bots fill this, humans leave it blank
  if (website) {
    // Silently succeed so bots don't know they were caught
    return NextResponse.json({ ok: true });
  }

  // Basic validation
  if (!name?.trim() || !email?.trim() || !vision?.trim()) {
    return NextResponse.json(
      { error: "Name, email, and vision are required." },
      { status: 422 }
    );
  }

  const partnerTypeLabel = orgType
    ? orgType.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Not specified";

  const htmlBody = `
    <div style="font-family: system-ui, sans-serif; max-width: 640px; margin: 0 auto;">
      <div style="background: #6C00AF; color: #fff; padding: 1.5rem 2rem; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.4rem; letter-spacing: 0.04em;">
          New Partnership Proposal
        </h1>
        <p style="margin: 0.3rem 0 0; opacity: 0.75; font-size: 0.85rem;">
          From ${name} — ${org || "Individual"}
        </p>
      </div>
      <div style="background: #fdf9f1; border: 1px solid #e5d8c0; border-top: 0; border-radius: 0 0 12px 12px; padding: 1.75rem 2rem;">

        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <tr>
            <td style="padding: 0.5rem 0; color: #6C00AF; font-weight: 700; width: 36%; vertical-align: top;">Name</td>
            <td style="padding: 0.5rem 0; color: #241123;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #6C00AF; font-weight: 700; vertical-align: top;">Email</td>
            <td style="padding: 0.5rem 0; color: #241123;"><a href="mailto:${email}" style="color: #2493A9;">${email}</a></td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #6C00AF; font-weight: 700; vertical-align: top;">Organization</td>
            <td style="padding: 0.5rem 0; color: #241123;">${org || "Not provided"}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #6C00AF; font-weight: 700; vertical-align: top;">Partnership Type</td>
            <td style="padding: 0.5rem 0; color: #241123;">${partnerTypeLabel}</td>
          </tr>
          ${timeline ? `
          <tr>
            <td style="padding: 0.5rem 0; color: #6C00AF; font-weight: 700; vertical-align: top;">Timeline</td>
            <td style="padding: 0.5rem 0; color: #241123;">${timeline}</td>
          </tr>` : ""}
          ${community ? `
          <tr>
            <td style="padding: 0.5rem 0; color: #6C00AF; font-weight: 700; vertical-align: top;">Community / Location</td>
            <td style="padding: 0.5rem 0; color: #241123;">${community}</td>
          </tr>` : ""}
          ${hear ? `
          <tr>
            <td style="padding: 0.5rem 0; color: #6C00AF; font-weight: 700; vertical-align: top;">How they found DAT</td>
            <td style="padding: 0.5rem 0; color: #241123;">${hear}</td>
          </tr>` : ""}
        </table>

        <div style="margin-top: 1.5rem; padding: 1.25rem 1.5rem; background: rgba(108,0,175,0.06); border: 1px solid rgba(108,0,175,0.15); border-radius: 10px;">
          <p style="margin: 0 0 0.5rem; color: #6C00AF; font-weight: 700; font-size: 0.82rem; letter-spacing: 0.1em; text-transform: uppercase;">Their Vision</p>
          <p style="margin: 0; color: #241123; line-height: 1.7; font-size: 0.95rem; white-space: pre-wrap;">${vision}</p>
        </div>

        <div style="margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid #e5d8c0;">
          <a href="mailto:${email}?subject=Re: Your DAT Partnership Proposal"
             style="display: inline-block; padding: 0.75rem 1.5rem; background: #6C00AF; color: #fff; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 0.82rem; letter-spacing: 0.1em; text-transform: uppercase;">
            Reply to ${name} →
          </a>
        </div>
      </div>
    </div>
  `;

  // Send via Resend
  if (!RESEND_API_KEY || !CONTACT_FROM_EMAIL) {
    console.error("[partner-proposal] Missing Resend config — email not sent");
    // Don't fail the user; log and succeed silently
    return NextResponse.json({ ok: true });
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
        to: [PARTNERSHIPS_EMAIL],
        reply_to: email,
        subject: `🤝 New Partnership Proposal: ${org || name} (${partnerTypeLabel})`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[partner-proposal] Resend error:", err);
      return NextResponse.json({ error: "Email failed to send." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[partner-proposal] Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
