// lib/journeyCard.ts
//
// Journey Card V1 — shared, client-safe logic for the participant-authored,
// post-program record that attaches to an alumni profile.
//
// A Journey Card is its OWN entity — NOT a spotlight or a highlight. It lives
// in its own dedicated "Journey Cards" Google Sheet tab with first-class
// columns (see lib/loadJourneyCards.ts), has its own loader, its own
// /api/alumni/journey route, and its own soft-delete via the `status` column.
//
// DESIGN DECISIONS (locked with Jesse, June 2026):
//   • Artists self-publish. DAT does NOT pre-approve a card's contents.
//   • Every card carries DAT_DISCLAIMER: it is the individual artist's
//     reflection and not necessarily the view of DAT.
//   • DAT retains a takedown capability (sets status="removed" + removalReason
//     on the card's own row) and notifies the artist with the reason.
//   • Projects are labeled "Program: Location Year"
//       e.g. "ACTion: Ecuador 2010", "PASSAGE: Slovakia 2026",
//            "Teaching Artist Residency: Slovakia 2017".
//     Program names keep literal brand casing ("ACTion", never "ACTION").
//   • The itinerary/program record is the single source of truth for program
//     facts. Program-level fields resolve LIVE via mergeProgramIntoCard() keyed
//     by programId, so editing the itinerary propagates to every card without
//     re-saving cards. Until the Companion phase ships that store, the card
//     row's own snapshot is used.
//
// This module is intentionally pure (no "server-only", no Google clients) so it
// can be imported by client components. All Sheets I/O lives in
// lib/loadJourneyCards.ts.

/** Public-facing attribution shown on every Journey Card. */
export const DAT_DISCLAIMER =
  "An individual artist's reflection — not necessarily the views of Dramatic Adventure Theatre.";

// ── Project label: "Program: Location Year" ───────────────────────────────────

export type ProgramParts = {
  program: string; // e.g. "PASSAGE", "ACTion", "Teaching Artist Residency"
  location: string; // e.g. "Slovakia", "Ecuador"
  year: string | number; // e.g. 2026
};

/** Build the canonical label, e.g. { program:"PASSAGE", location:"Slovakia", year:2026 } → "PASSAGE: Slovakia 2026". */
export function formatProgramLabel(parts: ProgramParts): string {
  const program = String(parts.program ?? "").trim();
  const location = String(parts.location ?? "").trim();
  const year = String(parts.year ?? "").trim();
  const tail = [location, year].filter(Boolean).join(" ");
  if (program && tail) return `${program}: ${tail}`;
  return program || tail;
}

/**
 * Best-effort parse of a "Program: Location Year" label back into parts, for
 * filtering the archive index by program / country / year. Tolerant of labels
 * that omit a year or location.
 */
export function parseProgramLabel(label: string): ProgramParts {
  const raw = String(label ?? "").trim();
  const [programRaw, restRaw] = raw.includes(":")
    ? [raw.slice(0, raw.indexOf(":")), raw.slice(raw.indexOf(":") + 1)]
    : ["", raw];
  const rest = restRaw.trim();
  const yearMatch = rest.match(/\b(\d{4})\b\s*$/);
  const year = yearMatch ? yearMatch[1] : "";
  const location = (year ? rest.slice(0, yearMatch!.index).trim() : rest).trim();
  return { program: programRaw.trim(), location, year };
}

// ── The dedicated "Journey Cards" sheet row ───────────────────────────────────
// First-class columns — NOT a tags blob. The column order here is the canonical
// header order for the "Journey Cards" tab and is mirrored by HEADERS in
// lib/loadJourneyCards.ts. `featured` is the only non-string field (coerced from
// the sheet's "true"/"false" cell).
export type JourneyCardRow = {
  /** Stable per-card id — the takedown/restore target (last-row-wins by id). */
  id: string;
  /** The alumni profile slug this card belongs to (display + grouping). */
  profileSlug: string;
  /** Reference to the program/itinerary record so facts can resolve live. */
  programId: string;
  // ── Program scaffold (snapshot; superseded live by mergeProgramIntoCard) ──
  program: string;
  location: string;
  country: string;
  year: string;
  // ── Artist-authored content ──
  title: string;
  primaryRole: string;
  pullQuote: string;
  heroUrl: string;
  accent: string; // "pink" | "teal" | "yellow" | "grape"
  dates: string;
  body: string;
  mediaUrls: string; // comma/newline-separated
  ctaText: string;
  ctaUrl: string;
  // ── State / meta ──
  featured: boolean;
  sortDate: string;
  status: string; // "live" | "removed"
  removalReason: string;
  createdAt: string;
};

/**
 * The shared program/itinerary record a Journey Card hangs off of. This is the
 * single source of truth for program scaffolding; editing it updates every card
 * that references it via programId. In a later phase this is a row in the
 * itinerary store; the shape is intentionally small for V1.
 */
export type ProgramRecord = {
  id: string;
  program: string; // "PASSAGE"
  location: string; // "Slovakia"
  year: string | number; // 2026
  dates?: string; // "July 12 – August 2, 2026"
  partners?: { name: string; location?: string; url?: string }[];
};

// ── Display type ──────────────────────────────────────────────────────────────

