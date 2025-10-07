"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function TestAuth() {
  const { data: session, status } = useSession();

  return (
    <main style={{ padding: 24, fontFamily: "var(--font-space-grotesk), system-ui, sans-serif" }}>
      <h1 style={{ marginBottom: 12 }}>Auth Test</h1>
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
