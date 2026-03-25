// lib/mapPanels.ts
import type { SpotlightUpdate } from "@/components/alumni/SpotlightPanel";
import type { HighlightCard } from "@/components/alumni/HighlightPanel";

export type RawRow = {
  profileSlug?: string;
  type?: string;                 // "DAT Spotlight" | "Spotlight" | "Highlight" | ...
  title?: string;
  subtitle?: string;
  bodyNote?: string;
  mediaUrls?: string;            // comma- or space-separated
  mediaType?: string;
  eventDate?: string;            // YYYY-MM-DD (optional)
  evergreen?: string | boolean;  // "true"/"false"/"1"/"0"/yes/no
  expirationDate?: string;       // YYYY-MM-DD (optional)
  ctaText?: string;
  ctaUrl?: string;
  featured?: string | boolean;
  sortDate?: string;             // YYYY-MM-DD (optional)
  tags?: string;                 // optional, comma-separated
};

const norm = (s?: string) => (s ?? "").trim().toLowerCase();
const coerceBool = (v: any) => {
  if (typeof v === "boolean") return v;
  const s = norm(String(v));
  return s === "true" || s === "1" || s === "yes" || s === "y";
};

const firstMedia = (s?: string) => {
  if (!s) return undefined;
  // split on comma or whitespace, keep non-empty
  const parts = s.split(/[,\s]+/).map(t => t.trim()).filter(Boolean);
  return parts[0];
};

export const isSpotlightRow = (row: RawRow) => {
  const t = norm(row.type);
  return t === "dat spotlight" || t === "spotlight" || t === "dat-spotlight";
};

export const isHighlightRow = (row: RawRow) => {
  const t = norm(row.type);
  return t === "highlight" || t === "highlights";
};

export function rowToSpotlightUpdate(row: RawRow): SpotlightUpdate {
  return {
    tag: row.type,
    headline: row.title ?? "",
    subheadline: row.subtitle ?? "",
    body: row.bodyNote ?? "",
    ctaLink: row.ctaUrl,
    mediaUrl: firstMedia(row.mediaUrls),
    evergreen: coerceBool(row.evergreen),
    highlighted: coerceBool(row.featured),
  };
}

export function rowToHighlightCard(row: RawRow): HighlightCard {
  return {
    headline: row.title ?? "",
    subheadline: row.subtitle,
    body: row.bodyNote,
    mediaUrl: firstMedia(row.mediaUrls),
    ctaLink: row.ctaUrl,
    evergreen: coerceBool(row.evergreen),
    expirationDate: row.expirationDate,
    category: "Highlight",
  };
}

/** Filter rows to a specific artist profile by slug (matches CSV `profileSlug`). */
const forSlug = (rows: RawRow[], slug: string) =>
  rows.filter(r => norm(r.profileSlug) === norm(slug));

/** Main helper: give it the raw rows (from the Spotlights/Highlights CSV) + slug. */
export function mapRowsToPanels(
  rows: RawRow[],
  slug: string
): { spotlight: SpotlightUpdate[]; highlights: HighlightCard[] } {
  const mine = forSlug(rows, slug);

  const spotlight = mine.filter(isSpotlightRow).map(rowToSpotlightUpdate);
  const highlights = mine.filter(isHighlightRow).map(rowToHighlightCard);

  // Optional: stable order — evergreen first, otherwise by sortDate desc then eventDate desc
  const byDates = (a: RawRow, b: RawRow) =>
    (b.sortDate ?? "").localeCompare(a.sortDate ?? "") ||
    (b.eventDate ?? "").localeCompare(a.eventDate ?? "");

  // If you want to pre-sort, map with rows included; otherwise panels do their own handling.
  // (Your panels already bring evergreen first; keeping this simple.)
  return {
    spotlight,
    highlights,
  };
}
