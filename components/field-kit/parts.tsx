// components/field-kit/parts.tsx
//
// Shared Field Kit primitives, ported from the V17 mockup `parts.tsx` into the
// production tree. PhoneFrame is intentionally dropped — production renders the
// content full-width on a real device. ClubChip resolves against the real
// lib/dramaClubMap (by slug); unknown slugs render nothing (no fabricated data).

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { dramaClubMap } from "@/lib/dramaClubMap";
import { T, FONT } from "@/components/field-kit/tokens";

// ── Persistent companion nav (bottom tab bar) ────────────────────────────────
// Home · Journey · Capture (center spark) · Crew · Stories.
// Capture/Crew/Stories are stub destinations this slice.
const NAV: { id: string; label: string; href: string; glyph: string; match: (p: string) => boolean }[] = [
  { id: "today", label: "Home", href: "/field-kit", glyph: "◉", match: (p) => p === "/field-kit" },
  { id: "itinerary", label: "Journey", href: "/field-kit/itinerary", glyph: "❖", match: (p) => p.startsWith("/field-kit/itinerary") },
  { id: "capture", label: "Capture", href: "/field-kit/capture", glyph: "✦", match: (p) => p.startsWith("/field-kit/capture") },
  { id: "cohort", label: "Crew", href: "/field-kit/cohort", glyph: "❀", match: (p) => p.startsWith("/field-kit/cohort") },
  { id: "traces", label: "Stories", href: "/field-kit/traces", glyph: "▤", match: (p) => p.startsWith("/field-kit/traces") },
];

export function CompanionTabBar() {
  const pathname = usePathname() || "/field-kit";
  return (
    <nav
      style={{
        position: "sticky",
        bottom: 0,
        zIndex: 40,
        flexShrink: 0,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "stretch",
        // Glass treatment — matches the Field Kit top bar (app/field-kit/layout.tsx):
        // translucent background + blur so content stays legible scrolling under it.
        // Alpha is on the background, not the element, so the tab items stay opaque.
        backgroundColor: "rgba(14, 10, 19, 0.6)",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderTop: `1px solid ${T.sep}`,
        padding: "6px 4px max(10px, env(safe-area-inset-bottom))",
        gap: 2,
      }}
    >
      {NAV.map((n) => {
        const on = n.match(pathname);
        const isCapture = n.id === "capture";
        return (
          <Link
            key={n.id}
            href={n.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              textDecoration: "none",
              padding: "4px 2px",
              color: on ? T.yellow : "rgba(246,239,227,0.55)",
            }}
          >
            <span
              aria-hidden
              style={{
                fontSize: isCapture ? 20 : 16,
                lineHeight: 1,
                width: isCapture ? 34 : "auto",
                height: isCapture ? 34 : "auto",
                borderRadius: isCapture ? "50%" : 0,
                backgroundColor: isCapture ? T.yellow : "transparent",
                color: isCapture ? "#241123" : undefined,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginTop: isCapture ? -10 : 0,
                boxShadow: isCapture ? "0 4px 14px rgba(245,200,66,0.45)" : undefined,
              }}
            >
              {n.glyph}
            </span>
            <span
              style={{
                fontFamily: FONT.grotesk,
                fontSize: 8.5,
                fontWeight: 700,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {n.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

// ── Accent pill (tag) ────────────────────────────────────────────────────────
export function Pill({
  children,
  color = T.muted,
  solid = false,
}: {
  children: React.ReactNode;
  color?: string;
  solid?: boolean;
}) {
  return (
    <span
      style={{
        fontFamily: FONT.grotesk,
        fontSize: 9.5,
        fontWeight: 700,
        letterSpacing: "0.12em",
        textTransform: "uppercase",
        color: solid ? "#fff" : color,
        backgroundColor: solid ? color : "rgba(246,239,227,0.10)",
        padding: "0.2em 0.6em",
        borderRadius: 3,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

// ── Drama-club chip — resolves against the real lib/dramaClubMap ─────────────
export function ClubChip({ slug, color = T.teal }: { slug: string; color?: string }) {
  const club = (dramaClubMap as Record<string, { name?: string }>)[slug];
  if (!club?.name) return null;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: FONT.grotesk,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: T.ink,
      }}
    >
      <span aria-hidden style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: color, flexShrink: 0 }} />
      {club.name}
    </span>
  );
}

// ── Partner-org display name ─────────────────────────────────────────────────
// Defined in a non-client module (./partnerOrgName) so server components can
// call it directly; re-exported here for client consumers' convenience.
export { partnerOrgName } from "@/components/field-kit/partnerOrgName";
