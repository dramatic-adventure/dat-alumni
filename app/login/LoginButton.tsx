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
    <>
      <style>{`
        .dat-login-cta {
          transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
        }
        .dat-login-cta:hover:not(:disabled) {
          transform: translateY(-2px);
          filter: brightness(1.12);
          box-shadow: 0 10px 28px rgba(255,204,0,0.38), 0 4px 12px rgba(0,0,0,0.32);
        }
        .dat-login-cta:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: none;
        }
        .dat-login-cta:focus-visible {
          outline: 2px solid #FFCC00;
          outline-offset: 3px;
        }
        .dat-login-cta:disabled {
          cursor: wait;
          opacity: 0.75;
        }
      `}</style>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-busy={pending}
        className="dat-login-cta inline-flex w-full items-center justify-center"
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
          fontSize: "0.95rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.18em",
          backgroundColor: "#FFCC00",
          color: "#241123",
          border: "none",
          borderRadius: "6px",
          padding: "1.25rem 1.5rem",
          gap: "1.25rem",
          cursor: "pointer",
          width: "100%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Official Google "G" mark */}
        <span
          aria-hidden
          className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white"
          style={{ flexShrink: 0 }}
        >
          <GoogleG />
        </span>
        <span>{pending ? "Connecting…" : "Continue with Google"}</span>
      </button>
    </>
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
