"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

const FIELD_STYLE: React.CSSProperties = {
  width: "100%",
  padding: "0.85rem 1rem",
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: "0.95rem",
  color: "#f5ecd9",
  backgroundColor: "rgba(245,236,217,0.06)",
  border: "1px solid rgba(245,236,217,0.18)",
  borderRadius: "6px",
  outline: "none",
};

const LABEL_STYLE: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: "0.75rem",
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "rgba(245,236,217,0.6)",
  marginBottom: "0.5rem",
};

const SUBMIT_STYLE: React.CSSProperties = {
  appearance: "none",
  WebkitAppearance: "none",
  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
  fontSize: "0.95rem",
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.18em",
  backgroundColor: "transparent",
  color: "#FFCC00",
  border: "1px solid rgba(255,204,0,0.5)",
  borderRadius: "6px",
  padding: "1.1rem 1.5rem",
  cursor: "pointer",
  width: "100%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "background-color 0.18s ease, filter 0.18s ease",
};

const HELP_TEXT_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: "0.74rem",
  lineHeight: 1.6,
  color: "rgba(245,236,217,0.4)",
  marginTop: "0.6rem",
  textAlign: "center",
};

const NOTICE_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: "0.82rem",
  lineHeight: 1.6,
  color: "rgba(245,236,217,0.65)",
  marginBottom: "1rem",
};

const ERROR_STYLE: React.CSSProperties = {
  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  fontSize: "0.82rem",
  lineHeight: 1.6,
  color: "#F23359",
  marginTop: "0.85rem",
};

// Two top-level modes:
//  - "signin": returning artists with a password — email + password, sign in.
//  - "reset":  first-time setup or forgot password — verify a one-time code
//              sent to their email, then choose a password. Two steps:
//              "request" (send code) and "confirm" (code + new password).
type Mode = "signin" | "reset";
type ResetStep = "request" | "confirm";

