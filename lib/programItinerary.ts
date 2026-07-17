// lib/programItinerary.ts
//
// Field Kit — the program/itinerary spine. This is its OWN store (Program +
// Itinerary Chapters + Itinerary Days + Time Anchors tabs in ALUMNI_SHEET_ID),
// separate from the "Journey Cards" tab. It is the single source of truth for
// program-level facts (chapters, days, locations, dates, drama clubs, partner
// orgs); capture, cohort cross-links, and published Journey Cards all bind to
// this spine.
//
// This module is intentionally PURE (no "server-only", no Google clients) so it
// can be imported by client components. All Sheets/CSV I/O lives in
// lib/loadProgram.ts — mirroring the lib/journeyCard.ts ↔ lib/loadJourneyCards.ts
// split. Field semantics are copied from the V17 mockup's sampleProgram.ts.

import type { ProgramRecord } from "@/lib/journeyCard";

// ── Raw sheet rows (header-keyed; first-class columns, no tags blob) ───────────

export type ProgramRow = {
  programId: string;
  program: string; // brand casing: "PASSAGE", "ACTion"
  location: string; // "Slovakia"
  country: string; // "Slovakia" (or "Czechia & Slovakia")
  year: string; // "2026"
  label: string; // "PASSAGE: Slovakia 2026" (optional; derived if blank)
  dates: string; // "July 12 – August 2, 2026"
  essence: string; // one-line program spirit
  todayDayId: string; // manual override fallback for "today"
  link: string; // optional public link
};

export type ChapterRow = {
  id: string;
  programId: string;
  num: string; // chapter number (string from sheet)
  verb: string;
  place: string;
  title: string;
  description: string;
  goal: string;
  tips: string;
  accent: string; // "pink"|"teal"|"yellow"|"grape"|"purple"
  prompt: string;
  dramaClub: string; // slug → lib/dramaClubMap.ts
  partnerOrg: string; // slug (net-new partner store; slug only for now)
  dayIds: string; // optional ordered list "d01|d02"; else derived from days
  status: string; // "complete"|"draft"|"empty" (default empty in Slice 1)
  // Lodging (Slice 7) — where the company sleeps this chapter. First-class
  // columns on the Chapters tab (1:1 with chapter); all optional.
  lodgingName: string;
  lodgingAddress: string;
  lodgingPhone: string;
  lodgingEmail: string;
  lodgingWebsite: string;
  lodgingExpect: string; // the "Expect:" blurb from the trip document
};

export type ItineraryDayRow = {
  id: string;
  programId: string;
  chapterId: string;
  dayNum: string;
  dateLabel: string; // "Day 5 · Mon"
  fullDate: string; // ISO "2026-07-16" — drives date-derived "today"
  location: string;
  title: string;
  what: string;
  spirit: string;
  cohortNote: string;
  dramaClub: string; // slug
  partnerOrg: string; // slug
  prep: string; // delimited list (newline or "|")
};

export type TimeAnchorRow = {
  dayId: string;
  programId: string; // scopes the anchor to its program (guards reused dayIds)
  order: string; // sort within the day
  time: string;
  label: string;
  bold: string; // boolean-ish cell
  note: string;
  marker: string;
};

// ── Display types (nested, render-ready) ──────────────────────────────────────

export type ItineraryAccent = "pink" | "teal" | "yellow" | "grape" | "purple";

export type ChapterStatus = "complete" | "draft" | "empty";

export type TimeAnchor = {
  time: string;
  label: string;
  bold: boolean;
  note: string;
  marker: boolean; // true → rendered with the » prefix (per the mockup)
};

export type ItineraryDay = {
  id: string;
  chapterId: string;
  dayNum: number;
  dateLabel: string;
  fullDate: string;
  location: string;
  title: string;
  what: string;
  spirit: string;
  cohortNote: string;
  dramaClub?: string;
  partnerOrg?: string;
  prep: string[];
  times: TimeAnchor[];
};

/** A chapter's lodging block — present only when the sheet names a place. */
export type Lodging = {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  expect: string;
};

export type Chapter = {
  id: string;
  num: number;
  verb: string;
  place: string;
  title: string;
  description: string;
  goal: string;
  tips: string;
  accent: ItineraryAccent;
  prompt: string;
  dramaClub?: string;
  partnerOrg?: string;
  status: ChapterStatus;
  lodging?: Lodging; // present only when lodgingName is set
  days: ItineraryDay[];
};

