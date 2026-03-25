// app/api/ambassador/route.ts
import "server-only";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  name: string;
  email: string;
  city?: string;
  why?: string;
  connections?: string;
  hear?: string;
  // Honeypot
  website?: string;
};

const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const CONTACT_FROM_EMAIL = process.env.CONTACT_FROM_EMAIL || "";
const FRIENDS_EMAIL =
  process.env.FRIENDS_INBOX_EMAIL ||
  process.env.CONTACT_INBOX_EMAIL ||
  "hello@dramaticadventure.com";

export async function POST(req: Request) {
  let body: Body;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, city, why, connections, hear, website } = body;

  // Honeypot check
  if (website) {
    return NextResponse.json({ ok: true });
  }

  // Basic validation
  if (!name?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "Name and email are required." },
      { status: 422 }
    );
  }

  const htmlBody = `
    <div style="font-family: system-ui, sans-serif; max-width: 640px; margin: 0 auto;">
      <div style="background: #D9A919; color: #241123; padding: 1.5rem 2rem; border-radius: 12px 12px 0 0;">
        <h1 style="margin: 0; font-size: 1.4rem; letter-spacing: 0.04em;">
          New Ambassador Application
        </h1>
        <p style="margin: 0.3rem 0 0; opacity: 0.7; font-size: 0.85rem;">
          From ${name}${city ? ` — ${city}` : ""}
        </p>
      </div>
      <div style="background: #fdf9f1; border: 1px solid #e5d8c0; border-top: 0; border-radius: 0 0 12px 12px; padding: 1.75rem 2rem;">

        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
          <tr>
            <td style="padding: 0.5rem 0; color: #D9A919; font-weight: 700; width: 36%; vertical-align: top;">Name</td>
            <td style="padding: 0.5rem 0; color: #241123;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 0.5rem 0; color: #D9A919; font-weight: 700; vertical-align: top;">Email</td>
            <td style="padding: 0.5rem 0; color: #241123;"><a href="mailto:${email}" style="color: #2493A9;">${email}</a></td>
          </tr>
          ${city ? `
          <tr>
            <td style="padding: 0.5rem 0; color: #D9A919; font-weight: 700; vertical-align: top;">City / Location</td>
            <td style="padding: 0.5rem 0; color: #241123;">${city}</td>
          </tr>` : ""}
          ${hear ? `
          <tr>
            <td style="padding: 0.5rem 0; color: #D9A919; font-weight: 700; vertical-align: top;">How they found DAT</td>
            <td style="padding: 0.5rem 0; color: #241123;">${hear}</td>
          </tr>` : ""}
        </table>

        ${why ? `
        <div style="margin-top: 1.25rem; padding: 1.25rem 1.5rem; background: rgba(217,169,25,0.08); border: 1px solid rgba(217,169,25,0.25); border-radius: 10px;">
          <p style="margin: 0 0 0.5rem; color: #b8891a; font-weight: 700; font-size: 0.82rem; letter-spacing: 0.1em; text-transform: uppercase;">Why They Want to Be an Ambassador</p>
          <p style="margin: 0; color: #241123; line-height: 1.7; font-size: 0.95rem; white-space: pre-wrap;">${why}</p>
        </div>` : ""}

        ${connections ? `
        <div style="margin-top: 1rem; padding: 1.25rem 1.5rem; background: rgba(217,169,25,0.05); border: 1px solid rgba(217,169,25,0.15); border-radius: 10px;">
          <p style="margin: 0 0 0.5rem; color: #b8891a; font-weight: 700; font-size: 0.82rem; letter-spacing: 0.1em; text-transform: uppercase;">Communities & Connections They Can Reach</p>
          <p style="margin: 0; color: #241123; line-height: 1.7; font-size: 0.95rem; white-space: pre-wrap;">${connections}</p>
        </div>` : ""}

        <div style="margin-top: 1.75rem; padding-top: 1.25rem; border-top: 1px solid #e5d8c0;">
          <a href="mailto:${email}?subject=Re: Your DAT Ambassador Application"
             style="display: inline-block; padding: 0.75rem 1.5rem; background: #D9A919; color: #241123; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 0.82rem; letter-spacing: 0.1em; text-transform: uppercase;">
            Reply to ${name} →
          </a>
        </div>
      </div>
    </div>
  `;

  if (!RESEND_API_KEY || !CONTACT_FROM_EMAIL) {
    console.error("[ambassador] Missing Resend config — email not sent");
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
        to: [FRIENDS_EMAIL],
        reply_to: email,
        subject: `✨ New Ambassador Application: ${name}${city ? ` (${city})` : ""}`,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[ambassador] Resend error:", err);
      return NextResponse.json({ error: "Email failed to send." }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[ambassador] Unexpected error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
