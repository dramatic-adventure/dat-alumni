// lib/loadSpotlightsHighlights.ts
import { parse } from "csv-parse/sync";
import type { SpotlightUpdate } from "@/lib/types";

// Prefer public env for client-side fetch; fallback to local file.
const SPOTLIGHTS_URL =
  process.env.NEXT_PUBLIC_SPOTLIGHTS_CSV_URL ??
  "/fallback/spotlights-highlights.csv";

const coerceBool = (v?: string) =>
  typeof v === "string"
    ? ["1", "true", "yes", "y"].includes(v.trim().toLowerCase())
    : false;

const firstMedia = (s?: string) =>
  s ? s.split(",").map((x) => x.trim()).filter(Boolean)[0] : undefined;

export async function loadSpotlightsHighlightsForProfile(
  profileSlug: string
): Promise<SpotlightUpdate[]> {
  const res = await fetch(SPOTLIGHTS_URL, { cache: "no-store" });
  if (!res.ok) return [];

  const text = await res.text();
  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Record<string, string>[];

  const anyHaveSlug = rows.some(
    (r) => (r.profileSlug || "").trim() !== ""
  );

  const norm = (s: string) => s.trim().toLowerCase();
  const wanted = norm(profileSlug);

  const filtered = anyHaveSlug
    ? rows.filter((r) => norm(r.profileSlug || "") === wanted)
    : rows; // global rows (no profileSlug in CSV)

  const mapped: SpotlightUpdate[] = filtered.map((r) => {
    const csvType = (r.type || "").trim();
    const lower = csvType.toLowerCase();

    // Normalize Spotlight tag to match UI checks
    const normalizedTag =
      lower === "spotlight" || lower === "dat spotlight" || lower === "dat-spotlight"
        ? "DAT Spotlight"
        : csvType; // "Highlight" stays "Highlight"

    return {
      slug: r.profileSlug,
      tag: normalizedTag, // "DAT Spotlight" or "Highlight"
      headline: r.title || "",
      subheadlineTitle: r.subtitle || "",
      body: r.bodyNote || "",
      mediaUrl: firstMedia(r.mediaUrls),
      ctaText: r.ctaText || undefined,
      ctaLink: r.ctaUrl || undefined,
      evergreen: coerceBool(r.evergreen),
      eventDate: r.eventDate || undefined,
      sortDate: r.sortDate || undefined,
    };
  });

  // Deduplicate: if the same item was edited (same headline, same type), keep only
  // the most recent version based on sortDate. This prevents edited rows from showing
  // up as distinct archive entries alongside their earlier draft.
  const deduped = new Map<string, SpotlightUpdate>();
  for (const item of mapped) {
    const key = `${(item.tag || "").toLowerCase()}::${(item.headline || "").toLowerCase().trim()}`;
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, item);
    } else {
      // Keep the row with the later sortDate; fall back to keeping the new one if dates are absent
      const existingDate = existing.sortDate ?? "";
      const newDate = item.sortDate ?? "";
      if (newDate >= existingDate) {
        deduped.set(key, item);
      }
    }
  }

  return Array.from(deduped.values());
}