// Slice 3 (Notifications) — the CURRENT rally point for a program. Carried on the
// itinerary payload so it precaches offline with the itinerary and (being part of
// the object hashItinerary digests) propagates to open clients via LiveRefresh.
export type RallyPoint = {
  location: string;
  lookFor: string; // the "look for" cue (a landmark / sign / person)
  meetTime: string;
  departure: string;
  updatedAt: string; // ISO — when staff last set it
};

// ── Slice 5 (Field Ops & Library) — payload-carried ops state ─────────────────
// Like RallyPoint, these ride the itinerary payload so they precache offline and
// propagate via LiveRefresh. They carry SHARED, artist-safe state only: per-user
// state (this device's own response/vote) is server-derived per request, and
// live tallies/headcounts are leader-gated reads that never enter this payload.

export type RollCallStatus = "here" | "needs-help";

export type RollCallState = {
  id: string;
  dayId: string;
  label: string; // "Bus to Košice — 3:45pm"
  openedAt: string; // ISO
  closedAt: string; // ISO, or "" while the roll call is open
};

export type CompanyChoiceVisibility = "private" | "public" | "result-only";

export type CompanyChoiceState = {
  id: string;
  question: string;
  choices: string[];
  deadline: string; // freeform staff text ("tonight 8pm")
  resultsVisibility: CompanyChoiceVisibility;
  postedAt: string; // ISO
  closedAt: string; // ISO, or "" while voting is open
  /** Announced result — present only once closed and visibility isn't private. */
  outcome?: string;
  /** Full per-choice tallies — present only once closed and visibility is public. */
  results?: { choice: string; votes: number }[];
};

// ── Slice 7 (Contacts) — payload-carried emergency & contact card ─────────────
// Rides the itinerary payload (like resources) so it precaches offline — the
// moment you need the emergency card is exactly when you may have no signal.
// Roster-gated payload only; never enters any public surface.

export type FieldContactSection =
  | "emergency"
  | "ground-control"
  | "staff"
  | "artists"
  | "whatsapp"
  | "other";

export type FieldContact = {
  id: string;
  section: FieldContactSection;
  label: string; // person or entry name ("Jesse Baxter", "General Emergency")
  role: string; // "Artistic Director", "All-company group"
  phone: string; // rendered tap-to-call (tel:)
  email: string; // rendered mailto:
  link: string; // external URL (e.g. chat.whatsapp.com invite)
  note: string; // small print under the row
};

export type FieldResourceType = "text" | "audio" | "image" | "link";

export type FieldResource = {
  id: string;
  dayId?: string; // surfaces the resource under "Relevant today" on that day
  title: string;
  type: FieldResourceType;
  url: string;
  tags: string[];
};

export type ProgramItinerary = {
  programId: string;
  program: string;
  location: string;
  country: string;
  year: string;
  label: string;
  dates: string;
  essence: string;
  todayDayId?: string;
  link?: string;
  chapters: Chapter[];
  rallyPoint?: RallyPoint; // present only when staff have set one
  rollCall?: RollCallState; // present only when a roll call exists (Slice 5)
  companyChoice?: CompanyChoiceState; // present only when a question exists (Slice 5)
  resources?: FieldResource[]; // present only when the program has library rows (Slice 5)
  contacts?: FieldContact[]; // present only when the program has contact rows (Slice 7)
};

// ── normalization helpers ──────────────────────────────────────────────────────

const ACCENTS: ItineraryAccent[] = ["pink", "teal", "yellow", "grape", "purple"];
function normalizeAccent(a: string | undefined | null): ItineraryAccent {
  const n = String(a ?? "").trim().toLowerCase();
  return (ACCENTS as string[]).includes(n) ? (n as ItineraryAccent) : "teal";
}

function normalizeStatus(s: string | undefined | null): ChapterStatus {
  const n = String(s ?? "").trim().toLowerCase();
  return n === "complete" || n === "draft" ? n : "empty";
}

function coerceBool(v: unknown): boolean {
  return ["1", "true", "yes", "y"].includes(String(v ?? "").trim().toLowerCase());
}

