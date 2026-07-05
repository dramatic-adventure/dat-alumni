// app/api/auth/email-code/request/route.ts
//
// Sends a 6-digit sign-in code to the given email (Gmail API via
// lib/sendEmail), for the email-code NextAuth credentials provider
// (see /auth.ts).
import "server-only";
import { NextResponse } from "next/server";
import { requestEmailCode } from "@/lib/emailLoginCodes";
import { sendEmail, emailConfigured } from "@/lib/sendEmail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  email?: string;
  /** Honeypot — bots fill this, humans leave it blank */
  website?: string;
};

function codeEmailHtml(code: string): string {
  return `
    <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto; background: #fdf9f1; border: 1px solid #e5d8c0; border-radius: 14px; overflow: hidden;">
      <div style="background: #241123; padding: 1.75rem 2rem;">
        <p style="margin: 0 0 0.4rem; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.28em; color: rgba(255,204,0,0.7);">Dramatic Adventure Theatre</p>
        <h1 style="margin: 0; font-size: 1.4rem; color: #FFCC00; line-height: 1.2;">Your sign-in code</h1>
      </div>
      <div style="padding: 2rem;">
        <p style="margin: 0 0 1.25rem; font-size: 1rem; color: #241123; line-height: 1.6;">
          Enter this code on the DAT sign-in page to continue:
        </p>
        <div style="margin: 0 0 1.25rem; font-family: ui-monospace, monospace; font-size: 2rem; font-weight: 700; letter-spacing: 0.3em; color: #241123; text-align: center; background: #f2e9d8; border-radius: 10px; padding: 1rem;">
          ${code}
        </div>
        <p style="margin: 0; font-size: 0.85rem; color: rgba(36,17,35,0.55); line-height: 1.6;">
          This code is valid for 2 weeks. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  // Honeypot — silently succeed for bots
  if (body.website) {
    return NextResponse.json({ ok: true });
  }

  const result = await requestEmailCode(body.email || "");

  if (!result.ok) {
    if (result.reason === "invalid_email") {
      return NextResponse.json(
        { error: "Enter a valid email address." },
        { status: 422 }
      );
    }
    // rate_limited: a valid code was already sent recently — tell the
    // person to check their inbox rather than generating a new one.
    return NextResponse.json({ ok: true });
  }

  if (!(await emailConfigured())) {
    console.error("[email-code] email not configured (GMAIL_OAUTH_* / CONTACT_FROM_EMAIL) — cannot send code");
    return NextResponse.json(
      { error: "Email sign-in isn't available right now. Try Google, or email us." },
      { status: 500 }
    );
  }

  const sent = await sendEmail({
    to: result.email,
    subject: `${result.code} is your DAT sign-in code`,
    html: codeEmailHtml(result.code),
  });
  if (!sent.ok) {
    console.error("[email-code] send error:", sent.error);
    return NextResponse.json(
      { error: "Couldn't send the code. Try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
