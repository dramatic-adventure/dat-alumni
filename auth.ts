// /auth.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import { getCredential } from "@/lib/accountCredentials";
import { verifyPassword } from "@/lib/passwordHash";

// Canonical env vars (per CLAUDE.md + Netlify):
//   GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / NEXTAUTH_SECRET
// Legacy GOOGLE_ID / GOOGLE_SECRET kept as a transition fallback so existing
// deployments don't break mid-rollout.
const GOOGLE_CLIENT_ID =
  process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_ID || "";
const GOOGLE_CLIENT_SECRET =
  process.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_SECRET || "";
const NEXTAUTH_SECRET = process.env.NEXTAUTH_SECRET || "";

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn(
    "[auth] Missing Google OAuth credentials. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET."
  );
}
if (!NEXTAUTH_SECRET) {
  const msg =
    "[auth] NEXTAUTH_SECRET is not set. NextAuth JWT sessions will fail without it.";
  if (process.env.NODE_ENV === "production") {
    console.error(msg);
  } else {
    console.warn(msg);
  }
}

export const authOptions: NextAuthOptions = {
  secret: NEXTAUTH_SECRET || undefined,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    GoogleProvider({
      clientId: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
    }),
    // Email + password — for artists without a Google account. Accounts are
    // created/reset via /api/auth/account/set-password, which gates the
    // change behind the email sign-in code (see lib/emailLoginCodes).
    CredentialsProvider({
      id: "password",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || "").trim().toLowerCase();
        const password = String(credentials?.password || "");
        if (!email || !password) return null;

        const cred = await getCredential(email);
        if (!cred) return null;

        const valid = await verifyPassword(password, cred.passwordHash);
        if (!valid) return null;

        return { id: email, email };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Same-origin relative paths are safe
      if (url.startsWith("/") && !url.startsWith("//")) {
        return `${baseUrl}${url}`;
      }
      // Same-origin absolute URLs are safe
      try {
        const u = new URL(url);
        if (u.origin === baseUrl) return url;
      } catch {
        // fall through
      }
      // Unknown / off-origin: default to the alumni editor
      return `${baseUrl}/alumni/update`;
    },
  },
};

// v5-like convenience helper you can keep using in route handlers / server
export function auth() {
  return getServerSession(authOptions);
}