/** Split a multi-value cell on newlines or pipes; trims + drops blanks. */
function splitList(raw: string | undefined | null): string[] {
  return String(raw ?? "")
    .split(/[\n|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function toNum(v: unknown, fallback = 0): number {
  const n = Number(String(v ?? "").trim());
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Normalize a Time Anchor `time` cell to the compact display style ("9:00am").
 *
 * Google Sheets stores time-typed cells as a serial fraction of a day, and
 * lib/loadProgram.ts reads UNFORMATTED_VALUE, so those arrive here as raw numbers
 * — e.g. "0.375" (→ 9:00am) or "0.625" (→ 3:00pm). This converts them. Values
 * that are already human ("—", "Afternoon", "9:30am") pass through, and a
 * formatted "9:00:00 AM" (e.g. from the CSV fallback) is tidied to "9:00am".
 */
function clockFromMinutes(totalMinutes: number): string {
  const mins = ((Math.round(totalMinutes) % 1440) + 1440) % 1440;
  const h24 = Math.floor(mins / 60);
  const m = mins % 60;
  const period = h24 < 12 ? "am" : "pm";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")}${period}`;
}

/**
 * Normalize an itinerary day's `fullDate` cell to ISO `yyyy-mm-dd`.
 *
 * This is what drives "today" resolution (resolveToday) and the Home countdown,
 * both of which require ISO dates. lib/loadProgram.ts reads UNFORMATTED_VALUE, so
 * a date-typed cell arrives here as a Google Sheets serial number (e.g. "46214" =
 * 2026-07-11) rather than text. We convert serials, pass through real ISO dates,
 * and best-effort parse common human formats ("July 11, 2026", "2026/07/12").
 * Anything unparseable becomes "" (the day is then ignored by date logic).
 */
export function toIsoDate(raw: string | undefined | null): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  const pad = (n: number) => String(n).padStart(2, "0");

  // Already ISO (optionally with a time suffix) → keep the date part.
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;

  // Google Sheets serial date: whole days since 1899-12-30 (UTC to avoid TZ drift).
  if (/^\d+(\.\d+)?$/.test(s)) {
    const serial = Math.floor(Number(s));
    if (Number.isFinite(serial) && serial > 0) {
      const d = new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000);
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    }
  }

  // Fallback: let Date parse human formats; read back local Y/M/D.
  const t = new Date(s);
  if (!Number.isNaN(t.getTime())) {
    return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
  }
  return "";
}

/**
 * Normalize an itinerary day's `dateLabel` cell to a human label ("Thu 7/16").
 *
 * Like `fullDate` and `time`, a dateLabel cell that Google Sheets has parsed as
 * a DATE arrives here (via UNFORMATTED_VALUE) as a raw serial number — which
 * then renders as "Day 5 · 46219". Convert serials to "Ddd M/D"; any real text
 * ("Thu 7/16", "Travel Day") passes through untouched.
 */
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export function formatDateLabelCell(raw: string | undefined | null): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";
  if (/^\d+(\.\d+)?$/.test(s)) {
    const serial = Math.floor(Number(s));
    if (Number.isFinite(serial) && serial > 0) {
      const d = new Date(Date.UTC(1899, 11, 30) + serial * 86_400_000);
      return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
    }
  }
  return s;
}

export function formatTimeCell(raw: string | undefined | null): string {
  const s = String(raw ?? "").trim();
  if (!s) return "";

  // Sheets serial: a decimal fraction of a day (0.375 = 9:00am). For datetime
  // serials (>= 1) only the fractional time-of-day part is used.
  if (/^-?\d+\.\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n)) {
      const frac = ((n % 1) + 1) % 1;
      return clockFromMinutes(frac * 24 * 60);
    }
  }
  // Bare integer the staff typed as an hour ("9" → 9:00am); 0–23 only.
  if (/^\d{1,2}$/.test(s)) {
    const h = Number(s);
    if (h >= 0 && h <= 23) return clockFromMinutes(h * 60);
  }
  // Formatted clock string ("9:00:00 AM", "14:30") → compact lowercase.
  const m = s.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/);
  if (m) {
    const h = Number(m[1]);
    const min = m[2];
    const ap = m[3]?.toLowerCase();
    if (ap) return `${h % 12 === 0 ? 12 : h % 12}:${min}${ap}`;
    return clockFromMinutes(h * 60 + Number(min)); // 24-hour input
  }
  return s; // "—", "Afternoon", "TBD", etc.
}

// ── mapping: raw rows → nested ProgramItinerary ────────────────────────────────

