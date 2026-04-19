// app/login/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
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
        background: "#241123",
        color: "#f5ecd9",
        fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ════════════════════════════════════════════════════════
          DESKTOP LAYOUT — side-by-side columns
          MOBILE — single column (image strip → form)
          ════════════════════════════════════════════════════════ */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "row",
          minHeight: "100dvh",
        }}
      >

        {/* ══════════════════════════════════════════════════════
            LEFT COLUMN — Cinematic image stage (desktop only)
            ══════════════════════════════════════════════════════ */}
        <div
          aria-hidden
          style={{
            position: "relative",
            flexBasis: "62%",
            flexShrink: 0,
            display: "none",
            overflow: "hidden",
            backgroundColor: "#1a0c1a",
          }}
          className="login-image-col"
        >
          {/* The photograph */}
          <Image
            src="/images/alumni-hero.jpg"
            alt=""
            fill
            priority
            sizes="62vw"
            style={{
              objectFit: "cover",
              objectPosition: "center 32%",
              filter: "brightness(0.82) contrast(1.1) saturate(1.15)",
            }}
          />

          {/* Layer 1 — top vignette */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(36,17,35,0.72) 0%, rgba(36,17,35,0.08) 28%, rgba(36,17,35,0.08) 52%, rgba(36,17,35,0.96) 100%)",
            }}
          />

          {/* Layer 2 — right-edge dissolve into form column */}
          <div
            style={{
              position: "absolute",
              inset: "0 0 0 auto",
              width: "22%",
              background:
                "linear-gradient(90deg, transparent 0%, rgba(36,17,35,0.6) 50%, rgba(36,17,35,0.99) 100%)",
            }}
          />

          {/* Layer 3 — subtle purple depth wash at top-right */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 60% 50% at 80% 5%, rgba(108,0,175,0.25), transparent 70%)",
              mixBlendMode: "screen",
            }}
          />

          {/* Editorial inner frame */}
          <div
            style={{
              position: "absolute",
              inset: "1.75rem",
              border: "1px solid rgba(255,204,0,0.28)",
              pointerEvents: "none",
            }}
          />

          {/* Top-left stamp */}
          <div
            style={{
              position: "absolute",
              top: "2.75rem",
              left: "2.75rem",
              fontFamily: "var(--font-special-elite), ui-monospace, monospace",
              fontSize: "0.6rem",
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              color: "#FFCC00",
              opacity: 0.85,
            }}
          >
            DAT · EST. 2007 · NYC → THE WORLD
          </div>

          {/* ── Bottom content zone ───────────────────────── */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "0 3rem 3rem 3rem",
            }}
          >
            {/* Stat strip — mirrors Partners page stat band */}
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: "2.75rem",
                paddingTop: "1.25rem",
                marginBottom: "1.75rem",
                borderTop: "1px solid rgba(255,204,0,0.22)",
              }}
            >
              {STATS.map(({ number, label }) => (
                <div key={label}>
                  <div
                    style={{
                      fontFamily: "var(--font-anton), sans-serif",
                      fontSize: "clamp(1.9rem, 2.8vw, 2.8rem)",
                      color: "#FFCC00",
                      lineHeight: 1,
                    }}
                  >
                    {number}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-dm-sans), sans-serif",
                      fontSize: "0.65rem",
                      letterSpacing: "0.32em",
                      textTransform: "uppercase",
                      color: "rgba(245,236,217,0.6)",
                      marginTop: "0.45rem",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Caption quote */}
            <div
              style={{
                fontFamily: "var(--font-gloucester), serif",
                fontSize: "clamp(1.4rem, 2.2vw, 2rem)",
                color: "#f5ecd9",
                lineHeight: 1.28,
                letterSpacing: "-0.01em",
                textShadow: "0 2px 24px rgba(0,0,0,0.45)",
                maxWidth: "22ch",
              }}
            >
              Every chapter of the company
              <br />
              is still being written.
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            RIGHT COLUMN — Sign-in form
            ══════════════════════════════════════════════════════ */}
        <div
          style={{
            position: "relative",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
            background:
              "radial-gradient(ellipse 80% 55% at 110% 0%, rgba(108,0,175,0.48), transparent 58%), " +
              "radial-gradient(ellipse 60% 40% at -10% 100%, rgba(255,204,0,0.07), transparent 62%), " +
              "#241123",
          }}
        >
          {/* Grain texture */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "url('/texture/kraft-paper.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              opacity: 0.14,
              mixBlendMode: "soft-light",
              pointerEvents: "none",
            }}
          />

          {/* Left accent line — visible on desktop only */}
          <div
            aria-hidden
            className="login-accent-line"
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: "1px",
              background:
                "linear-gradient(180deg, transparent 0%, rgba(255,204,0,0.32) 20%, rgba(255,204,0,0.32) 80%, transparent 100%)",
              display: "none",
            }}
          />

          {/* ── Mobile-only cinematic strip ──────────────── */}
          <div
            className="login-mobile-strip"
            style={{
              position: "relative",
              height: "44vw",
              minHeight: "180px",
              maxHeight: "300px",
              overflow: "hidden",
              flexShrink: 0,
              backgroundColor: "#1a0c1a",
            }}
          >
            <Image
              src="/images/alumni-hero.jpg"
              alt="DAT artists at work around the world"
              fill
              priority
              sizes="100vw"
              style={{
                objectFit: "cover",
                objectPosition: "center 32%",
                filter: "brightness(0.82) contrast(1.08) saturate(1.1)",
              }}
            />
            <div
              aria-hidden
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(36,17,35,0.28) 0%, rgba(36,17,35,0.0) 40%, rgba(36,17,35,0.88) 100%)",
              }}
            />
            {/* Mobile stamp */}
            <div
              style={{
                position: "absolute",
                bottom: "1.1rem",
                left: "1.25rem",
                fontFamily: "var(--font-special-elite), ui-monospace, monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.38em",
                textTransform: "uppercase",
                color: "#FFCC00",
              }}
            >
              DAT · EST. 2007
            </div>
            {/* Mobile stat row */}
            <div
              style={{
                position: "absolute",
                bottom: "1.1rem",
                right: "1.25rem",
                display: "flex",
                gap: "1.25rem",
                alignItems: "baseline",
              }}
            >
              {STATS.map(({ number, label }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div
                    style={{
                      fontFamily: "var(--font-anton), sans-serif",
                      fontSize: "1.1rem",
                      color: "#FFCC00",
                      lineHeight: 1,
                    }}
                  >
                    {number}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-dm-sans), sans-serif",
                      fontSize: "0.52rem",
                      letterSpacing: "0.28em",
                      textTransform: "uppercase",
                      color: "rgba(245,236,217,0.6)",
                      marginTop: "0.2rem",
                    }}
                  >
                    {label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Form body ────────────────────────────────── */}
          <div
            style={{
              position: "relative",
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "3.5rem 2.5rem",
            }}
          >
            <div style={{ width: "100%", maxWidth: "400px" }}>

              {/* Eyebrow */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.85rem",
                  fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
                  fontSize: "0.67rem",
                  letterSpacing: "0.46em",
                  textTransform: "uppercase",
                  color: "#FFCC00",
                  marginBottom: "1.75rem",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    display: "inline-block",
                    width: "1.75rem",
                    height: "1px",
                    backgroundColor: "#FFCC00",
                    flexShrink: 0,
                  }}
                />
                Alumni Portal
              </div>

              {/* ── Conditional banners ───────────────────── */}

              {/* Invite banner */}
              {hasInvite && !errorCopy && (
                <div
                  style={{
                    borderRadius: "8px",
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
                    borderRadius: "8px",
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
                  fontSize: "clamp(3rem, 5.5vw, 4.8rem)",
                  lineHeight: 1.04,
                  letterSpacing: "-0.015em",
                  color: "#f5ecd9",
                  marginBottom: "1.35rem",
                  /* Three-line composition — visual weight on last word */
                }}
              >
                Welcome
                <br />
                home,
                <br />
                <em
                  style={{
                    color: "#FFCC00",
                    fontStyle: "italic",
                  }}
                >
                  traveler.
                </em>
              </h1>

              {/* Body copy */}
              <p
                style={{
                  fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                  fontSize: "clamp(0.9rem, 1.4vw, 1rem)",
                  lineHeight: 1.72,
                  color: "rgba(245,236,217,0.72)",
                  maxWidth: "36ch",
                  marginBottom: "2.5rem",
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
                  fontSize: "0.73rem",
                  lineHeight: 1.6,
                  color: "rgba(245,236,217,0.42)",
                  marginTop: "1rem",
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
                  margin: "2.5rem 0",
                  fontFamily: "var(--font-special-elite), ui-monospace, monospace",
                  fontSize: "0.6rem",
                  letterSpacing: "0.42em",
                  textTransform: "uppercase",
                  color: "rgba(245,236,217,0.42)",
                }}
              >
                <span
                  aria-hidden
                  style={{
                    flex: 1,
                    height: "1px",
                    backgroundColor: "rgba(245,236,217,0.14)",
                  }}
                />
                No Google account?
                <span
                  aria-hidden
                  style={{
                    flex: 1,
                    height: "1px",
                    backgroundColor: "rgba(245,236,217,0.14)",
                  }}
                />
              </div>

              {/* ── Support block ─────────────────────────── */}
              <div
                style={{
                  borderRadius: "10px",
                  border: "1px solid rgba(245,236,217,0.13)",
                  backgroundColor: "rgba(245,236,217,0.03)",
                  padding: "1.35rem 1.5rem",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
                    fontSize: "0.875rem",
                    lineHeight: 1.68,
                    color: "rgba(245,236,217,0.78)",
                    marginBottom: "0.9rem",
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
                  fontSize: "0.7rem",
                  color: "rgba(245,236,217,0.36)",
                  marginTop: "2rem",
                  lineHeight: 1.6,
                }}
              >
                By signing in you agree to our{" "}
                <Link
                  href="/about/contact"
                  className="hover:underline underline-offset-4 focus-visible:underline focus-visible:outline-none"
                  style={{ color: "rgba(245,236,217,0.58)" }}
                >
                  community guidelines
                </Link>
                . Not an alumnus?{" "}
                <Link
                  href="/"
                  className="hover:underline underline-offset-4 focus-visible:underline focus-visible:outline-none"
                  style={{ color: "rgba(245,236,217,0.58)" }}
                >
                  Head back home
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          Responsive layout CSS — scoped here to avoid globals
          ════════════════════════════════════════════════════════ */}
      <style>{`
        /* Desktop: show image column + accent line, hide mobile strip */
        @media (min-width: 1024px) {
          .login-image-col   { display: block !important; }
          .login-accent-line { display: block !important; }
          .login-mobile-strip { display: none !important; }
        }
      `}</style>
    </div>
  );
}
