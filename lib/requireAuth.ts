// /lib/requireAuth.ts
import { NextResponse } from "next/server";

let getServerSession:
  | undefined
  | ((...args: any[]) => Promise<{ user?: { email?: string | null } } | null>);

try {
  // Optional dependency (next-auth). If you don't use it, this stays undefined.
  // @ts-ignore
  ({ getServerSession } = require("next-auth"));
} catch {}

/** ADMIN_EMAILS is a comma-separated list of admin addresses */
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

function firstAdminEmail(): string {
  return ADMIN_EMAILS[0] || "";
}

export type RequireAuthOK = { ok: true; email: string; isAdmin: boolean };
export type RequireAuthFail = { ok: false; response: NextResponse };

/**
 * Require an authenticated user. Supports three paths:
 * 1) DEV_BYPASS_AUTH=true (local/dev only): returns first admin email.
 * 2) x-admin-key header that matches ADMIN_API_KEY (for curl/CI): admin.
 * 3) NextAuth session (if installed). If not installed, allows through.
 */
export async function requireAuth(req: Request): Promise<RequireAuthOK | RequireAuthFail> {
  // 1) Hard dev bypass (local only; do NOT enable in prod)
  if (process.env.DEV_BYPASS_AUTH === "true") {
    return { ok: true, email: firstAdminEmail(), isAdmin: true };
  }

  // 2) Admin API key (good for curl/Postman/CI)
  const apiKey = req.headers.get("x-admin-key");
  if (apiKey && process.env.ADMIN_API_KEY && apiKey === process.env.ADMIN_API_KEY) {
    return { ok: true, email: firstAdminEmail(), isAdmin: true };
  }

  // 3) NextAuth (if installed). If not installed, allow through (no email).
  if (!getServerSession) {
    return { ok: true, email: "", isAdmin: false };
  }

  const session = await getServerSession();
  const email = String(session?.user?.email || "").trim().toLowerCase();

  if (!email) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const isAdmin = ADMIN_EMAILS.includes(email);
  return { ok: true, email, isAdmin };
}

/**
 * Convenience: reject unless user is admin.
 * Use when you want to gate certain routes to admins only.
 */
export async function requireAdmin(req: Request): Promise<RequireAuthOK | RequireAuthFail> {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth;
  if (!auth.isAdmin) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return auth;
}