export type JourneyAccent = "pink" | "teal" | "yellow" | "grape";

const ACCENTS: JourneyAccent[] = ["pink", "teal", "yellow", "grape"];

function normalizeAccent(a: string | undefined | null): JourneyAccent {
  const n = String(a ?? "").trim().toLowerCase();
  return (ACCENTS as string[]).includes(n) ? (n as JourneyAccent) : "teal";
}

/**
 * The enriched, render-ready Journey Card the UI consumes. Self-contained: it
 * carries everything the V14-style cover, the adaptive index, the archive, and
 * the card view need, so cards stand alone with no surrounding caption text.
 */
export type JourneyCard = {
  id: string;
  profileSlug: string;
  programId?: string;
  // Program scaffold
  program: string;
  location: string;
  country: string;
  year: string;
  // Authored content
  title: string;
  primaryRole: string;
  pullQuote: string;
  heroUrl: string;
  accent: JourneyAccent;
  dates: string;
  body: string;
  mediaUrls: string[];
  ctaText?: string;
  ctaUrl?: string;
  // State / meta
  featured: boolean;
  sortDate?: string;
  status: "live" | "removed";
  removalReason?: string;
  createdAt?: string;
  // Derived
  /** Canonical "Program: Location Year". */
  programLabel: string;
  /** Convenience: true when status === "removed". */
  removed: boolean;
  /** Route to this card's standalone view. */
  href: string;
};

function splitMedia(raw: string | undefined | null): string[] {
  return String(raw ?? "")
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Map a "Journey Cards" sheet row to the render-ready display card. */
export function journeyCardRowToCard(row: JourneyCardRow): JourneyCard {
  const status: JourneyCard["status"] =
    String(row.status ?? "").trim().toLowerCase() === "removed" ? "removed" : "live";
  const country = (row.country || row.location || "").trim();
  return {
    id: row.id,
    profileSlug: row.profileSlug,
    programId: row.programId || undefined,
    program: row.program,
    location: row.location,
    country,
    year: String(row.year ?? "").trim(),
    title: row.title,
    primaryRole: row.primaryRole,
    pullQuote: row.pullQuote,
    heroUrl: row.heroUrl,
    accent: normalizeAccent(row.accent),
    dates: row.dates,
    body: row.body,
    mediaUrls: splitMedia(row.mediaUrls),
    ctaText: row.ctaText || undefined,
    ctaUrl: row.ctaUrl || undefined,
    featured: Boolean(row.featured),
    sortDate: row.sortDate || row.createdAt || undefined,
    status,
    removalReason: row.removalReason || undefined,
    createdAt: row.createdAt || undefined,
    programLabel: formatProgramLabel({
      program: row.program,
      location: country,
      year: row.year,
    }),
    removed: status === "removed",
    href: `/journeys/${row.profileSlug}/${row.id}`,
  };
}

/**
 * Overlay live program/itinerary facts onto a card. Call this at render time
 * with the ProgramRecord referenced by card.programId. Anything the program
 * defines (label, location, country, year, dates) wins over the snapshot stored
 * on the card row — so an itinerary edit (partner swap, location change)
 * propagates to the published Journey Card without re-saving the card. The
 * artist's authored fields (title, body, media, quote) are never touched.
 */
export function mergeProgramIntoCard(card: JourneyCard, program?: ProgramRecord): JourneyCard {
  if (!program) return card;
  const country = card.country || program.location;
  return {
    ...card,
    program: program.program,
    location: program.location,
    country,
    year: String(program.year ?? card.year ?? ""),
    dates: program.dates ?? card.dates,
    programLabel: formatProgramLabel({
      program: program.program,
      location: program.location,
      year: program.year,
    }),
  };
}

/**
 * Rewrite a card's profileSlug + href to the CURRENT canonical slug. Cards store
 * the slug they were published under; if the artist later changes their slug, the
 * row still matches via alias lookups, but its href/grouping should reflect the
 * new slug. Call this at render time with the resolved canonical slug so every
 * link and grouping key stays dynamic.
 */
export function withCanonicalSlug(card: JourneyCard, slug: string): JourneyCard {
  const s = String(slug ?? "").trim();
  if (!s || s === card.profileSlug) return card;
  return { ...card, profileSlug: s, href: `/journeys/${s}/${card.id}` };
}

// ── Archive grouping helpers ──────────────────────────────────────────────────

/**
 * The countries a card belongs to for the "by country" facet. A project that
 * crossed borders stores its country as a combined "Czechia & Slovakia" label;
 * we split on "&" so it can also roll under each established single country.
 */
export function countriesOf(card: JourneyCard): string[] {
  const raw = (card.country || "").trim();
  if (raw.includes("&")) {
    return raw
      .split("&")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return raw ? [raw] : [];
}

// ── Layout selector for the per-profile display ───────────────────────────────
//   ≤3 cards → Editorial Index (Option A)
//   ≥4 cards → Inline Rail (Option B)
// The Passport Stack (Option C) is offered as a swipeable treatment separately.
export type ProfileJourneyLayout = "editorial" | "rail";
export function pickProfileLayout(count: number): ProfileJourneyLayout {
  return count <= 3 ? "editorial" : "rail";
}
