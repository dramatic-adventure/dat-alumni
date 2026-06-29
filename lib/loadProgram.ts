// lib/loadProgram.ts
//
// Dedicated data layer for the Field Kit program/itinerary spine — its OWN
// store, separate from "Journey Cards" and "Spotlights & Highlights". Reads the
// Program / Itinerary Chapters / Itinerary Days / Time Anchors tabs in the
// alumni spreadsheet (ALUMNI_SHEET_ID).
//
// Read pattern mirrors lib/loadJourneyCards.ts (sheetsClient + header-keyed
// parsing). Resilience mirrors the project caching strategy: React cache() for
// request memoization, plus a CSV/Netlify-Blobs fallback via lib/loadCsv.ts and
// per-tab gids in lib/csvUrls.ts — so the field document survives a Sheets cold
// start / rate-limit and can be precached for offline use.
//
// Reads are resilient: a missing tab (e.g. before it's created) yields an empty
// result rather than throwing, so callers render an empty state instead of 500.

import "server-only";
import { cache } from "react";
import { parse } from "csv-parse/sync";
import { sheetsClient } from "@/lib/googleClients";
import { loadCsv } from "@/lib/loadCsv";
import { csvUrls } from "@/lib/csvUrls";
import {
  rowsToProgramItinerary,
  type ProgramRow,
  type ChapterRow,
  type ItineraryDayRow,
  type TimeAnchorRow,
  type ProgramItinerary,
} from "@/lib/programItinerary";

const SHEET_ID = process.env.ALUMNI_SHEET_ID || "";

// Canonical tab names. Keep in lockstep with field-kit-ITINERARY-SCHEMA.md.
const TABS = {
  program: "Field Kit Program",
  chapters: "Field Kit Itinerary Chapters",
  days: "Field Kit Itinerary Days",
  times: "Field Kit Time Anchors",
} as const;

// Canonical column orders — used as the header fallback when the sheet's own
// header row is blank/short. Header-keyed parsing otherwise tolerates reordering.
const PROGRAM_HEADERS: (keyof ProgramRow)[] = [
  "programId", "program", "location", "country", "year",
  "label", "dates", "essence", "todayDayId", "link",
];
const CHAPTER_HEADERS: (keyof ChapterRow)[] = [
  "id", "programId", "num", "verb", "place", "title", "description",
  "goal", "tips", "accent", "prompt", "dramaClub", "partnerOrg", "dayIds", "status",
];
const DAY_HEADERS: (keyof ItineraryDayRow)[] = [
  "id", "programId", "chapterId", "dayNum", "dateLabel", "fullDate", "location",
  "title", "what", "spirit", "cohortNote", "dramaClub", "partnerOrg", "prep",
];
const TIME_HEADERS: (keyof TimeAnchorRow)[] = [
  "dayId", "programId", "order", "time", "label", "bold", "note", "marker",
];

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

function rowToObj(header: string[], row: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (let i = 0; i < header.length; i++) obj[header[i]] = String(row[i] ?? "").trim();
  return obj;
}

/** Header-key a raw 2D grid (row 0 = header). Falls back to canonical headers. */
function parseGrid(values: string[][], canonical: readonly string[]): Record<string, string>[] {
  if (values.length < 2) return [];
  const rawHeader = (values[0] ?? []).map((h) => String(h ?? "").trim());
  const header = rawHeader.filter(Boolean).length >= canonical.length ? rawHeader : [...canonical];
  return values.slice(1).map((row) => rowToObj(header, row));
}

/** Read a tab via the Sheets API; [] if missing/unconfigured (resilient). */
async function readTabViaSheets(tab: string): Promise<string[][]> {
  if (!SHEET_ID) return [];
  try {
    const sheets = sheetsClient();
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `'${tab}'!A:Z`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    return (res.data.values ?? []) as string[][];
  } catch (err: any) {
    console.warn(`[loadProgram] Sheets read failed for "${tab}" (tab may not exist yet):`, err?.message ?? err);
    return [];
  }
}

/** CSV/Blobs fallback for a tab; [] if no gid configured or the fetch fails. */
async function readTabViaCsv(url: string, blobKey: string): Promise<string[][]> {
  if (!url) return [];
  try {
    const text = await loadCsv(url, `${blobKey}.csv`, { revalidate: 60 });
    return parse(text, { skip_empty_lines: true, trim: true }) as string[][];
  } catch (err: any) {
    console.warn(`[loadProgram] CSV fallback failed for ${blobKey}:`, err?.message ?? err);
    return [];
  }
}

/** Sheets-first, CSV/Blobs-fallback read for one tab, header-keyed. Memoized. */
function makeTabReader(
  tab: string,
  csvUrl: string,
  blobKey: string,
  canonical: readonly string[]
) {
  return cache(async (): Promise<Record<string, string>[]> => {
    const viaSheets = await readTabViaSheets(tab);
    if (viaSheets.length >= 2) return parseGrid(viaSheets, canonical);
    const viaCsv = await readTabViaCsv(csvUrl, blobKey);
    return parseGrid(viaCsv, canonical);
  });
}