export default function EmailCodeForm({
  callbackUrl,
  invite,
}: {
  callbackUrl: string;
  /** Invite token, if this sign-in was reached via an invite link — carried
   *  through to the eligibility check on the request/set-password endpoints. */
  invite?: string;
}) {
  const [mode, setMode] = useState<Mode>("signin");
  const [resetStep, setResetStep] = useState<ResetStep>("request");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const trimmedEmail = email.trim();

  function resetMessages() {
    setError(null);
    setNotice(null);
  }

  function switchToReset() {
    resetMessages();
    setMode("reset");
    setResetStep("request");
    setCode("");
    setNewPassword("");
  }

  function switchToSignIn() {
    resetMessages();
    setMode("signin");
    setPassword("");
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    resetMessages();
    setPending(true);
    try {
      const result = await signIn("password", {
        email: trimmedEmail,
        password,
        callbackUrl,
        redirect: false,
      });
      if (!result || result.error) {
        setError("That email and password don't match. Try again, or set a password below.");
        setPending(false);
        return;
      }
      window.location.href = result.url || callbackUrl;
    } catch {
      setError("Something went wrong. Try again.");
      setPending(false);
    }
  }

  async function handleSendCode(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    resetMessages();
    setPending(true);
    try {
      const res = await fetch("/api/auth/email-code/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, inviteToken: invite }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Couldn't send the code. Try again.");
        return;
      }
      setNotice(`We sent a 6-digit code to ${trimmedEmail}. It's valid for 2 weeks.`);
      setResetStep("confirm");
    } catch {
      setError("Couldn't send the code. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleResend() {
    if (pending) return;
    resetMessages();
    setPending(true);
    try {
      const res = await fetch("/api/auth/email-code/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, inviteToken: invite }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Couldn't resend the code. Try again.");
        return;
      }
      setNotice(`We sent another code to ${trimmedEmail}.`);
    } catch {
      setError("Couldn't resend the code. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    resetMessages();
    setPending(true);
    try {
      const res = await fetch("/api/auth/account/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: trimmedEmail,
          code: code.trim(),
          password: newPassword,
          inviteToken: invite,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Couldn't set your password. Try again.");
        setPending(false);
        return;
      }

      const result = await signIn("password", {
        email: trimmedEmail,
        password: newPassword,
        callbackUrl,
        redirect: false,
      });
      if (!result || result.error) {
        // Password was saved, but the immediate sign-in failed for some
        // reason — send them to the sign-in form rather than leaving them
        // stuck on this one.
        setMode("signin");
        setPassword("");
        setNotice("Your password is set. Sign in below.");
        setPending(false);
        return;
      }
      window.location.href = result.url || callbackUrl;
    } catch {
      setError("Something went wrong. Try again.");
      setPending(false);
    }
  }

  return (
    <>
      <style>{`
        .dat-email-cta:hover:not(:disabled) {
          background-color: rgba(255,204,0,0.1);
        }
        .dat-email-cta:active:not(:disabled) {
          background-color: rgba(255,204,0,0.16);
        }
        .dat-email-cta:focus-visible {
          outline: 2px solid #FFCC00;
          outline-offset: 3px;
        }
        .dat-email-cta:disabled {
          cursor: wait;
          opacity: 0.6;
        }
        .dat-email-field:focus {
          border-color: rgba(255,204,0,0.5);
          background-color: rgba(245,236,217,0.1);
        }
        .dat-email-link {
          font-family: var(--font-dm-sans), system-ui, sans-serif;
          font-size: 0.78rem;
          color: rgba(245,236,217,0.55);
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .dat-email-link:hover:not(:disabled) {
          color: #FFCC00;
        }
        .dat-email-link:disabled {
          cursor: wait;
          opacity: 0.6;
        }
      `}</style>

      {mode === "signin" && (
        <form onSubmit={handleSignIn}>
          <label htmlFor="signin-email" style={LABEL_STYLE}>
            Email address
          </label>
          <input
            id="signin-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="dat-email-field"
            style={{ ...FIELD_STYLE, marginBottom: "0.85rem" }}
          />
          <label htmlFor="signin-password" style={LABEL_STYLE}>
            Password
          </label>
          <input
            id="signin-password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="dat-email-field"
            style={{ ...FIELD_STYLE, marginBottom: "0.85rem" }}
          />
          <button
            type="submit"
            disabled={pending || !trimmedEmail || !password}
            aria-busy={pending}
            className="dat-email-cta"
            style={SUBMIT_STYLE}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>
          <p style={{ textAlign: "center", marginTop: "0.75rem" }}>
            <button type="button" onClick={switchToReset} className="dat-email-link">
              Forgot your password, or signing in for the first time?
            </button>
          </p>
        </form>
      )}

      {mode === "reset" && resetStep === "request" && (
        <form onSubmit={handleSendCode}>
          <p style={NOTICE_STYLE}>
            Enter your email and we&rsquo;ll send you a 6-digit code to confirm
            it&rsquo;s you, so you can set a password.
          </p>
          <label htmlFor="reset-email" style={LABEL_STYLE}>
            Email address
          </label>
          <input
            id="reset-email"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="dat-email-field"
            style={{ ...FIELD_STYLE, marginBottom: "0.85rem" }}
          />
          <button
            type="submit"
            disabled={pending || !trimmedEmail}
            aria-busy={pending}
            className="dat-email-cta"
            style={SUBMIT_STYLE}
          >
            {pending ? "Sending…" : "Send code"}
          </button>
          <p style={HELP_TEXT_STYLE}>
            We&rsquo;ll email you a 6-digit code. It&rsquo;s valid for 2 weeks, so there&rsquo;s no rush.
          </p>
          <p style={{ textAlign: "center", marginTop: "0.75rem" }}>
            <button
              type="button"
              onClick={() => {
                resetMessages();
                setResetStep("confirm");
              }}
              className="dat-email-link"
            >
              Already have a code?
            </button>
          </p>
          <p style={{ textAlign: "center", marginTop: "0.5rem" }}>
            <button type="button" onClick={switchToSignIn} className="dat-email-link">
              Back to sign in
            </button>
          </p>
        </form>
      )}

      {mode === "reset" && resetStep === "confirm" && (
        <form onSubmit={handleSetPassword}>
          {notice ? (
            <p style={NOTICE_STYLE}>{notice}</p>
          ) : (
            <p style={NOTICE_STYLE}>
              Enter the email the code was sent to, the code itself, and the
              password you&rsquo;d like to use from now on.
            </p>
          )}
          <label htmlFor="reset-email-2" style={LABEL_STYLE}>
            Email address
          </label>
          <input
            id="reset-email-2"
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="dat-email-field"
            style={{ ...FIELD_STYLE, marginBottom: "0.85rem" }}
          />
          <label htmlFor="reset-code" style={LABEL_STYLE}>
            6-digit code
          </label>
          <input
            id="reset-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            required
            placeholder="000000"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
            className="dat-email-field"
            style={{
              ...FIELD_STYLE,
              marginBottom: "0.85rem",
              letterSpacing: "0.4em",
              textAlign: "center",
              fontFamily: "ui-monospace, monospace",
              fontSize: "1.1rem",
            }}
          />
          <label htmlFor="reset-new-password" style={LABEL_STYLE}>
            New password
          </label>
          <input
            id="reset-new-password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            placeholder="At least 8 characters"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="dat-email-field"
            style={{ ...FIELD_STYLE, marginBottom: "0.85rem" }}
          />
          <button
            type="submit"
            disabled={
              pending || !trimmedEmail || code.trim().length !== 6 || newPassword.length < 8
            }
            aria-busy={pending}
            className="dat-email-cta"
            style={{ ...SUBMIT_STYLE, marginBottom: "0.85rem" }}
          >
            {pending ? "Saving…" : "Set password & sign in"}
          </button>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
            <button
              type="button"
              onClick={() => {
                setResetStep("request");
                setCode("");
                resetMessages();
              }}
              disabled={pending}
              className="dat-email-link"
            >
              Use a different email
            </button>
            <button type="button" onClick={handleResend} disabled={pending} className="dat-email-link">
              Resend code
            </button>
          </div>
          <p style={{ textAlign: "center", marginTop: "0.75rem" }}>
            <button type="button" onClick={switchToSignIn} className="dat-email-link">
              Back to sign in
            </button>
          </p>
        </form>
      )}

      {error && (
        <p role="alert" style={ERROR_STYLE}>
          {error}
        </p>
      )}
    </>
  );
}
