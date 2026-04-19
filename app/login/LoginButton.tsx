"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginButton({ callbackUrl }: { callbackUrl: string }) {
  const [pending, setPending] = useState(false);

  const handleClick = () => {
    if (pending) return;
    setPending(true);
    // next-auth handles the redirect; we don't need to reset pending on success.
    void signIn("google", { callbackUrl }).catch(() => {
      setPending(false);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-busy={pending}
      className="group relative inline-flex w-full items-center justify-center gap-5 rounded-xl border px-6 py-6 text-[0.95rem] font-semibold tracking-[0.18em] transition-[transform,box-shadow,background-color] duration-200 hover:-translate-y-[2px] hover:shadow-[0_20px_56px_rgba(255,204,0,0.28),_0_8px_20px_rgba(0,0,0,0.45)] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#FFCC00] focus-visible:ring-offset-[#361252] disabled:cursor-wait disabled:opacity-80"
      style={{
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        textTransform: "uppercase",
        backgroundColor: "#FFCC00",
        color: "#241123",
        borderColor: "#FFCC00",
      }}
    >
      {/* Official Google "G" mark */}
      <span
        aria-hidden
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white"
      >
        <GoogleG />
      </span>
      <span>{pending ? "Connecting…" : "Continue with Google"}</span>
    </button>
  );
}

function GoogleG() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="16"
      height="16"
      role="img"
      aria-label="Google"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.44c-.28 1.48-1.12 2.73-2.38 3.57v2.97h3.84c2.25-2.07 3.55-5.12 3.55-8.78z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.94-2.93l-3.84-2.97c-1.07.72-2.44 1.15-4.1 1.15-3.15 0-5.82-2.13-6.77-4.99H1.27v3.13C3.25 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.23 14.26A7.2 7.2 0 0 1 4.84 12c0-.78.14-1.54.39-2.26V6.61H1.27A11.99 11.99 0 0 0 0 12c0 1.94.46 3.77 1.27 5.39l3.96-3.13z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.27 6.61l3.96 3.13C6.18 6.88 8.85 4.75 12 4.75z"
      />
    </svg>
  );
}
