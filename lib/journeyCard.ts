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

// ── Chapter blocks (Slice 6) ──────────────────────────────────────────────────
// The Field Kit Composer builds a card as chapters + daily-page inserts. The
// published row stays flat for today's renderer (the flatten step below), but
// the full structure ALSO lands in the `chaptersJson` column so the next phase
// can render real chapter pages / ghost placeholders without anyone
// re-publishing. Locked with Jesse 2026-07-02 (slice-6 spec §4-R Q1).

export type JourneyCardChapterKind = "chapter" | "daily";

export type JourneyCardChapter = {
  /** Itinerary chapter id (live) or a retro/custom id — join key to the spine. */
  chapterId: string;
  kind: JourneyCardChapterKind;
  /** Chapter number label ("01") — display only. */
  num?: string;
  title: string;
  location?: string;
  dateLabel?: string;
  /** The single poetic response line — headlines the chapter. */
  response?: string;
  /** The longer prompt response — the chapter's body text. */
  body?: string;
  /** PUBLIC photo URLs (already promoted out of the private capture store). */
  photoUrls?: string[];
  /** PUBLIC audio URL, if any. */
  audioUrl?: string;
  accent?: string;
  /** "empty" chapters are the ghost-placeholder slots; kept so the published
   *  card can one day show "the passport has the slot, the page is blank". */
  status: "written" | "empty";
};

// Sheets cells cap at 50k chars; stay well under it and bound the array so a
// hostile payload can't bloat the tab. MAX_SHEET_CELL_CHARS guards every flat
// cell on the write path (body, mediaUrls, …) — an over-limit cell makes the
// whole Sheets append fail, permanently, on every retry.
export const MAX_CHAPTERS_JSON_CHARS = 40_000;
export const MAX_CHAPTER_BLOCKS = 40;
export const MAX_SHEET_CELL_CHARS = 45_000;

const CHAPTER_KINDS = new Set<JourneyCardChapterKind>(["chapter", "daily"]);

/**
 * Parse a `chaptersJson` cell into chapter blocks. Tolerant by design: any
 * garbage (old rows, hand-edited cells, oversized payloads) → []. Every field
 * is re-coerced so the result is safe to render without further checks.
 */
export function parseChaptersJson(raw: string | undefined | null): JourneyCardChapter[] {
  const s = String(raw ?? "").trim();
  if (!s || s.length > MAX_CHAPTERS_JSON_CHARS) return [];
  let data: unknown;
  try {
    data = JSON.parse(s);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];
  const out: JourneyCardChapter[] = [];
  for (const item of data.slice(0, MAX_CHAPTER_BLOCKS)) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const str = (v: unknown) => String(v ?? "").trim();
    const kind = CHAPTER_KINDS.has(str(o.kind) as JourneyCardChapterKind)
      ? (str(o.kind) as JourneyCardChapterKind)
      : "chapter";
    const photoUrls = Array.isArray(o.photoUrls)
      ? o.photoUrls.map(str).filter(Boolean).slice(0, 12)
      : [];
    out.push({
      chapterId: str(o.chapterId),
      kind,
      num: str(o.num) || undefined,
      title: str(o.title),
      location: str(o.location) || undefined,
      dateLabel: str(o.dateLabel) || undefined,
      response: str(o.response) || undefined,
      body: str(o.body) || undefined,
      photoUrls: photoUrls.length ? photoUrls : undefined,
      audioUrl: str(o.audioUrl) || undefined,
      accent: str(o.accent) || undefined,
      status: str(o.status) === "empty" ? "empty" : "written",
    });
  }
  return out;
}

/**
 * Serialize chapter blocks for the `chaptersJson` cell — the write-side mirror
 * of parseChaptersJson (parse → re-serialize), so whatever lands in the sheet
 * is guaranteed already-sanitized and within bounds. Returns "" for nothing.
 */
export function serializeChaptersJson(chapters: JourneyCardChapter[]): string {
  if (!chapters.length) return "";
  const clean = parseChaptersJson(JSON.stringify(chapters));
  if (!clean.length) return "";
  const s = JSON.stringify(clean);
  return s.length > MAX_CHAPTERS_JSON_CHARS ? "" : s;
}

/**
 * The Q1 flatten step: chapter blocks → today's flat card fields. The current
 * public renderer splits `body` on blank lines into paragraphs, so each written
 * chapter contributes a heading line and its text as plain paragraphs; daily
 * pages read as postcard one-liners. Empty (ghost) chapters are skipped here —
 * they live only in chaptersJson until the public renderer learns placeholders.
 * pullQuote and heroUrl are the artist's explicit picks in the Publish flow,
 * NOT derived here.
 */
export function flattenChaptersToBody(chapters: JourneyCardChapter[]): string {
  const parts: string[] = [];
  for (const ch of chapters) {
    if (ch.status === "empty") continue;
    const heading = [ch.title, ch.location].filter(Boolean).join(" — ");
    if (ch.kind === "daily") {
      const line = ch.response || ch.body || "";
      if (!line) continue;
      parts.push([`◈ ${heading || "Daily page"}`, line].join("\n\n"));
      continue;
    }
    const block = [heading, ch.response, ch.body].filter(Boolean).join("\n\n");
    if (block) parts.push(block);
  }
  return parts.join("\n\n");
}

/** Union of every written chapter's public photo URLs, in card order, deduped. */
export function flattenChaptersToMediaUrls(chapters: JourneyCardChapter[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ch of chapters) {
    if (ch.status === "empty") continue;
    for (const url of ch.photoUrls ?? []) {
      if (seen.has(url)) continue;
      seen.add(url);
      out.push(url);
    }
  }
  return out;
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
  // ── Structured chapters (Slice 6; appended column W so A:V rows read fine) ──
  /** JSON array of JourneyCardChapter blocks; "" for flat/manual/legacy cards. */
  chaptersJson: string;
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
  /** Structured chapter blocks ([] for flat/manual/legacy cards). */
  chapters: JourneyCardChapter[];
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
    chapters: parseChaptersJson(row.chaptersJson),
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
