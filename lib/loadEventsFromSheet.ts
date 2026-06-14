// lib/loadEventsFromSheet.ts
import "server-only";
import { randomUUID } from "crypto";
import { sheetsClient } from "@/lib/googleClients";

const SHEET_ID = process.env.ALUMNI_SHEET_ID || "";
const TAB = "Events";

// Column order matches the sheet header row (row 1).
const HEADERS = [
  "eventId",
  "alumniId",
  "title",
  "link",
  "date",
  "expiresAt",
  "description",
  "city",
  "stateCountry",
  "mediaType",
  "mediaUrl",
  "mediaFileId",
  "mediaAlt",
  "videoAutoplay",
  "sortDate",
  "createdTs",
  "updatedTs",
  "hidden",
] as const;

export type EventRow = {
  eventId: string;
  alumniId: string;
  title: string;
  link: string;
  date: string;
  expiresAt: string;
  description: string;
  city: string;
  stateCountry: string;
  mediaType: string;
  mediaUrl: string;
  mediaFileId: string;
  mediaAlt: string;
  videoAutoplay: string;
  sortDate: string;
  createdTs: string;
  updatedTs: string;
  hidden: boolean;
};

const LAST_COL = "R"; // 18 columns A..R

function coerceBool(v: unknown): boolean {
  return ["1", "true", "yes", "y"].includes(String(v ?? "").trim().toLowerCase());
}

function norm(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

function rowToObj(header: string[], row: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (let i = 0; i < header.length; i++) obj[header[i]] = String(row[i] ?? "").trim();
  return obj;
}

function toEventRow(o: Record<string, string>): EventRow {
  return {
    eventId: o.eventId ?? "",
    alumniId: o.alumniId ?? "",
    title: o.title ?? "",
    link: o.link ?? "",
    date: o.date ?? "",
    expiresAt: o.expiresAt ?? "",
    description: o.description ?? "",
    city: o.city ?? "",
    stateCountry: o.stateCountry ?? "",
    mediaType: o.mediaType ?? "",
    mediaUrl: o.mediaUrl ?? "",
    mediaFileId: o.mediaFileId ?? "",
    mediaAlt: o.mediaAlt ?? "",
    videoAutoplay: o.videoAutoplay ?? "",
    sortDate: o.sortDate ?? "",
    createdTs: o.createdTs ?? "",
    updatedTs: o.updatedTs ?? "",
    hidden: coerceBool(o.hidden),
  };
}

/** True when the event's date AND expiry are both in the past (or date alone, if no expiry). */
export function isEventExpired(e: { date?: string; expiresAt?: string }): boolean {
  const now = Date.now();
  const exp = String(e.expiresAt ?? "").trim();
  const date = String(e.date ?? "").trim();
  if (exp) {
    const t = Date.parse(exp);
    return Number.isFinite(t) ? t < now : false;
  }
  if (date) {
    const t = Date.parse(date);
    // An event with only a date expires at the end of that day.
    return Number.isFinite(t) ? t + 24 * 60 * 60 * 1000 < now : false;
  }
  return false;
}

/** Load all events for an alumniId, split into visible (active) and hidden (deleted). */
export async function loadEventsForAlumniId(
  alumniId: string
): Promise<{ events: EventRow[]; hidden: EventRow[] }> {
  if (!SHEET_ID || !alumniId) return { events: [], hidden: [] };

  const sheets = sheetsClient();
  let values: string[][] = [];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${TAB}!A:${LAST_COL}`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    values = (res.data.values ?? []) as string[][];
  } catch {
    // Tab not created yet → no events.
    return { events: [], hidden: [] };
  }
  if (values.length < 2) return { events: [], hidden: [] };

  const header = (values[0] ?? []).map((h) => String(h ?? "").trim());
  const want = norm(alumniId);

  const rows = values
    .slice(1)
    .map((r) => toEventRow(rowToObj(header, r)))
    .filter((r) => r.eventId && norm(r.alumniId) === want);

  return {
    events: rows.filter((r) => !r.hidden),
    hidden: rows.filter((r) => r.hidden),
  };
}

/** Public helper: the soonest non-expired, non-hidden event for a profile (or null). */
export async function loadNextUpcomingEvent(alumniId: string): Promise<EventRow | null> {
  const { events } = await loadEventsForAlumniId(alumniId);
  const upcoming = events
    .filter((e) => e.title.trim() && !isEventExpired(e))
    .sort((a, b) => {
      const ta = Date.parse(a.date) || Number.MAX_SAFE_INTEGER;
      const tb = Date.parse(b.date) || Number.MAX_SAFE_INTEGER;
      return ta - tb;
    });
  return upcoming[0] ?? null;
}

function alignedValues(row: Partial<EventRow>): string[] {
  return HEADERS.map((key) => {
    const v = (row as Record<string, unknown>)[key];
    if (typeof v === "boolean") return v ? "true" : "false";
    return String(v ?? "");
  });
}

// Create the Events tab (with its header row) the first time someone saves an
// event, so the sheet doesn't need to be set up by hand.
async function ensureEventsTab(sheets: ReturnType<typeof sheetsClient>): Promise<void> {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: "sheets(properties(title))",
  });
  const exists = (meta.data.sheets ?? []).some((s) => s.properties?.title === TAB);
  if (exists) return;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests: [{ addSheet: { properties: { title: TAB } } }] },
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A1:${LAST_COL}1`,
    valueInputOption: "RAW",
    requestBody: { values: [HEADERS as unknown as string[]] },
  });
}

