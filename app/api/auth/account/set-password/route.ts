// app/api/auth/account/set-password/route.ts
//
// Sets (creates or resets) the password for an alumni email/password
// account. Used for both first-time account creation and "forgot password"
// resets — in both cases the caller must first prove ownership of the email
// via the 6-digit code sent by /api/auth/email-code/request.
import "server-only";
import { NextResponse } from "next/server";
import { verifyEmailCode } from "@/lib/emailLoginCodes";
import { hashPassword, isPasswordStrongEnough } from "@/lib/passwordHash";
import { upsertCredential } from "@/lib/accountCredentials";
import { EMAIL_RE } from "@/lib/emailIdentity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  email?: string;
  code?: string;
  password?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const code = String(body.code || "").trim();
  const password = String(body.password || "");

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 422 });
  }
  if (!isPasswordStrongEnough(password)) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 422 }
    );
  }

  const validCode = await verifyEmailCode(email, code);
  if (!validCode) {
    return NextResponse.json(
      { error: "That code didn't work. Double-check it, or resend below." },
      { status: 401 }
    );
  }

  const passwordHash = await hashPassword(password);
  await upsertCredential(email, passwordHash);

  return NextResponse.json({ ok: true });
}