const readProgramRows = makeTabReader(TABS.program, csvUrls.programMeta, "field-kit-program", PROGRAM_HEADERS as string[]);
const readChapterRows = makeTabReader(TABS.chapters, csvUrls.programChapters, "field-kit-chapters", CHAPTER_HEADERS as string[]);
const readDayRows = makeTabReader(TABS.days, csvUrls.programDays, "field-kit-days", DAY_HEADERS as string[]);
const readTimeRows = makeTabReader(TABS.times, csvUrls.programTimeAnchors, "field-kit-time-anchors", TIME_HEADERS as string[]);

// ── per-type row mappers (explicit, mirrors loadJourneyCards#toRow) ────────────

const toProgramRow = (r: Record<string, string>): ProgramRow => ({
  programId: r.programId ?? "",
  program: r.program ?? "",
  location: r.location ?? "",
  country: r.country ?? "",
  year: r.year ?? "",
  label: r.label ?? "",
  dates: r.dates ?? "",
  essence: r.essence ?? "",
  todayDayId: r.todayDayId ?? "",
  link: r.link ?? "",
});

const toChapterRow = (r: Record<string, string>): ChapterRow => ({
  id: r.id ?? "",
  programId: r.programId ?? "",
  num: r.num ?? "",
  verb: r.verb ?? "",
  place: r.place ?? "",
  title: r.title ?? "",
  description: r.description ?? "",
  goal: r.goal ?? "",
  tips: r.tips ?? "",
  accent: r.accent ?? "",
  prompt: r.prompt ?? "",
  dramaClub: r.dramaClub ?? "",
  partnerOrg: r.partnerOrg ?? "",
  dayIds: r.dayIds ?? "",
  status: r.status ?? "",
});

const toDayRow = (r: Record<string, string>): ItineraryDayRow => ({
  id: r.id ?? "",
  programId: r.programId ?? "",
  chapterId: r.chapterId ?? "",
  dayNum: r.dayNum ?? "",
  dateLabel: r.dateLabel ?? "",
  fullDate: r.fullDate ?? "",
  location: r.location ?? "",
  title: r.title ?? "",
  what: r.what ?? "",
  spirit: r.spirit ?? "",
  cohortNote: r.cohortNote ?? "",
  dramaClub: r.dramaClub ?? "",
  partnerOrg: r.partnerOrg ?? "",
  prep: r.prep ?? "",
});

const toTimeRow = (r: Record<string, string>): TimeAnchorRow => ({
  dayId: r.dayId ?? "",
  programId: r.programId ?? "",
  order: r.order ?? "",
  time: r.time ?? "",
  label: r.label ?? "",
  bold: r.bold ?? "",
  note: r.note ?? "",
  marker: r.marker ?? "",
});

// ── public loaders ─────────────────────────────────────────────────────────────

/**
 * Fully-resolved nested itinerary for one program, or null if that programId
 * isn't present yet. Request-memoized via React cache().
 */
export const loadProgramItinerary = cache(
  async (programId: string): Promise<ProgramItinerary | null> => {
    const pid = norm(programId);
    if (!pid) return null;

    const [programRows, chapterRows, dayRows, timeRows] = await Promise.all([
      readProgramRows(),
      readChapterRows(),
      readDayRows(),
      readTimeRows(),
    ]);

    const program = programRows.map(toProgramRow).find((p) => norm(p.programId) === pid);
    if (!program) return null;

    const chapters = chapterRows
      .map(toChapterRow)
      .filter((c) => c.id && norm(c.programId) === pid);
    const days = dayRows
      .map(toDayRow)
      .filter((d) => d.id && norm(d.programId) === pid);

    const dayIdSet = new Set(days.map((d) => norm(d.id)));
    // Scope anchors by programId when present (guards reused dayIds across
    // programs); fall back to dayId membership for rows that omit it.
    const times = timeRows
      .map(toTimeRow)
      .filter((t) => dayIdSet.has(norm(t.dayId)) && (!t.programId || norm(t.programId) === pid));

    return rowsToProgramItinerary({ program, chapters, days, times });
  }
);

/**
 * The active program's itinerary for Slice 1 (single live program). Resolves the
 * first Program row, or the row matching FIELD_KIT_PROGRAM_ID if that env is set.
 */
export const loadActiveProgramItinerary = cache(
  async (): Promise<ProgramItinerary | null> => {
    const rows = (await readProgramRows()).map(toProgramRow).filter((p) => p.programId);
    if (!rows.length) return null;
    const preferred = norm(process.env.FIELD_KIT_PROGRAM_ID || "");
    const chosen = (preferred && rows.find((p) => norm(p.programId) === preferred)) || rows[0];
    return loadProgramItinerary(chosen.programId);
  }
);

/** Identity-only list of programs in the store (id + label), for pickers/links. */
export const listPrograms = cache(
  async (): Promise<{ programId: string; label: string }[]> => {
    return (await readProgramRows())
      .map(toProgramRow)
      .filter((p) => p.programId)
      .map((p) => ({
        programId: p.programId,
        label:
          p.label.trim() ||
          [p.program, [p.location, p.year].filter(Boolean).join(" ")].filter(Boolean).join(": "),
      }));
  }
);