export function rowsToProgramItinerary(input: {
  program: ProgramRow;
  chapters: ChapterRow[];
  days: ItineraryDayRow[];
  times: TimeAnchorRow[];
}): ProgramItinerary {
  const { program, chapters, days, times } = input;

  // Group time anchors by dayId, ordered by their `order` column.
  const timesByDay = new Map<string, TimeAnchor[]>();
  for (const t of [...times].sort((a, b) => toNum(a.order) - toNum(b.order))) {
    const key = String(t.dayId ?? "").trim();
    if (!key) continue;
    const list = timesByDay.get(key) ?? [];
    list.push({
      time: formatTimeCell(t.time),
      label: t.label ?? "",
      bold: coerceBool(t.bold),
      note: t.note ?? "",
      marker: coerceBool(t.marker),
    });
    timesByDay.set(key, list);
  }

  // Build days, grouped by chapterId, ordered by dayNum.
  const daysByChapter = new Map<string, ItineraryDay[]>();
  for (const d of days) {
    const day: ItineraryDay = {
      id: d.id,
      chapterId: d.chapterId,
      dayNum: toNum(d.dayNum),
      dateLabel: formatDateLabelCell(d.dateLabel),
      fullDate: toIsoDate(d.fullDate),
      location: d.location ?? "",
      title: d.title ?? "",
      what: d.what ?? "",
      spirit: d.spirit ?? "",
      cohortNote: d.cohortNote ?? "",
      dramaClub: d.dramaClub?.trim() || undefined,
      partnerOrg: d.partnerOrg?.trim() || undefined,
      prep: splitList(d.prep),
      times: timesByDay.get(String(d.id ?? "").trim()) ?? [],
    };
    const list = daysByChapter.get(day.chapterId) ?? [];
    list.push(day);
    daysByChapter.set(day.chapterId, list);
  }
  for (const list of daysByChapter.values()) list.sort((a, b) => a.dayNum - b.dayNum);

  // Build chapters ordered by num.
  const builtChapters: Chapter[] = [...chapters]
    .sort((a, b) => toNum(a.num) - toNum(b.num))
    .map((c) => ({
      id: c.id,
      num: toNum(c.num),
      verb: c.verb ?? "",
      place: c.place ?? "",
      title: c.title ?? "",
      description: c.description ?? "",
      goal: c.goal ?? "",
      tips: c.tips ?? "",
      accent: normalizeAccent(c.accent),
      prompt: c.prompt ?? "",
      dramaClub: c.dramaClub?.trim() || undefined,
      partnerOrg: c.partnerOrg?.trim() || undefined,
      status: normalizeStatus(c.status),
      lodging: lodgingFromRow(c),
      days: orderedDaysForChapter(c, daysByChapter),
    }));

  const label =
    String(program.label ?? "").trim() ||
    [program.program, [program.location, program.year].filter(Boolean).join(" ")]
      .filter(Boolean)
      .join(": ");

  return {
    programId: program.programId,
    program: program.program,
    location: program.location,
    country: (program.country || program.location || "").trim(),
    year: String(program.year ?? "").trim(),
    label,
    dates: program.dates ?? "",
    essence: program.essence ?? "",
    todayDayId: program.todayDayId?.trim() || undefined,
    link: program.link?.trim() || undefined,
    chapters: builtChapters,
  };
}

/**
 * A chapter's lodging block, or undefined when the row names no place. Keyed on
 * lodgingName so a stray phone/address cell alone never renders an empty shell.
 * (An undefined key is dropped by JSON.stringify, so pre-lodging itineraries
 * hash identically — no spurious LiveRefresh.)
 */
function lodgingFromRow(c: ChapterRow): Lodging | undefined {
  const name = String(c.lodgingName ?? "").trim();
  if (!name) return undefined;
  return {
    name,
    address: String(c.lodgingAddress ?? "").trim(),
    phone: String(c.lodgingPhone ?? "").trim(),
    email: String(c.lodgingEmail ?? "").trim(),
    website: String(c.lodgingWebsite ?? "").trim(),
    expect: String(c.lodgingExpect ?? "").trim(),
  };
}

/**
 * A chapter's days, ordered. If the Chapter row lists `dayIds` explicitly that
 * order wins; any membership days not listed are appended in dayNum order. With
 * no `dayIds`, membership (Day.chapterId) ordered by dayNum is used — so staff
 * need only set Day.chapterId, not maintain dayIds on both sides.
 */
