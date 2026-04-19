// app/login/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import LoginButton from "./LoginButton";

export const revalidate = 0;

/** Only allow same-origin relative callback paths. Block protocol-relative URLs. */
function safeCallback(raw: string | undefined): string {
  const v = String(raw || "").trim();
  if (!v) return "/alumni/update";
  if (!v.startsWith("/")) return "/alumni/update";
  if (v.startsWith("//")) return "/alumni/update";
  return v;
}

function firstParam(v: string | string[] | undefined): string | undefined {
  if (Array.isArray(v)) return v[0];
  return v;
}

/** Preserve the invite code through the default redirect so downstream pages can read it. */
function withInvite(callbackUrl: string, invite: string | undefined): string {
  if (!invite) return callbackUrl;
  if (/[?&]invite=/.test(callbackUrl)) return callbackUrl;
  if (callbackUrl !== "/alumni/update") return callbackUrl;
  const sep = callbackUrl.includes("?") ? "&" : "?";
  return `${callbackUrl}${sep}invite=${encodeURIComponent(invite)}`;
}

/** Map NextAuth error codes to human copy. */
function errorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "OAuthAccountNotLinked":
      return "That Google account doesn't match an existing alumni record. If you have more than one Google login, try the other one — or email us and we'll link it by hand.";
    case "AccessDenied":
      return "Access was denied. If you believe you should have access, reach out and we'll sort it out.";
    case "Verification":
      return "Your sign-in link has expired. Start again below.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
    case "Callback":
      return "Something hiccuped on Google's end. Give it another go — it almost always works on the second try.";
    case "SessionRequired":
      return "You need to be signed in to view that page. Sign in below and we'll drop you back where you were.";
    default:
      return "We couldn't complete sign-in. Try again, or reach out if it keeps happening.";
  }
}

