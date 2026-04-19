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
  // If caller passed an explicit callbackUrl that already has ?invite=, don't touch it.
  if (/[?&]invite=/.test(callbackUrl)) return callbackUrl;
  // Only auto-attach to the default alumni-update destination.
  if (callbackUrl !== "/alumni/update") return callbackUrl;
  const sep = callbackUrl.includes("?") ? "&" : "?";
  return `${callbackUrl}${sep}invite=${encodeURIComponent(invite)}`;
}

/** Map NextAuth error codes to human copy. */
function errorMessage(code: string | undefined): string | null {
  if (!code) return null;
  switch (code) {
    case "OAuthAccountNotLinked":
      return "That Google account doesn’t match an existing alumni record. If you have more than one Google login, try the other one — or email us and we’ll link it by hand.";
    case "AccessDenied":
      return "Access was denied. If you believe you should have access, reach out and we’ll sort it out.";
    case "Verification":
      return "Your sign-in link has expired. Start again below.";
    case "OAuthSignin":
    case "OAuthCallback":
    case "OAuthCreateAccount":
    case "Callback":
      return "Something hiccuped on Google’s end. Give it another go — it almost always works on the second try.";
    case "SessionRequired":
      return "You need to be signed in to view that page. Sign in below and we’ll drop you back where you were.";
    default:
      return "We couldn’t complete sign-in. Try again, or reach out if it keeps happening.";
  }
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = searchParams ? await searchParams : undefined;
  const rawCb = firstParam(sp?.callbackUrl);
  const invite = firstParam(sp?.invite)?.trim() || undefined;
  const errorCode = firstParam(sp?.error);

  const baseCallback = safeCallback(rawCb);
  const callbackUrl = withInvite(baseCallback, invite);

  const session = await auth();
  if (session) redirect(callbackUrl);

  const errorCopy = errorMessage(errorCode);
  const hasInvite = Boolean(invite);

  return (
    <section
      className="relative w-full"
      style={{
        fontFamily: "var(--font-space-grotesk), system-ui, sans-serif",
        color: "#f5ecd9",
      }}
    >
      {/* Full-bleed dark stage — sits on top of the global kraft background. */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          minHeight: "min(920px, calc(100vh - 96px))",
          background:
            "radial-gradient(1200px 600px at 85% 15%, rgba(108,0,175,0.55), transparent 60%), radial-gradient(900px 500px at 10% 90%, rgba(255,204,0,0.10), transparent 65%), #241123",
        }}
      >
        {/* Subtle grain wash for warmth */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light"
          style={{
            backgroundImage: "url('/texture/kraft-paper.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />

        <div className="relative mx-auto grid w-full max-w-[1400px] grid-cols-1 lg:grid-cols-12 lg:gap-0">
          {/* ============ IMAGE COLUMN ============ */}
          <div className="relative lg:col-span-7">
            <div
              className="relative h-[42vh] min-h-[320px] w-full overflow-hidden lg:h-full lg:min-h-[720px]"
              style={{ backgroundColor: "#1a0c1a" }}
            >
              <Image
                src="/images/alumni-hero.jpg"
                alt="Dramatic Adventure Theatre alumni at work around the world"
                fill
                priority
                sizes="(min-width: 1024px) 58vw, 100vw"
                className="object-cover"
                style={{ objectPosition: "center 35%" }}
              />
              {/* Cinematic fades */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(36,17,35,0.35) 0%, rgba(36,17,35,0.15) 35%, rgba(36,17,35,0.6) 100%)",
                }}
              />
              <div
                aria-hidden
                className="absolute inset-y-0 right-0 hidden w-40 lg:block"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(36,17,35,0) 0%, rgba(36,17,35,0.95) 100%)",
                }}
              />
              <div
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-32 lg:hidden"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(36,17,35,0) 0%, rgba(36,17,35,1) 100%)",
                }}
              />

              {/* Inner editorial frame */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-5 hidden border lg:block"
                style={{ borderColor: "rgba(255,204,0,0.35)" }}
              />

              {/* Passport-stamp caption */}
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between gap-4 lg:bottom-10 lg:left-10 lg:right-20">
                <div>
                  <div
                    className="mb-2 text-[0.68rem] tracking-[0.4em]"
                    style={{
                      fontFamily:
                        "var(--font-special-elite), ui-monospace, monospace",
                      color: "#FFCC00",
                    }}
                  >
                    DAT · EST. 2007 · NYC → THE WORLD
                  </div>
                  <div
                    className="max-w-xl text-2xl leading-tight sm:text-3xl lg:text-4xl"
                    style={{
                      fontFamily: "var(--font-gloucester), serif",
                      color: "#f5ecd9",
                      textShadow: "0 2px 20px rgba(0,0,0,0.5)",
                    }}
                  >
                    Every chapter of the company<br className="hidden sm:block" /> is still being written.
                  </div>
                </div>

                <div
                  className="hidden shrink-0 rotate-[-4deg] rounded-sm border px-3 py-2 text-right text-[0.62rem] tracking-[0.3em] sm:block"
                  style={{
                    borderColor: "rgba(255,204,0,0.6)",
                    color: "#FFCC00",
                    fontFamily:
                      "var(--font-special-elite), ui-monospace, monospace",
                    backgroundColor: "rgba(36,17,35,0.35)",
                  }}
                >
                  ALUMNI
                  <br />
                  NETWORK
                </div>
              </div>
            </div>
          </div>

          {/* ============ SIGN-IN COLUMN ============ */}
          <div className="relative lg:col-span-5">
            <div className="flex min-h-full w-full items-center justify-center px-6 py-14 sm:px-10 lg:py-24">
              <div className="w-full max-w-md">
                {/* Eyebrow */}
                <div
                  className="mb-6 flex items-center gap-3 text-[0.7rem] tracking-[0.45em]"
                  style={{
                    fontFamily:
                      "var(--font-space-grotesk), system-ui, sans-serif",
                    color: "#FFCC00",
                    textTransform: "uppercase",
                  }}
                >
                  <span
                    aria-hidden
                    className="inline-block h-[1px] w-8"
                    style={{ backgroundColor: "#FFCC00" }}
                  />
                  Alumni Sign-In
                </div>

                {/* Invite banner */}
                {hasInvite && !errorCopy && (
                  <div
                    className="mb-6 rounded-md border px-4 py-3 text-sm"
                    style={{
                      borderColor: "rgba(255,204,0,0.45)",
                      backgroundColor: "rgba(255,204,0,0.08)",
                      color: "#f5ecd9",
                    }}
                  >
                    <div
                      className="mb-1 text-[0.65rem] tracking-[0.35em]"
                      style={{
                        color: "#FFCC00",
                        textTransform: "uppercase",
                        fontFamily:
                          "var(--font-special-elite), ui-monospace, monospace",
                      }}
                    >
                      You’re on the list
                    </div>
                    Welcome — you’ve been invited to claim your alumni profile. Sign in and we’ll bring the invite with you.
                  </div>
                )}

                {/* Error banner */}
                {errorCopy && (
                  <div
                    role="alert"
                    aria-live="polite"
                    className="mb-6 rounded-md border px-4 py-3 text-sm"
                    style={{
                      borderColor: "rgba(242,51,89,0.55)",
                      backgroundColor: "rgba(242,51,89,0.12)",
                      color: "#f5ecd9",
                    }}
                  >
                    <div
                      className="mb-1 text-[0.65rem] tracking-[0.35em]"
                      style={{
                        color: "#F23359",
                        textTransform: "uppercase",
                        fontFamily:
                          "var(--font-special-elite), ui-monospace, monospace",
                      }}
                    >
                      Sign-in interrupted
                    </div>
                    {errorCopy}
                  </div>
                )}

                {/* Headline */}
                <h1
                  className="mb-4 text-[2.5rem] leading-[1.02] sm:text-[3rem] lg:text-[3.4rem]"
                  style={{
                    fontFamily: "var(--font-gloucester), serif",
                    color: "#f5ecd9",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Welcome home,
                  <br />
                  <span style={{ color: "#FFCC00" }}>traveler.</span>
                </h1>

                {/* Body */}
                <p
                  className="mb-10 max-w-[38ch] text-base leading-relaxed sm:text-[1.05rem]"
                  style={{ color: "rgba(245,236,217,0.78)" }}
                >
                  {hasInvite
                    ? "Sign in to claim your profile, share a chapter, and stay woven into the DAT story — wherever in the world you’ve landed."
                    : "Sign in to update your profile, share a chapter, and stay woven into the DAT story — wherever in the world you’ve landed."}
                </p>

                {/* Sign-in CTA */}
                <LoginButton callbackUrl={callbackUrl} />

                {/* Trust line */}
                <p
                  className="mt-5 text-xs leading-relaxed"
                  style={{ color: "rgba(245,236,217,0.55)" }}
                >
                  Secured through Google. We only use your email to match you to your existing alumni record — no posts, no contacts, no noise.
                </p>

                {/* Divider */}
                <div
                  className="my-10 flex items-center gap-4 text-[0.65rem] tracking-[0.4em]"
                  style={{
                    color: "rgba(245,236,217,0.5)",
                    fontFamily:
                      "var(--font-special-elite), ui-monospace, monospace",
                  }}
                >
                  <span
                    aria-hidden
                    className="h-px flex-1"
                    style={{ backgroundColor: "rgba(245,236,217,0.18)" }}
                  />
                  NO GOOGLE ACCOUNT?
                  <span
                    aria-hidden
                    className="h-px flex-1"
                    style={{ backgroundColor: "rgba(245,236,217,0.18)" }}
                  />
                </div>

                {/* Support block */}
                <div
                  className="rounded-md border px-5 py-5"
                  style={{
                    borderColor: "rgba(245,236,217,0.18)",
                    backgroundColor: "rgba(245,236,217,0.04)",
                  }}
                >
                  <p
                    className="mb-3 text-sm leading-relaxed"
                    style={{ color: "rgba(245,236,217,0.82)" }}
                  >
                    We’ll set you up by hand — no new account required. Send us a note and we’ll get you connected to your profile within a day or two.
                  </p>
                  <a
                    href={`mailto:alumni@dramaticadventure.com?subject=${encodeURIComponent(
                      "Alumni profile help"
                    )}&body=${encodeURIComponent(
                      "Hi DAT — I’d like help accessing my alumni profile.\n\nName:\nYears / projects with DAT:\nPreferred email:\n"
                    )}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold underline-offset-4 hover:underline focus-visible:underline focus-visible:outline-none"
                    style={{ color: "#FFCC00" }}
                  >
                    alumni@dramaticadventure.com
                    <span aria-hidden>→</span>
                  </a>
                </div>

                {/* Footer micro-link */}
                <p
                  className="mt-8 text-xs"
                  style={{ color: "rgba(245,236,217,0.45)" }}
                >
                  By signing in you agree to our{" "}
                  <Link
                    href="/about/contact"
                    className="underline-offset-4 hover:underline focus-visible:underline"
                    style={{ color: "rgba(245,236,217,0.7)" }}
                  >
                    community guidelines
                  </Link>
                  . Not an alumnus?{" "}
                  <Link
                    href="/"
                    className="underline-offset-4 hover:underline focus-visible:underline"
                    style={{ color: "rgba(245,236,217,0.7)" }}
                  >
                    Head back home
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
