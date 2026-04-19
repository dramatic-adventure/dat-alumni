// app/login/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import LoginButton from "./LoginButton";
import {
  ALUMNI_COUNT_DISPLAY,
  COUNTRY_COUNT,
  SEASON_COUNT,
} from "@/lib/datStats";

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

const CARD_BG = "rgba(54, 18, 82, 0.97)";

const STATS = [
  { number: ALUMNI_COUNT_DISPLAY, label: "Alumni Artists" },
  { number: String(COUNTRY_COUNT), label: "Countries" },
  { number: String(SEASON_COUNT), label: "Seasons" },
];

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const rawCb     = firstParam(sp?.callbackUrl);
  const invite    = firstParam(sp?.invite)?.trim() || undefined;
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
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        color: "#f5ecd9",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
      }}
    >
      {/* ══════════════════════════════════════════════════════
          PAGE-LEVEL HERO — cinematic full-width statement
          "ALUMNI PORTAL" + "The adventure continues."
          ══════════════════════════════════════════════════════ */}
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "clamp(260px, 45vh, 480px)",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        <Image
          src="/images/alumni-hero.jpg"
          alt="DAT alumni artists"
          fill
          priority
          style={{ objectFit: "cover", objectPosition: "center 30%" }}
        />
        {/* Gradient: transparent top → deep purple-black at bottom */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(36,17,35,0.12) 0%, rgba(36,17,35,0.80) 100%)",
          }}
        />
        {/* Hero text anchored to image bottom */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-end",
            padding:
              "0 clamp(1.5rem, 5vw, 3rem) clamp(1.75rem, 4vw, 2.75rem)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontFamily:
                "var(--font-special-elite), ui-monospace, monospace",
              fontSize: "clamp(0.58rem, 1.1vw, 0.75rem)",
              letterSpacing: "0.52em",
              textTransform: "uppercase",
              color: "#FFCC00",
              opacity: 0.9,
              marginBottom: "0.65rem",
            }}
          >
            ALUMNI PORTAL
          </div>
          <p
            style={{
              fontFamily: "var(--font-gloucester), serif",
              fontSize: "clamp(1.5rem, 3.5vw, 2.4rem)",
              fontStyle: "italic",
              lineHeight: 1.15,
              color: "rgba(245,236,217,0.88)",
              margin: 0,
            }}
          >
            The adventure continues.
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          CARD SECTION — invitation card on kraft background
          ══════════════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding:
            "clamp(2.5rem, 6vw, 4rem) clamp(1.25rem, 5vw, 2rem) clamp(2rem, 5vw, 3.5rem)",
        }}
      >
        {/* ── Invitation card ─────────────────────────────── */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            maxWidth: "460px",
            background: CARD_BG,
            border: "1px solid rgba(255,204,0,0.22)",
            boxShadow:
              "0 32px 80px rgba(0,0,0,0.65), " +
              "0 8px 24px rgba(0,0,0,0.40), " +
              "inset 0 1px 0 rgba(255,255,255,0.07)",
          }}
        >
          {/* ── Mini hero image ────────────────────────────── */}
          <div
            style={{
              position: "relative",
              height: "200px",
              overflow: "hidden",
            }}
          >
            <Image
              src="/images/performing-zanzibar.jpg"
              alt="DAT artists performing"
              fill
              priority
              style={{ objectFit: "cover", objectPosition: "center 35%" }}
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to bottom, rgba(54,18,82,0) 25%, ${CARD_BG} 100%)`,
              }}
            />
          </div>

          {/* ── Card body ──────────────────────────────────── */}
          <div
            style={{
              padding:
                "clamp(1.25rem, 4vw, 2rem) clamp(1.5rem, 5vw, 3rem) clamp(2rem, 5vw, 3.5rem)",
            }}
          >
            {/* Stamp eyebrow */}
            <div
              style={{
                fontFamily:
                  "var(--font-special-elite), ui-monospace, monospace",
                fontSize: "0.6rem",
                letterSpacing: "0.42em",
                textTransform: "uppercase",
                color: "#FFCC00",
                opacity: 0.85,
                marginBottom: "1.75rem",
                textAlign: "center",
              }}
            >
              DAT · EST. 2006 · NYC → THE WORLD
            </div>

            {/* ── Conditional banners ──────────────────────── */}

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
                    fontFamily:
                      "var(--font-special-elite), ui-monospace, monospace",
                    fontSize: "0.6rem",
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    color: "#FFCC00",
                    marginBottom: "0.5rem",
                  }}
                >
                  You&rsquo;re on the list
                </div>
                Welcome — you&rsquo;ve been invited to claim your alumni
                profile. Sign in and we&rsquo;ll bring the invite with you.
              </div>
            )}

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
                    fontFamily:
                      "var(--font-special-elite), ui-monospace, monospace",
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

            {/* ── Headline ─────────────────────────────────── */}
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
              Welcome home.
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
                ? "You've been invited to claim your place in the DAT community. Sign in and we'll carry the invite through — so you land exactly where you need to be."
                : "Sign in to claim your profile, update your information, share what you're making, and connect with like-minded artists, collaborators, and opportunities around the world."}
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
              We use Google sign-in only to match you with your profile.
            </p>

            {/* ── Divider ──────────────────────────────────── */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                margin: "2rem 0",
                fontFamily:
                  "var(--font-special-elite), ui-monospace, monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.42em",
                textTransform: "uppercase",
                color: "rgba(245,236,217,0.38)",
              }}
            >
              <span
                aria-hidden
                style={{
                  flex: 1,
                  height: "1px",
                  backgroundColor: "rgba(245,236,217,0.12)",
                }}
              />
              No Google account?
              <span
                aria-hidden
                style={{
                  flex: 1,
                  height: "1px",
                  backgroundColor: "rgba(245,236,217,0.12)",
                }}
              />
            </div>

            {/* ── Support block ────────────────────────────── */}
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
                Email us and we&rsquo;ll help you get set up.
              </p>
              <a
                href={`mailto:alumni@dramaticadventure.com?subject=${encodeURIComponent(
                  "Alumni profile help"
                )}&body=${encodeURIComponent(
                  "Hi DAT — I'd like help accessing my alumni profile.\n\nName:\nYears / projects with DAT:\nPreferred email:\n"
                )}`}
                style={{
                  fontFamily:
                    "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  transition: "color 0.2s ease, letter-spacing 0.2s ease",
                }}
                className="text-[#F23359] tracking-[0.01em] hover:text-[#FFCC00] hover:tracking-[0.06em] focus-visible:underline focus-visible:outline-none"
              >
                alumni@dramaticadventure.com
                <span aria-hidden>→</span>
              </a>
            </div>

            {/* ── Footer micro-link ────────────────────────── */}
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
      </div>
    </div>
  );
}
