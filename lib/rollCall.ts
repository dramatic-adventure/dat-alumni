// lib/rollCall.ts
//
// Slice 5 (Field Ops) — the Roll Call store. Mirrors lib/rallyPoint.ts verbatim:
// Sheet-tab-backed, header-keyed, withRetry + idxOf/normId, never-throws-on-read.
// Two tabs in ALUMNI_SHEET_ID:
//
//   "Field Kit Roll Call"            id, programId, dayId, label, openedAt, closedAt
//   "Field Kit Roll Call Responses"  rollCallId, alumniSlug, status, respondedAt
//
// The CURRENT roll call (latest openedAt for the program) is attached to the
// itinerary payload by lib/loadProgram.ts so it precaches offline and rides
// LiveRefresh. Responses are LEADER/ADMIN reads (headcounts are staff + road
// managers/directors only — Jesse, 2026-07-02) plus a per-request self lookup;
// they are TTL-cached per warm instance so a fleet of Today renders doesn't
// re-read the tab on every request.
//
// Response writes UPSERT by (rollCallId, alumniSlug) — the client's offline
// queue retries at-least-once, and an upsert of the same value is naturally
// idempotent, so no separate dedup column is needed.

import "server-only";
import { sheetsClient } from "@/lib/googleClients";
import { withRetry, idxOf, normId } from "@/lib/sheetsResilience";
import type { RollCallState, RollCallStatus } from "@/lib/programItinerary";

const TAB = "Field Kit Roll Call";
const RANGE = `'${TAB}'!A:F`;
export const ROLL_CALL_HEADERS = ["id", "programId", "dayId", "label", "openedAt", "closedAt"] as const;

const RESP_TAB = "Field Kit Roll Call Responses";
const RESP_RANGE = `'${RESP_TAB}'!A:D`;
export const ROLL_CALL_RESPONSE_HEADERS = ["rollCallId", "alumniSlug", "status", "respondedAt"] as const;

export type RollCallResponse = {
  rollCallId: string;
  alumniSlug: string;
  status: RollCallStatus;
  respondedAt: string;
};

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

async function readGrid(range: string, fallback: readonly string[], label: string): Promise<Grid> {
  const sheets = sheetsClient();
  const res = await withRetry(
    () => sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId(), range }),
    label
  );
  const rows = (res.data.values ?? []) as string[][];
  const header = rows[0]?.length ? rows[0] : [...fallback];
  return { sheets, header, rows };
}

function columns(header: string[]) {
  return {
    id: idxOf(header, ["id"]),
    programId: idxOf(header, ["programid"]),
    dayId: idxOf(header, ["dayid"]),
    label: idxOf(header, ["label"]),
    openedAt: idxOf(header, ["openedat", "opened at"]),
    closedAt: idxOf(header, ["closedat", "closed at"]),
  };
}

function respColumns(header: string[]) {
  return {
    rollCallId: idxOf(header, ["rollcallid", "roll call id"]),
    alumniSlug: idxOf(header, ["alumnislug", "alumni slug"]),
    status: idxOf(header, ["status"]),
    respondedAt: idxOf(header, ["respondedat", "responded at"]),
  };
}

function rowToRollCall(header: string[], row: string[]): RollCallState {
  const c = columns(header);
  return {
    id: String(row[c.id] ?? "").trim(),
    dayId: String(row[c.dayId] ?? "").trim(),
    label: String(row[c.label] ?? "").trim(),
    openedAt: String(row[c.openedAt] ?? "").trim(),
    closedAt: String(row[c.closedAt] ?? "").trim(),
  };
}

function coerceStatus(v: unknown): RollCallStatus | null {
  const s = normId(v);
  if (s === "here") return "here";
  if (s === "needs-help" || s === "needs help" || s === "needs_help") return "needs-help";
  return null;
}

