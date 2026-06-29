// components/field-kit/tokens.ts
//
// V17 "dark theatrical" design tokens for the Field Kit — ported verbatim from
// the approved mockup (app/journey-card-mockup/v17/traveling-artist/sampleProgram.ts).
// Do NOT invent new colors; reuse these. Fonts resolve to the CSS variables
// already wired in app/fonts.ts + app/layout.tsx.

import type { CSSProperties } from "react";
import type { ItineraryAccent } from "@/lib/programItinerary";

export const T = {
  bg: "#16101c", // near-black plum — the theatrical house
  paper: "#1e1626", // raised dark panel
  card: "#251b2e", // card surface — charcoal plum
  ink: "#f6efe3", // cream type on dark
  black: "#0e0a13", // black-out surface — bezels / tab bars / CTAs
  yellow: "#f5c842", // DAT yellow — nav + CTA spark
  teal: "#2fb3c9", // DAT blue lifted for dark contrast
  pink: "#ff4067", // stage pink — hero text / urgency
  grape: "#a06fd1",
  purple: "#b465ff",
  green: "#27b06a", // confirm / offline-ready
  muted: "rgba(246,239,227,0.52)",
  dim: "rgba(246,239,227,0.26)",
  sep: "rgba(246,239,227,0.10)",
  border: "rgba(246,239,227,0.14)",
} as const;

export const FONT = {
  anton: "var(--font-anton), system-ui, sans-serif",
  grotesk: "var(--font-space-grotesk), system-ui, sans-serif",
  dm: "var(--font-dm-sans), system-ui, sans-serif",
} as const;

export const STAMP_SHADOW =
  "drop-shadow(0 2px 4px rgba(36,17,35,0.35)) drop-shadow(0 6px 18px rgba(36,17,35,0.28))";

// Kraft-under-stage-light world: kraft texture beneath a deep theatrical wash.
// Falls back to the dark plum while the texture loads (or if it's absent).
export const KRAFT_SRC = "/texture/kraft-paper.png";
export const KRAFT_PAGE: CSSProperties = {
  backgroundImage: `linear-gradient(rgba(14,10,19,0.90), rgba(14,10,19,0.95)), url('${KRAFT_SRC}')`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
  backgroundColor: T.bg,
};

/** Map an itinerary accent token to its hex. */
export function accent(a: ItineraryAccent): string {
  return { pink: T.pink, teal: T.teal, yellow: T.yellow, grape: T.grape, purple: T.purple }[a];
}
