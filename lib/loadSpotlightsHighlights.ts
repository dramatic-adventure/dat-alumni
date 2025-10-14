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

  return mapped;
}
