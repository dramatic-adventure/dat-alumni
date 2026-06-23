// components/journeys/journeyTheme.ts
// Shared design tokens for the production Journey Card surfaces (index, archive,
// card view). Ported from the approved v17 mockup (sampleJourneys.ts `A`) so the
// live surfaces match the reference exactly: a light card on the kraft work-table.

import type { CSSProperties } from "react";
import type { JourneyAccent } from "@/lib/journeyCard";

export const A = {
  bg:     "#f2f2f2", // light card surface
  paper:  "#efe9df", // page paper / mosaic backdrop
  ink:    "#241123",
  yellow: "#f5c842",
  teal:   "#2493A9",
  pink:   "#F23359",
  grape:  "#7b4fa6",
  muted:  "rgba(36,17,35,0.45)",
  dim:    "rgba(36,17,35,0.20)",
  sep:    "rgba(36,17,35,0.10)",
  border: "rgba(36,17,35,0.13)",
} as const;

export const STAMP_SHADOW =
  "drop-shadow(0 2px 4px rgba(36,17,35,0.35)) drop-shadow(0 6px 18px rgba(36,17,35,0.28))";

// Kraft paper world — same asset the live site uses.
export const KRAFT_SRC = "/texture/kraft-paper.png";
export const KRAFT_PAGE: CSSProperties = {
  backgroundImage: `url('${KRAFT_SRC}')`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
  backgroundColor: "#e7ddc9",
};

// Frosted, readable-over-kraft container for editorial text. NO blur — the kraft
// grain still reads through; the veil just lifts dark ink type enough to stay legible.
export const GLASS: CSSProperties = {
  background: "rgba(255,255,255,0.44)",
  border: `1px solid ${A.border}`,
  borderRadius: 12,
};

export function accentColor(a: JourneyAccent): string {
  switch (a) {
    case "pink":   return A.pink;
    case "teal":   return A.teal;
    case "yellow": return A.yellow;
    case "grape":  return A.grape;
  }
}

/** Normalize an artist-provided media URL (http → https; trims). */
export function safeMediaUrl(url: string | undefined | null): string {
  return String(url ?? "").trim().replace(/^http:\/\//i, "https://");
}
