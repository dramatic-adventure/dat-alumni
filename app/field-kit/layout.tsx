// app/field-kit/layout.tsx
//
// Field Kit chrome + the in-program gate (applies to every /field-kit route).
// The global marketing Header/Footer are suppressed on /field-kit (see
// components/ui/SiteChrome.tsx); this provides the app's own chrome instead — a
// slim top bar (DAT logo → home, for branding + an exit) and the bottom
// CompanionTabBar. Signed-out → /login; signed-in but not on the program → a
// friendly gate message.

import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { CompanionTabBar } from "@/components/field-kit/parts";
import NavProgress from "@/components/field-kit/NavProgress";
import AccountMenu from "@/components/field-kit/AccountMenu";
import SyncStatus from "@/components/field-kit/SyncStatus";
import FieldKitLogo from "@/components/field-kit/FieldKitLogo";
import ServiceWorkerRegistrar from "@/components/field-kit/ServiceWorkerRegistrar";
import NavCacheReconciler from "@/components/field-kit/NavCacheReconciler";
import { KRAFT_PAGE, T, FONT } from "@/components/field-kit/tokens";
import { getFieldKitAccess, FIELD_KIT_PROGRAM_ID } from "@/lib/fieldKitAccess";

// Per-user, never statically generated or shared-CDN cached: the gate decision
// depends on the session, so every response must render dynamically.
export const revalidate = 0;
export const dynamic = "force-dynamic";

// Field-Kit-scoped PWA metadata: the install affordance + iOS standalone tags
// live only on the kit (the rest of the marketing site isn't an installable app).
export const metadata = {
  title: "PASSAGE Field Kit",
  appleWebApp: {
    capable: true,
    title: "Field Kit",
    statusBarStyle: "black-translucent" as const,
  },
  icons: {
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#0e0a13",
  // Extend behind the iOS status bar / home indicator so env(safe-area-inset-*)
  // resolve to real insets in standalone (otherwise they're 0 and the top bar
  // would sit under the status bar).
  viewportFit: "cover" as const,
};

export default async function FieldKitLayout({ children }: { children: React.ReactNode }) {
  const access = await getFieldKitAccess();

  if (!access.allowed && access.reason === "signed-out") {
    redirect(access.loginUrl);
  }

  return (
    <div className="fk-root" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", ...KRAFT_PAGE }}>
      {/* Slice 5 accessibility pass: a VISIBLE, on-brand focus indicator for
          every interactive element in the kit. :focus-visible keeps it off
          taps and on keyboard/switch navigation, where it matters. */}
      {/* Touch pass: every link/button in the kit gets (1) a hit area extended
          ~10px past its painted bounds via an absolutely positioned ::after —
          no layout or visual change, just a bigger tap target (small glyph
          buttons like the 18px toast ✕ were well under the 44px guideline);
          (2) touch-action:manipulation + a transparent tap highlight so taps
          register without double-tap-zoom delay or the gray iOS flash; and
          (3) an instant :active press state (fade + slight shrink) so a touch
          is visually acknowledged the moment the finger lands — pages are
          force-dynamic and slow on venue wifi, and unacknowledged taps read
          as dead buttons. Inline styles win over these rules, so elements
          that set their own position/transition (fixed overlays, .fk-tab)
          keep it; ::after is clipped by inline overflow:hidden (e.g. the
          composer's 64px photo tiles), which is fine — those are already big. */}
      <style>{`
        .fk-root :focus-visible { outline: 2px solid ${T.yellow}; outline-offset: 2px; border-radius: 4px; }
        .fk-root a, .fk-root button {
          position: relative;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
          transition: opacity 90ms ease, transform 90ms ease;
        }
        .fk-root a::after, .fk-root button::after { content: ""; position: absolute; inset: -10px; }
        .fk-root a:active, .fk-root button:active:not(:disabled) { opacity: 0.65; transform: scale(0.97); }
      `}</style>
      <ServiceWorkerRegistrar />
      <NavCacheReconciler />
      {/* Suspense: NavProgress reads useSearchParams (to detect commits), which
          requires a boundary when mounted from a server layout. */}
      <Suspense fallback={null}>
        <NavProgress />
      </Suspense>
      <FieldKitTopBar programId={FIELD_KIT_PROGRAM_ID} isAdmin={access.allowed ? access.isAdmin : false} />
      {/* Clearance below the top bar: the DAT logo overhangs the bar by 36px
          (see FieldKitLogo's negative marginBottom), so page content butted
          right up against it without this gap — headlines like "Field Kit" /
          "Passage: Slovakia 2026" sat almost under the logo's glow. */}
      <div style={{ flex: 1, paddingTop: 20 }}>
        {access.allowed ? children : <NotInProgram email={(access as { email: string }).email} />}
      </div>
      {access.allowed && <CompanionTabBar />}
    </div>
  );
}

// Slim in-app top bar: DAT logo links home (branding + an exit out of the app
// surface). Sticky so it stays put; sits above content like the bottom tab bar.
function FieldKitTopBar({ programId, isAdmin }: { programId: string; isAdmin: boolean }) {
  return (
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        flexShrink: 0,
        display: "flex",
        alignItems: "flex-start",
        // Translucent bar (T.black #0e0a13 @ 0.6) — applied to the BACKGROUND, not
        // the element, so the logo/wordmark stay fully opaque. The blur keeps
        // content legible as it scrolls underneath.
        backgroundColor: "rgba(14, 10, 19, 0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: `1px solid ${T.sep}`,
        // Overhang technique: the bar stays slim (~40px) via small vertical
        // padding, while the centered logo is large (56px) and given a negative
        // bottom margin so it hangs past the bottom border like a badge instead
        // of forcing the bar taller. overflow:visible lets it spill downward.
        // In standalone, the top inset is added to the top padding so the
        // translucent bar fills behind the iOS status bar while its content
        // (logo, SyncStatus, menu) sits below it.
        padding: "calc(env(safe-area-inset-top) + 6px) clamp(14px, 4vw, 24px) 6px",
        overflow: "visible",
      }}
    >
      {/* left: DAT badge — links home; hangs below the bar. "/" is outside the
          manifest scope, so in standalone iOS opens it in the in-app browser. */}
      <FieldKitLogo />

      {/* right: connectivity status + the "more" menu (profile, sign out, install) */}
      <div style={{ marginLeft: "auto", alignSelf: "center", display: "inline-flex", alignItems: "center", gap: 12 }}>
        <SyncStatus programId={programId} />
        <AccountMenu programId={programId} isAdmin={isAdmin} />
      </div>
    </header>
  );
}

