// lib/notifications.ts
//
// Slice 3 (Notifications) — the Notifications log + trigger source. Backed by the
// "Field Kit Notifications" tab in ALUMNI_SHEET_ID (columns: id, programId, type,
// title, body, link, notify, sentAt).
//
// Two trigger paths write here:
//   1. The admin console (Send Field Update / Set Rally Point) appends a row with
//      sentAt ALREADY SET — it sends immediately and stamps so the cron skips it.
//   2. Staff can flip a row's `notify` to TRUE directly in the Sheet; the
//      scheduled dispatch route (every ~1 min) finds notify=TRUE && sentAt empty,
//      claims the row by stamping sentAt, then sends.
//
// `sentAt` is the exactly-once guard: a non-empty sentAt means "already handled".

import "server-only";
import { sheetsClient } from "@/lib/googleClients";
import { withRetry, idxOf, normId } from "@/lib/sheetsResilience";

const TAB = "Field Kit Notifications";
const RANGE = `'${TAB}'!A:H`;

const HEADERS = ["id", "programId", "type", "title", "body", "link", "notify", "sentAt"] as const;

export type NotificationType = "update" | "rally" | "roll-call" | "choice";

export type NotificationRow = {
  id: string;
  programId: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string;
  notify: boolean;
  sentAt: string;
};

export type UnsentNotification = NotificationRow & { rowNumber: number };

function spreadsheetId(): string {
  const id = process.env.ALUMNI_SHEET_ID;
  if (!id) throw new Error("Missing ALUMNI_SHEET_ID");
  return id;
}

function coerceBool(v: unknown): boolean {
  return ["1", "true", "yes", "y"].includes(String(v ?? "").trim().toLowerCase());
}

function coerceType(v: unknown): NotificationType {
  const s = normId(v);
  if (s === "rally") return "rally";
  if (s === "roll-call" || s === "rollcall" || s === "roll call") return "roll-call";
  if (s === "choice") return "choice";
  return "update";
}

/** Column letter for a 0-based index (A..H is all we need). */
function colLetter(idx: number): string {
  return String.fromCharCode(65 + idx);
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
    "Sheets get Field Kit Notifications"
  );
  const rows = (res.data.values ?? []) as string[][];
  const header = rows[0]?.length ? rows[0] : [...HEADERS];
  return { sheets, header, rows };
}

function columns(header: string[]) {
  return {
    id: idxOf(header, ["id"]),
    programId: idxOf(header, ["programid"]),
    type: idxOf(header, ["type"]),
    title: idxOf(header, ["title"]),
    body: idxOf(header, ["body"]),
    link: idxOf(header, ["link"]),
    notify: idxOf(header, ["notify"]),
    sentAt: idxOf(header, ["sentat"]),
  };
}

function rowToNotification(header: string[], row: string[]): NotificationRow {
  const c = columns(header);
  return {
    id: String(row[c.id] ?? "").trim(),
    programId: String(row[c.programId] ?? "").trim(),
    type: coerceType(row[c.type]),
    title: String(row[c.title] ?? "").trim(),
    body: String(row[c.body] ?? "").trim(),
    link: String(row[c.link] ?? "").trim(),
    notify: coerceBool(row[c.notify]),
    sentAt: String(row[c.sentAt] ?? "").trim(),
  };
}

/**
 * Recent notifications for a program, newest first (for the admin Sent-history).
 * `limit` caps how many are returned after sorting.
 */
export async function listNotifications(
  programId: string,
  limit = 50
): Promise<NotificationRow[]> {
  const pid = normId(programId);
  const { header, rows } = await readGrid();
  const list = rows
    .slice(1)
    .map((r) => rowToNotification(header, r))
    .filter((n) => n.id && normId(n.programId) === pid);
  // Newest first by sentAt; unsent (empty sentAt) float to the top.
  list.sort((a, b) => (b.sentAt || "9999").localeCompare(a.sentAt || "9999"));
  return list.slice(0, limit);
}

/** Rows the cron should send: notify=TRUE && sentAt empty, across all programs. */
export async function findUnsent(): Promise<UnsentNotification[]> {
  const { header, rows } = await readGrid();
  const out: UnsentNotification[] = [];
  for (let i = 1; i < rows.length; i++) {
    const n = rowToNotification(header, rows[i]);
    if (n.id && n.programId && n.notify && !n.sentAt) {
      out.push({ ...n, rowNumber: i + 1 }); // sheet row number (1-based)
    }
  }
  return out;
}

/** Stamp a row's sentAt cell (claims the row so it isn't sent twice). */
export async function stampSentAt(rowNumber: number, iso: string): Promise<void> {
  const { sheets, header } = await readGrid();
  const c = columns(header);
  if (c.sentAt === -1) throw new Error('Field Kit Notifications missing "sentAt" header');
  await withRetry(
    () =>
      sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId(),
        range: `'${TAB}'!${colLetter(c.sentAt)}${rowNumber}`,
        valueInputOption: "RAW",
        requestBody: { values: [[iso]] },
      }),
    "Sheets stamp Field Kit Notifications sentAt"
  );
}

/**
 * Append a notification row. The admin console uses this with sentAt already set
 * (it sends immediately), so the cron never re-sends it.
 */
export async function appendNotification(n: NotificationRow): Promise<void> {
  const { sheets, header, rows } = await readGrid();
  if (!rows.length) throw new Error("Field Kit Notifications has no header row");
  const c = columns(header);
  const out: string[] = Array(header.length).fill("");
  const put = (i: number, v: string) => {
    if (i !== -1) out[i] = v;
  };
  put(c.id, n.id);
  put(c.programId, n.programId);
  put(c.type, n.type);
  put(c.title, n.title);
  put(c.body, n.body);
  put(c.link, n.link);
  put(c.notify, n.notify ? "TRUE" : "FALSE");
  put(c.sentAt, n.sentAt);
  await withRetry(
    () =>
      sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId(),
        range: RANGE,
        valueInputOption: "RAW",
        requestBody: { values: [out] },
      }),
    "Sheets append Field Kit Notifications"
  );
}

/** Compact unique-ish id for an admin-created notification row. */
export function newNotificationId(): string {
  return `n_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
