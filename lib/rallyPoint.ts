// lib/rallyPoint.ts
//
// Slice 3 (Notifications) — the CURRENT rally point store. Backed by the
// "Field Kit Rally Point" tab in ALUMNI_SHEET_ID (columns: programId, location,
// lookFor, meetTime, departure, updatedAt). One row PER PROGRAM (latest wins):
// setRallyPoint upserts by programId, getRallyPoint returns it.
//
// The current rally point is attached to the itinerary payload by
// lib/loadProgram.ts so it precaches offline with the itinerary and rides the
// existing LiveRefresh change-detection. Reads are resilient: any failure yields
// null so the itinerary still loads.

import "server-only";
import { sheetsClient } from "@/lib/googleClients";
import { withRetry, idxOf, normId } from "@/lib/sheetsResilience";
import type { RallyPoint } from "@/lib/programItinerary";

const TAB = "Field Kit Rally Point";
const RANGE = `'${TAB}'!A:F`;

const HEADERS = ["programId", "location", "lookFor", "meetTime", "departure", "updatedAt"] as const;

function spreadsheetId(): string {
  const id = process.env.ALUMNI_SHEET_ID;
  if (!id) throw new Error("Missing ALUMNI_SHEET_ID");
  return id;
}

type Grid = {
  sheets: ReturnType<typeof sheetsClient>;
  header: string[];
  rows: string[][];
};

async function readGrid(): Promise<Grid> {
  const sheets = sheetsClient();
  const res = await withRetry(
    () => sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId(), range: RANGE }),
    "Sheets get Field Kit Rally Point"
  );
  const rows = (res.data.values ?? []) as string[][];
  const header = rows[0]?.length ? rows[0] : [...HEADERS];
  return { sheets, header, rows };
}

function columns(header: string[]) {
  return {
    programId: idxOf(header, ["programid"]),
    location: idxOf(header, ["location"]),
    lookFor: idxOf(header, ["lookfor", "look for"]),
    meetTime: idxOf(header, ["meettime", "meet time"]),
    departure: idxOf(header, ["departure"]),
    updatedAt: idxOf(header, ["updatedat", "updated at"]),
  };
}

function rowToRally(header: string[], row: string[]): RallyPoint {
  const c = columns(header);
  return {
    location: String(row[c.location] ?? "").trim(),
    lookFor: String(row[c.lookFor] ?? "").trim(),
    meetTime: String(row[c.meetTime] ?? "").trim(),
    departure: String(row[c.departure] ?? "").trim(),
    updatedAt: String(row[c.updatedAt] ?? "").trim(),
  };
}

/**
 * The current rally point for a program, or null if none set / nothing
 * meaningful stored. Never throws — a Sheets hiccup just yields null so the
 * itinerary load is unaffected.
 */
export async function getRallyPoint(programId: string): Promise<RallyPoint | null> {
  try {
    const pid = normId(programId);
    if (!pid) return null;
    const { header, rows } = await readGrid();
    const c = columns(header);
    if (c.programId === -1) return null;
    for (let i = 1; i < rows.length; i++) {
      if (normId(rows[i]?.[c.programId]) === pid) {
        const rally = rowToRally(header, rows[i]);
        // Treat an all-blank content row as "no rally point".
        if (!rally.location && !rally.lookFor && !rally.meetTime && !rally.departure) return null;
        return rally;
      }
    }
    return null;
  } catch (err) {
    console.warn("[rallyPoint] read failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Upsert the current rally point for a program (one row per programId). */
export async function setRallyPoint(
  programId: string,
  input: { location: string; lookFor: string; meetTime: string; departure: string }
): Promise<RallyPoint> {
  const { sheets, header, rows } = await readGrid();
  if (!rows.length) throw new Error("Field Kit Rally Point has no header row");
  const c = columns(header);
  if (c.programId === -1) throw new Error('Field Kit Rally Point missing "programId" header');

  const pid = normId(programId);
  let foundIndex = -1;
  for (let i = 1; i < rows.length; i++) {
    if (normId(rows[i]?.[c.programId]) === pid) {
      foundIndex = i;
      break;
    }
  }

  const updatedAt = new Date().toISOString();
  const rally: RallyPoint = {
    location: input.location.trim(),
    lookFor: input.lookFor.trim(),
    meetTime: input.meetTime.trim(),
    departure: input.departure.trim(),
    updatedAt,
  };

  const out: string[] = Array(header.length).fill("");
  const put = (i: number, v: string) => {
    if (i !== -1) out[i] = v;
  };
  put(c.programId, programId);
  put(c.location, rally.location);
  put(c.lookFor, rally.lookFor);
  put(c.meetTime, rally.meetTime);
  put(c.departure, rally.departure);
  put(c.updatedAt, updatedAt);

  if (foundIndex !== -1) {
    await withRetry(
      () =>
        sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetId(),
          range: `'${TAB}'!A${foundIndex + 1}:F${foundIndex + 1}`,
          valueInputOption: "RAW",
          requestBody: { values: [out] },
        }),
      "Sheets update Field Kit Rally Point"
    );
  } else {
    await withRetry(
      () =>
        sheets.spreadsheets.values.append({
          spreadsheetId: spreadsheetId(),
          range: RANGE,
          valueInputOption: "RAW",
          requestBody: { values: [out] },
        }),
      "Sheets append Field Kit Rally Point"
    );
  }

  return rally;
}