/** Compact unique-ish id for a roll call row (same shape as newNotificationId). */
export function newRollCallId(): string {
  return `rc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * The CURRENT roll call for a program — the latest row by openedAt (open or
 * closed; the UI decides what to render from closedAt). Never throws: a Sheets
 * hiccup or missing tab yields null so the itinerary load is unaffected.
 */
export async function getCurrentRollCall(programId: string): Promise<RollCallState | null> {
  try {
    const pid = normId(programId);
    if (!pid) return null;
    const { header, rows } = await readGrid(RANGE, ROLL_CALL_HEADERS, "Sheets get Field Kit Roll Call");
    const c = columns(header);
    if (c.programId === -1 || c.id === -1) return null;
    let latest: RollCallState | null = null;
    for (let i = 1; i < rows.length; i++) {
      if (normId(rows[i]?.[c.programId]) !== pid) continue;
      const rc = rowToRollCall(header, rows[i]);
      if (!rc.id) continue;
      if (!latest || rc.openedAt.localeCompare(latest.openedAt) > 0) latest = rc;
    }
    return latest;
  } catch (err) {
    console.warn("[rollCall] read failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/**
 * One roll call by id (program-scoped). Never throws — null when absent. Used
 * by the respond route to validate queued check-ins, which may reference an
 * older roll call than the current one (offline queue drained late).
 */
export async function getRollCallById(programId: string, rollCallId: string): Promise<RollCallState | null> {
  try {
    const pid = normId(programId);
    const want = normId(rollCallId);
    if (!pid || !want) return null;
    const { header, rows } = await readGrid(RANGE, ROLL_CALL_HEADERS, "Sheets get Field Kit Roll Call");
    const c = columns(header);
    if (c.programId === -1 || c.id === -1) return null;
    for (let i = 1; i < rows.length; i++) {
      if (normId(rows[i]?.[c.id]) !== want) continue;
      if (normId(rows[i]?.[c.programId]) !== pid) continue;
      return rowToRollCall(header, rows[i]);
    }
    return null;
  } catch (err) {
    console.warn("[rollCall] read failed:", err instanceof Error ? err.message : err);
    return null;
  }
}

/** Open a new roll call for a program. Returns the created record. */
export async function openRollCall(
  programId: string,
  input: { dayId: string; label: string }
): Promise<RollCallState> {
  const { sheets, header, rows } = await readGrid(RANGE, ROLL_CALL_HEADERS, "Sheets get Field Kit Roll Call");
  if (!rows.length) throw new Error(`${TAB} has no header row`);
  const c = columns(header);
  if (c.id === -1 || c.programId === -1) throw new Error(`${TAB} missing "id"/"programId" header`);

  const rc: RollCallState = {
    id: newRollCallId(),
    dayId: input.dayId.trim(),
    label: input.label.trim(),
    openedAt: new Date().toISOString(),
    closedAt: "",
  };

  const out: string[] = Array(header.length).fill("");
  const put = (i: number, v: string) => {
    if (i !== -1) out[i] = v;
  };
  put(c.id, rc.id);
  put(c.programId, programId);
  put(c.dayId, rc.dayId);
  put(c.label, rc.label);
  put(c.openedAt, rc.openedAt);
  put(c.closedAt, "");

  await withRetry(
    () =>
      sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId(),
        range: RANGE,
        valueInputOption: "RAW",
        requestBody: { values: [out] },
      }),
    "Sheets append Field Kit Roll Call"
  );
  return rc;
}

/** Close a roll call (stamps closedAt). No-op if the id isn't found. */
export async function closeRollCall(programId: string, rollCallId: string): Promise<RollCallState | null> {
  const { sheets, header, rows } = await readGrid(RANGE, ROLL_CALL_HEADERS, "Sheets get Field Kit Roll Call");
  const c = columns(header);
  if (c.id === -1 || c.closedAt === -1) throw new Error(`${TAB} missing "id"/"closedAt" header`);
  const pid = normId(programId);
  const want = normId(rollCallId);
  for (let i = 1; i < rows.length; i++) {
    if (normId(rows[i]?.[c.id]) !== want) continue;
    if (c.programId !== -1 && normId(rows[i]?.[c.programId]) !== pid) continue;
    const closedAt = new Date().toISOString();
    await withRetry(
      () =>
        sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetId(),
          range: `'${TAB}'!${String.fromCharCode(65 + c.closedAt)}${i + 1}`,
          valueInputOption: "RAW",
          requestBody: { values: [[closedAt]] },
        }),
      "Sheets close Field Kit Roll Call"
    );
    return { ...rowToRollCall(header, rows[i]), closedAt };
  }
  return null;
}

/* ── Responses ──────────────────────────────────────────────────────────────── */

// Short cross-request TTL cache (per warm instance) so Today renders + leader
// polls share one Responses read. Invalidated on every write.
const RESPONSES_TTL_MS = Number(process.env.FIELD_KIT_OPS_TTL_MS || 15_000);
let _respCache: { at: number; rows: RollCallResponse[] } | null = null;

async function readAllResponses(): Promise<RollCallResponse[]> {
  const now = Date.now();
  if (_respCache && now - _respCache.at < RESPONSES_TTL_MS) return _respCache.rows;
  const { header, rows } = await readGrid(
    RESP_RANGE,
    ROLL_CALL_RESPONSE_HEADERS,
    "Sheets get Field Kit Roll Call Responses"
  );
  const c = respColumns(header);
  // Dedupe by (rollCallId, alumniSlug), keeping the LATEST respondedAt.
  // Concurrent first-time upserts (two devices / two lambdas) can append
  // duplicate rows — without this, counts double and a stale duplicate could
  // shadow someone's real status forever.
  const latest = new Map<string, RollCallResponse>();
  if (c.rollCallId !== -1 && c.alumniSlug !== -1) {
    for (let i = 1; i < rows.length; i++) {
      const status = coerceStatus(rows[i]?.[c.status]);
      const rollCallId = String(rows[i]?.[c.rollCallId] ?? "").trim();
      const alumniSlug = normId(rows[i]?.[c.alumniSlug]);
      if (!rollCallId || !alumniSlug || !status) continue;
      const resp: RollCallResponse = {
        rollCallId,
        alumniSlug,
        status,
        respondedAt: String(rows[i]?.[c.respondedAt] ?? "").trim(),
      };
      const key = `${normId(rollCallId)}::${alumniSlug}`;
      const prev = latest.get(key);
      if (!prev || resp.respondedAt.localeCompare(prev.respondedAt) >= 0) latest.set(key, resp);
    }
  }
  const out = Array.from(latest.values());
  _respCache = { at: now, rows: out };
  return out;
}

/**
 * Every response for one roll call. Never throws — [] on any read failure so
 * Today still renders.
 */
export async function getRollCallResponses(rollCallId: string): Promise<RollCallResponse[]> {
  try {
    const want = normId(rollCallId);
    if (!want) return [];
    return (await readAllResponses()).filter((r) => normId(r.rollCallId) === want);
  } catch (err) {
    console.warn("[rollCall] responses read failed:", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Upsert one artist's response, keyed by (rollCallId, alumniSlug) — latest tap
 * wins (see the stale-write guard below). Returns the previous status (null if
 * this is their first response) and whether the write was actually applied, so
 * the caller pushes a "needs help" alert only on a real, applied transition.
 */
export async function upsertRollCallResponse(input: {
  rollCallId: string;
  alumniSlug: string;
  status: RollCallStatus;
  respondedAt?: string;
}): Promise<{ previousStatus: RollCallStatus | null; applied: boolean }> {
  const { sheets, header, rows } = await readGrid(
    RESP_RANGE,
    ROLL_CALL_RESPONSE_HEADERS,
    "Sheets get Field Kit Roll Call Responses"
  );
  if (!rows.length) throw new Error(`${RESP_TAB} has no header row`);
  const c = respColumns(header);
  if (c.rollCallId === -1 || c.alumniSlug === -1) {
    throw new Error(`${RESP_TAB} missing "rollCallId"/"alumniSlug" header`);
  }

  const wantCall = normId(input.rollCallId);
  const wantSlug = normId(input.alumniSlug);
  let foundIndex = -1;
  let previousStatus: RollCallStatus | null = null;
  let previousAt = "";
  for (let i = 1; i < rows.length; i++) {
    if (normId(rows[i]?.[c.rollCallId]) === wantCall && normId(rows[i]?.[c.alumniSlug]) === wantSlug) {
      foundIndex = i;
      previousStatus = coerceStatus(rows[i]?.[c.status]);
      previousAt = String(rows[i]?.[c.respondedAt] ?? "").trim();
      break;
    }
  }

  // STALE-WRITE GUARD: the offline queue retries with backoff, so an OLDER
  // answer can arrive AFTER a newer one already landed (tap "here", it 500s
  // and reschedules; tap "needs-help", it syncs; the "here" retry must not
  // overwrite it). respondedAt carries the tap time end-to-end; never let an
  // older tap replace a newer stored answer.
  const incomingAt = input.respondedAt || new Date().toISOString();
  if (foundIndex !== -1 && previousAt && previousAt.localeCompare(incomingAt) > 0) {
    return { previousStatus, applied: false };
  }

  const out: string[] = Array(header.length).fill("");
  const put = (i: number, v: string) => {
    if (i !== -1) out[i] = v;
  };
  put(c.rollCallId, input.rollCallId);
  put(c.alumniSlug, wantSlug);
  put(c.status, input.status);
  put(c.respondedAt, incomingAt);

  if (foundIndex !== -1) {
    await withRetry(
      () =>
        sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetId(),
          range: `'${RESP_TAB}'!A${foundIndex + 1}:D${foundIndex + 1}`,
          valueInputOption: "RAW",
          requestBody: { values: [out] },
        }),
      "Sheets update Field Kit Roll Call Responses"
    );
  } else {
    await withRetry(
      () =>
        sheets.spreadsheets.values.append({
          spreadsheetId: spreadsheetId(),
          range: RESP_RANGE,
          valueInputOption: "RAW",
          requestBody: { values: [out] },
        }),
      "Sheets append Field Kit Roll Call Responses"
    );
  }

  _respCache = null; // the next read sees this write
  return { previousStatus, applied: true };
}
