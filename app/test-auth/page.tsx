"use client";

import { signIn, signOut, useSession } from "next-auth/react";

// Dev-only diagnostic page. In production builds this renders nothing so
// the route doesn't expose session JSON or a sign-in surface outside /login.
export default function TestAuth() {
  const { data: session, status } = useSession();

  if (process.env.NODE_ENV === "production") return null;

  return (
    <main style={{ padding: 24, fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: 12 }}>Auth Test (dev only)</h1>
      <p>Status: {status}</p>
      <pre style={{ background: "#f5f5f5", padding: 12 }}>
        {JSON.stringify(session, null, 2)}
      </pre>

      {status !== "authenticated" ? (
        <button onClick={() => signIn("google")} style={{ marginTop: 12 }}>
          Sign in with Google
        </button>
      ) : (
        <button onClick={() => signOut()} style={{ marginTop: 12 }}>
          Sign out
        </button>
      )}
    </main>
  );
}