const STATS = [
  { number: "200+", label: "Alumni" },
  { number: "18",   label: "Countries" },
  { number: "16",   label: "Seasons" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const rawCb   = firstParam(sp?.callbackUrl);
  const invite  = firstParam(sp?.invite)?.trim() || undefined;
  const errorCode = firstParam(sp?.error);

  const baseCallback = safeCallback(rawCb);
  const callbackUrl  = withInvite(baseCallback, invite);

  const session = await auth();
  if (session) redirect(callbackUrl);

  const errorCopy = errorMessage(errorCode);
  const hasInvite = Boolean(invite);

  return (
    <div
      aria-label="Alumni sign-in"
      style={{
        position: "relative",
        minHeight: "100dvh",
        background: "transparent", // kraft paper from globals body::before shows through
        color: "#f5ecd9",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "clamp(2rem, 5vw, 4rem) clamp(1.25rem, 5vw, 2rem)",
      }}
    >

      {/* ── Radial glow accents — sit over the kraft ── */}
      <div
        aria-hidden
        style={{
          position: "fixed",
          inset: 0,
          background:
            "radial-gradient(ellipse 65% 50% at 85% 8%, rgba(108,0,175,0.18), transparent 65%), " +
            "radial-gradient(ellipse 50% 40% at 15% 92%, rgba(255,204,0,0.09), transparent 60%)",
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* ══════════════════════════════════════════════════════
          FORM PANEL — semi-transparent dark panel over kraft
          ══════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          maxWidth: "460px",
          background: "rgba(36,17,35,0.90)",
          border: "1px solid rgba(255,204,0,0.18)",
          padding: "clamp(2rem, 5vw, 3.5rem) clamp(1.5rem, 5vw, 3rem)",
        }}
      >

        {/* Stamp eyebrow */}
        <div
          style={{
            fontFamily: "var(--font-special-elite), ui-monospace, monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            color: "#FFCC00",
            opacity: 0.85,
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          DAT · EST. 2007 · NYC → THE WORLD
        </div>

        {/* ── Conditional banners ───────────────────── */}

        {/* Invite banner */}
        {hasInvite && !errorCopy && (
          <div
            style={{
              borderRadius: "6px",
              border: "1px solid rgba(255,204,0,0.38)",
              backgroundColor: "rgba(255,204,0,0.07)",
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              color: "#f5ecd9",
              fontSize: "0.875rem",
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-special-elite), ui-monospace, monospace",
                fontSize: "0.6rem",
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: "#FFCC00",
                marginBottom: "0.5rem",
              }}
            >
              You&rsquo;re on the list
            </div>
            Welcome — you&rsquo;ve been invited to claim your alumni profile. Sign in and we&rsquo;ll bring the invite with you.
          </div>
        )}

        {/* Error banner */}
        {errorCopy && (
          <div
            role="alert"
            aria-live="polite"
            style={{
              borderRadius: "6px",
              border: "1px solid rgba(242,51,89,0.48)",
              backgroundColor: "rgba(242,51,89,0.09)",
              padding: "1rem 1.25rem",
              marginBottom: "1.5rem",
              color: "#f5ecd9",
              fontSize: "0.875rem",
              lineHeight: 1.6,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-special-elite), ui-monospace, monospace",
                fontSize: "0.6rem",
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: "#F23359",
                marginBottom: "0.5rem",
              }}
            >
              Sign-in interrupted
            </div>
            {errorCopy}
          </div>
        )}

        {/* ── Headline ──────────────────────────────── */}
        <h1
          style={{
            fontFamily: "var(--font-gloucester), serif",
            fontSize: "clamp(2.6rem, 5.5vw, 4rem)",
            lineHeight: 1.04,
            letterSpacing: "-0.015em",
            color: "#f5ecd9",
            marginBottom: "1.25rem",
            textAlign: "center",
          }}
        >
          Welcome
          <br />
          home,{" "}
          <em style={{ color: "#FFCC00", fontStyle: "italic" }}>traveler.</em>
        </h1>

        {/* Stat strip */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "2.5rem",
            paddingTop: "1rem",
            paddingBottom: "1.25rem",
            marginBottom: "1.5rem",
            borderTop: "1px solid rgba(255,204,0,0.16)",
            borderBottom: "1px solid rgba(255,204,0,0.16)",
          }}
        >
          {STATS.map(({ number, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div
                style={{
                  fontFamily: "var(--font-anton), sans-serif",
                  fontSize: "clamp(1.4rem, 2.4vw, 1.9rem)",
                  color: "#FFCC00",
                  lineHeight: 1,
                }}
              >
                {number}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-dm-sans), sans-serif",
                  fontSize: "0.6rem",
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "rgba(245,236,217,0.55)",
                  marginTop: "0.4rem",
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Body copy */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "clamp(0.88rem, 1.4vw, 0.98rem)",
            lineHeight: 1.72,
            color: "rgba(245,236,217,0.72)",
            marginBottom: "2rem",
            textAlign: "center",
          }}
        >
          {hasInvite
            ? "Sign in to claim your profile, share a chapter, and stay woven into the DAT story — wherever in the world you've landed."
            : "Sign in to update your profile, share a chapter, and stay woven into the DAT story — wherever in the world you've landed."}
        </p>

        {/* Google sign-in */}
        <LoginButton callbackUrl={callbackUrl} />

        {/* Trust line */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.72rem",
            lineHeight: 1.6,
            color: "rgba(245,236,217,0.38)",
            marginTop: "0.9rem",
            textAlign: "center",
          }}
        >
          Secured through Google. We only use your email to match you to your existing alumni record — no posts, no contacts, no noise.
        </p>

        {/* ── Divider ───────────────────────────────── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            margin: "2rem 0",
            fontFamily: "var(--font-special-elite), ui-monospace, monospace",
            fontSize: "0.58rem",
            letterSpacing: "0.42em",
            textTransform: "uppercase",
            color: "rgba(245,236,217,0.38)",
          }}
        >
          <span
            aria-hidden
            style={{ flex: 1, height: "1px", backgroundColor: "rgba(245,236,217,0.12)" }}
          />
          No Google account?
          <span
            aria-hidden
            style={{ flex: 1, height: "1px", backgroundColor: "rgba(245,236,217,0.12)" }}
          />
        </div>

        {/* ── Support block ─────────────────────────── */}
        <div
          style={{
            border: "1px solid rgba(245,236,217,0.12)",
            backgroundColor: "rgba(245,236,217,0.04)",
            padding: "1.25rem 1.5rem",
          }}
        >
          <p
            style={{
              fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
              fontSize: "0.875rem",
              lineHeight: 1.68,
              color: "rgba(245,236,217,0.75)",
              marginBottom: "0.85rem",
            }}
          >
            We&rsquo;ll set you up by hand — no new account required. Send us a note and we&rsquo;ll get you connected to your profile within a day or two.
          </p>
          <a
            href={`mailto:alumni@dramaticadventure.com?subject=${encodeURIComponent(
              "Alumni profile help"
            )}&body=${encodeURIComponent(
              "Hi DAT — I'd like help accessing my alumni profile.\n\nName:\nYears / projects with DAT:\nPreferred email:\n"
            )}`}
            style={{
              fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
              fontSize: "0.82rem",
              fontWeight: 700,
              color: "#FFCC00",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              letterSpacing: "0.01em",
            }}
            className="hover:underline underline-offset-4 focus-visible:underline focus-visible:outline-none"
          >
            alumni@dramaticadventure.com
            <span aria-hidden>→</span>
          </a>
        </div>

        {/* ── Footer micro-link ─────────────────────── */}
        <p
          style={{
            fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
            fontSize: "0.68rem",
            color: "rgba(245,236,217,0.32)",
            marginTop: "1.75rem",
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          By signing in you agree to our{" "}
          <Link
            href="/about/contact"
            className="hover:underline underline-offset-4 focus-visible:underline focus-visible:outline-none"
            style={{ color: "rgba(245,236,217,0.52)" }}
          >
            community guidelines
          </Link>
          . Not an alumnus?{" "}
          <Link
            href="/"
            className="hover:underline underline-offset-4 focus-visible:underline focus-visible:outline-none"
            style={{ color: "rgba(245,236,217,0.52)" }}
          >
            Head back home
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
