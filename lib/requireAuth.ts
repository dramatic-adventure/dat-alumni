// /lib/requireAuth.ts
import { NextResponse } from "next/server";

// NextAuth v5 helper (your project has /auth.ts exporting `auth`)
let authFn: undefined | (() => Promise<{ user?: { email?: string | null } } | null>);
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ({ auth: authFn } = require("@/auth"));
} catch {
  // optional: auth not installed
}

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
 * Require an authenticated user. Supports:
 * 1) DEV_BYPASS_AUTH=true (local/dev only): returns first admin email.
 * 2) x-admin-token header matching ADMIN_TOKEN (for curl/dev): admin.
 * 3) x-admin-key header matching ADMIN_API_KEY (for curl/CI): admin.
 * 4) NextAuth session (if installed): email + admin allowlist.
 */
export async function requireAuth(req: Request): Promise<RequireAuthOK | RequireAuthFail> {
  // 1) Hard dev bypass (local only; do NOT enable in prod)
  if (process.env.DEV_BYPASS_AUTH === "true") {
    return { ok: true, email: firstAdminEmail(), isAdmin: true };
  }

  // 2) Admin token (matches what your lookup debug uses)
  const adminToken = (req.headers.get("x-admin-token") || "").trim();
  const wantToken = (process.env.ADMIN_TOKEN || "").trim();
  if (wantToken && adminToken && adminToken === wantToken) {
    return { ok: true, email: firstAdminEmail(), isAdmin: true };
  }

  // 3) Admin API key (curl/CI)
  const apiKey = (req.headers.get("x-admin-key") || "").trim();
  const wantKey = (process.env.ADMIN_API_KEY || "").trim();
  if (wantKey && apiKey && apiKey === wantKey) {
    return { ok: true, email: firstAdminEmail(), isAdmin: true };
  }

  // 4) NextAuth session (if available)
  if (!authFn) {
    // If auth isn't installed, fail closed (safer than "allow through")
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const session = await authFn();
  const email = String(session?.user?.email || "").trim().toLowerCase();

  if (!email) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const isAdmin = ADMIN_EMAILS.includes(email);
  return { ok: true, email, isAdmin };
}

export async function requireAdmin(req: Request): Promise<RequireAuthOK | RequireAuthFail> {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth;
  if (!auth.isAdmin) {
    return { ok: false, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return auth;
}