function NotInProgram({ email }: { email: string }) {
  return (
    <main style={{ maxWidth: 560, margin: "0 auto", padding: "72px clamp(18px, 5vw, 40px)", textAlign: "center" }}>
      {/* Marker for public/sw.js: the gate screen renders as a plain 200 at the
          SAME url as the real page, so the service worker sniffs the rendered
          HTML for this literal comment before ever caching a navigation. JSX
          comments compile away and never reach the DOM, so this uses
          dangerouslySetInnerHTML with a fixed, non-user-derived string to emit
          a real HTML comment. Must never appear on a real page's render. See
          field-kit-NAV-CACHE-DESIGN.md §2/§9. */}
      <span aria-hidden="true" dangerouslySetInnerHTML={{ __html: "<!--fk-gate-->" }} />
      <p style={{ fontFamily: FONT.grotesk, fontWeight: 700, fontSize: 11, letterSpacing: "0.28em", textTransform: "uppercase", color: T.teal, margin: "0 0 12px" }}>
        The Field Kit
      </p>
      <h1 style={{ fontFamily: FONT.anton, fontSize: "clamp(30px, 7vw, 52px)", lineHeight: 0.95, textTransform: "uppercase", color: T.ink, margin: "0 0 16px" }}>
        For artists on the trip.
      </h1>
      <p style={{ fontFamily: FONT.dm, fontSize: 15, lineHeight: 1.55, color: T.ink, opacity: 0.8, margin: "0 0 8px" }}>
        The Field Kit is the private in-program companion for artists currently on a DAT program. The account
        <b style={{ opacity: 0.95 }}> {email} </b>
        isn&apos;t on the roster for this trip.
      </p>
      <p style={{ fontFamily: FONT.dm, fontSize: 13.5, lineHeight: 1.55, color: T.muted, margin: "0 0 28px" }}>
        If you think that&apos;s a mistake, reach out to DAT and we&apos;ll get you added.
      </p>
      <Link
        href="/alumni/update"
        style={{ fontFamily: FONT.grotesk, fontSize: 12, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: T.ink, textDecoration: "none", padding: "10px 18px", borderRadius: 8, border: `1px solid ${T.border}` }}
      >
        Go to your profile
      </Link>
    </main>
  );
}