function orderedDaysForChapter(
  c: ChapterRow,
  daysByChapter: Map<string, ItineraryDay[]>
): ItineraryDay[] {
  const membership = daysByChapter.get(c.id) ?? [];
  const explicit = splitList(c.dayIds);
  if (!explicit.length) return membership;
  const byId = new Map(membership.map((d) => [d.id, d]));
  const ordered = explicit.map((id) => byId.get(id)).filter(Boolean) as ItineraryDay[];
  const listed = new Set(ordered.map((d) => d.id));
  const extra = membership.filter((d) => !listed.has(d.id));
  return [...ordered, ...extra];
}

// ── selectors (mirror the mockup helpers) ─────────────────────────────────────

export function chapterById(it: ProgramItinerary, id: string): Chapter | undefined {
  return it.chapters.find((c) => c.id === id);
}

export function dayById(it: ProgramItinerary, id: string): ItineraryDay | undefined {
  for (const c of it.chapters) {
    const d = c.days.find((day) => day.id === id);
    if (d) return d;
  }
  return undefined;
}

export function chapterForDay(it: ProgramItinerary, dayId: string): Chapter | undefined {
  return it.chapters.find((c) => c.days.some((d) => d.id === dayId));
}

export function allDays(it: ProgramItinerary): ItineraryDay[] {
  return it.chapters.flatMap((c) => c.days);
}

// ── "today" resolution (date-derived, with before/after fallbacks) ────────────

export type TodayState = "before" | "during" | "after" | "unknown";

export type ResolvedToday = {
  state: TodayState;
  todayDayId?: string;
};

/** Local yyyy-mm-dd for a Date (simple; program-timezone refinement is later). */
function isoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Resolve "today" against the itinerary's day dates. An exact `fullDate` match
 * wins; otherwise before the first day / after the last day. PROGRAM.todayDayId
 * is a manual override used when no day carries a parseable fullDate yet.
 */
export function resolveToday(it: ProgramItinerary, now: Date = new Date()): ResolvedToday {
  const days = allDays(it).filter((d) => d.fullDate);
  if (!days.length) {
    return it.todayDayId ? { state: "during", todayDayId: it.todayDayId } : { state: "unknown" };
  }
  const sorted = [...days].sort((a, b) => a.fullDate.localeCompare(b.fullDate));
  const today = isoDate(now);
  const exact = sorted.find((d) => d.fullDate === today);
  if (exact) return { state: "during", todayDayId: exact.id };
  if (today < sorted[0].fullDate) return { state: "before", todayDayId: it.todayDayId };
  if (today > sorted[sorted.length - 1].fullDate)
    return { state: "after", todayDayId: it.todayDayId };
  // mid-trip gap day: treat as during, anchor to the most recent past day
  const past = [...sorted].reverse().find((d) => d.fullDate <= today);
  return { state: "during", todayDayId: past?.id ?? it.todayDayId };
}

// ── change detection: a cheap, stable digest of the itinerary ─────────────────

/**
 * A cheap, deterministic digest of an itinerary, used purely for change
 * detection (Field Kit live-refresh). It is NOT a security hash — just a stable
 * fingerprint so a client can tell "did the published itinerary change?".
 *
 * Pure (no crypto/deps) so it can run on the server (the API route + the page
 * both compute it over the SAME ProgramItinerary, so a steady state produces an
 * identical hash and never triggers a spurious refresh). rowsToProgramItinerary
 * builds the object with a fixed key order and deterministically sorted arrays,
 * so plain JSON.stringify is stable across requests. Folds the serialized length
 * in alongside a djb2 rolling hash to keep collisions vanishingly unlikely.
 */
export function hashItinerary(it: ProgramItinerary): string {
  const json = JSON.stringify(it);
  let h = 5381;
  for (let i = 0; i < json.length; i++) {
    h = (((h << 5) + h) ^ json.charCodeAt(i)) | 0; // h * 33 ^ c
  }
  return `${(h >>> 0).toString(36)}-${json.length.toString(36)}`;
}

// ── handoff: itinerary → ProgramRecord (activates mergeProgramIntoCard) ────────

/**
 * Produce the small ProgramRecord that lib/journeyCard.ts#mergeProgramIntoCard
 * consumes, so published Journey Cards keyed by this programId resolve their
 * program facts LIVE from the itinerary. (Wiring the merge into the journey-card
 * render is a separate, later step — this only exposes the shape.)
 */
export function toProgramRecord(it: ProgramItinerary): ProgramRecord {
  return {
    id: it.programId,
    program: it.program,
    location: it.location,
    year: it.year,
    dates: it.dates || undefined,
  };
}