/** Create a new event row. Returns the generated eventId. */
export async function appendEventRow(
  input: Omit<EventRow, "eventId" | "createdTs" | "updatedTs" | "hidden"> &
    Partial<Pick<EventRow, "eventId" | "hidden">>
): Promise<string> {
  if (!SHEET_ID) throw new Error("Missing ALUMNI_SHEET_ID");
  const sheets = sheetsClient();
  await ensureEventsTab(sheets);
  const nowIso = new Date().toISOString();
  const eventId = (input.eventId && input.eventId.trim()) || `evt_${randomUUID()}`;

  const row: EventRow = {
    ...(input as EventRow),
    eventId,
    sortDate: input.sortDate || input.date || nowIso.split("T")[0],
    createdTs: nowIso,
    updatedTs: nowIso,
    hidden: Boolean(input.hidden),
  };

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A:${LAST_COL}`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [alignedValues(row)] },
  });
  return eventId;
}

async function findRowNumberByEventId(eventId: string): Promise<{
  rowNumber: number;
  before: EventRow;
} | null> {
  const sheets = sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A:${LAST_COL}`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const values = (res.data.values ?? []) as string[][];
  if (values.length < 2) return null;
  const header = (values[0] ?? []).map((h) => String(h ?? "").trim());
  const want = String(eventId).trim();
  for (let i = 1; i < values.length; i++) {
    const obj = rowToObj(header, values[i]);
    if (String(obj.eventId ?? "").trim() === want) {
      return { rowNumber: i + 1, before: toEventRow(obj) }; // 1-based sheet row (header is row 1)
    }
  }
  return null;
}

/** Update editable fields of an existing event (found by eventId). */
export async function updateEventRow(
  eventId: string,
  patch: Partial<EventRow>
): Promise<boolean> {
  if (!SHEET_ID) throw new Error("Missing ALUMNI_SHEET_ID");
  const found = await findRowNumberByEventId(eventId);
  if (!found) return false;
  const merged: EventRow = {
    ...found.before,
    ...patch,
    eventId: found.before.eventId,
    updatedTs: new Date().toISOString(),
  };
  const sheets = sheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A${found.rowNumber}:${LAST_COL}${found.rowNumber}`,
    valueInputOption: "USER_ENTERED",
    requestBody: { values: [alignedValues(merged)] },
  });
  return true;
}

/** Soft delete / restore by flipping the hidden flag. */
export async function setEventHidden(eventId: string, hidden: boolean): Promise<boolean> {
  return updateEventRow(eventId, { hidden });
}
