// lib/pushSubscriptions.ts
//
// Slice 3 (Notifications) — durable, serverless-safe store for artists' web-push
// PushSubscriptions. Backed by the "Field Kit Push Subscriptions" tab in the
// ALUMNI_SHEET_ID workbook (columns: programId, alumniSlug, endpoint, keys,
// createdAt) — the same Sheets persistence the rest of the kit uses, so it
// survives serverless cold starts (local SQLite would not on this deploy).
//
// Reads/writes mirror the Field-Captures pattern in app/api/field-kit/capture:
// header-keyed columns + withRetry. Subscriptions are DEDUPED BY ENDPOINT (a
// browser's push endpoint is its stable identity): re-subscribing the same
// endpoint updates the existing row rather than appending a duplicate.

import "server-only";
import { sheetsClient } from "@/lib/googleClients";
import { withRetry, idxOf, normId } from "@/lib/sheetsResilience";

const TAB = "Field Kit Push Subscriptions";
const RANGE = `'${TAB}'!A:E`;

// Canonical column order — used to size a new/updated row. Header-keyed reads
// tolerate reordering; this is the write-side fallback.
const HEADERS = ["programId", "alumniSlug", "endpoint", "keys", "createdAt"] as const;

export type PushKeys = { p256dh: string; auth: string };

export type StoredSubscription = {
  programId: string;
  alumniSlug: string;
  endpoint: string;
  keys: PushKeys;
  createdAt: string;
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

async function readGrid(): Promise<Grid> {
  const sheets = sheetsClient();
  const res = await withRetry(
    () => sheets.spreadsheets.values.get({ spreadsheetId: spreadsheetId(), range: RANGE }),
    "Sheets get Field Kit Push Subscriptions"
  );
  const rows = (res.data.values ?? []) as string[][];
  const header = rows[0]?.length ? rows[0] : [...HEADERS];
  return { sheets, header, rows };
}

function columns(header: string[]) {
  return {
    programId: idxOf(header, ["programid"]),
    alumniSlug: idxOf(header, ["alumnislug"]),
    endpoint: idxOf(header, ["endpoint"]),
    keys: idxOf(header, ["keys"]),
    createdAt: idxOf(header, ["createdat"]),
  };
}

function parseKeys(raw: string): PushKeys | null {
  try {
    const k = JSON.parse(raw) as Partial<PushKeys>;
    if (k && typeof k.p256dh === "string" && typeof k.auth === "string") {
      return { p256dh: k.p256dh, auth: k.auth };
    }
  } catch {
    /* malformed cell */
  }
  return null;
}

function rowToSub(header: string[], row: string[]): StoredSubscription | null {
  const c = columns(header);
  const endpoint = String(row[c.endpoint] ?? "").trim();
  if (!endpoint) return null;
  const keys = parseKeys(String(row[c.keys] ?? ""));
  if (!keys) return null;
  return {
    programId: String(row[c.programId] ?? "").trim(),
    alumniSlug: normId(row[c.alumniSlug]),
    endpoint,
    keys,
    createdAt: String(row[c.createdAt] ?? "").trim(),
  };
}

/** Every stored subscription for a program (no roster filtering — see webPush). */
export async function listSubscriptionsForProgram(
  programId: string
): Promise<StoredSubscription[]> {
  const pid = normId(programId);
  const { header, rows } = await readGrid();
  return rows
    .slice(1)
    .map((r) => rowToSub(header, r))
    .filter((s): s is StoredSubscription => !!s && normId(s.programId) === pid);
}

/**
 * Insert or update one subscription, deduped by endpoint. If the endpoint
 * already exists its row is overwritten (programId/slug/keys refreshed,
 * createdAt preserved); otherwise a new row is appended.
 */
export async function upsertSubscription(input: {
  programId: string;
  alumniSlug: string;
  endpoint: string;
  keys: PushKeys;
}): Promise<void> {
  const { sheets, header, rows } = await readGrid();
  if (!rows.length) throw new Error("Field Kit Push Subscriptions has no header row");
  const c = columns(header);
  if (c.endpoint === -1) throw new Error('Field Kit Push Subscriptions missing "endpoint" header');

  const want = normId(input.endpoint);
  let foundIndex = -1; // index into `rows` (0 = header)
  for (let i = 1; i < rows.length; i++) {
    if (normId(rows[i]?.[c.endpoint]) === want) {
      foundIndex = i;
      break;
    }
  }

  const existingCreatedAt =
    foundIndex !== -1 ? String(rows[foundIndex]?.[c.createdAt] ?? "").trim() : "";
  const nowIso = new Date().toISOString();

  const out: string[] = Array(header.length).fill("");
  const put = (i: number, v: string) => {
    if (i !== -1) out[i] = v;
  };
  put(c.programId, input.programId);
  put(c.alumniSlug, normId(input.alumniSlug));
  put(c.endpoint, input.endpoint);
  put(c.keys, JSON.stringify(input.keys));
  put(c.createdAt, existingCreatedAt || nowIso);

  if (foundIndex !== -1) {
    await withRetry(
      () =>
        sheets.spreadsheets.values.update({
          spreadsheetId: spreadsheetId(),
          range: `'${TAB}'!A${foundIndex + 1}:E${foundIndex + 1}`,
          valueInputOption: "RAW",
          requestBody: { values: [out] },
        }),
      "Sheets update Field Kit Push Subscriptions"
    );
    return;
  }

  await withRetry(
    () =>
      sheets.spreadsheets.values.append({
        spreadsheetId: spreadsheetId(),
        range: RANGE,
        valueInputOption: "RAW",
        requestBody: { values: [out] },
      }),
    "Sheets append Field Kit Push Subscriptions"
  );
}

/** Resolve a tab's numeric sheetId (gid) by title, for row deletion. */
async function sheetGidByTitle(grid: Grid, title: string): Promise<number | null> {
  const meta = await withRetry(
    () =>
      grid.sheets.spreadsheets.get({
        spreadsheetId: spreadsheetId(),
        fields: "sheets(properties(sheetId,title))",
      }),
    "Sheets get metadata (push subs gid)"
  );
  const found = (meta.data.sheets ?? []).find((s) => s.properties?.title === title);
  return typeof found?.properties?.sheetId === "number" ? found.properties.sheetId : null;
}

/**
 * Remove every row whose endpoint is in `endpoints` (used by unsubscribe and by
 * the send util to prune dead 404/410 subscriptions). Deletes whole rows so the
 * tab doesn't accumulate blanks; falls back to clearing cells if the gid can't
 * be resolved.
 */
export async function deleteSubscriptionsByEndpoint(endpoints: string[]): Promise<void> {
  const want = new Set(endpoints.map(normId).filter(Boolean));
  if (!want.size) return;

  const grid = await readGrid();
  const c = columns(grid.header);
  if (c.endpoint === -1) return;

  const indices: number[] = []; // indices into rows (0 = header) == sheet row indices
  for (let i = 1; i < grid.rows.length; i++) {
    if (want.has(normId(grid.rows[i]?.[c.endpoint]))) indices.push(i);
  }
  if (!indices.length) return;

  const gid = await sheetGidByTitle(grid, TAB);
  if (gid == null) {
    // Fallback: blank the matched rows (listing ignores rows with empty endpoint).
    const data = indices.map((i) => ({
      range: `'${TAB}'!A${i + 1}:E${i + 1}`,
      values: [Array(grid.header.length).fill("")],
    }));
    await withRetry(
      () =>
        grid.sheets.spreadsheets.values.batchUpdate({
          spreadsheetId: spreadsheetId(),
          requestBody: { data, valueInputOption: "RAW" },
        }),
      "Sheets clear Field Kit Push Subscriptions"
    );
    return;
  }

  // Delete bottom-up so earlier deletions don't shift later indices.
  const requests = indices
    .sort((a, b) => b - a)
    .map((i) => ({
      deleteDimension: { range: { sheetId: gid, dimension: "ROWS", startIndex: i, endIndex: i + 1 } },
    }));
  await withRetry(
    () =>
      grid.sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId(),
        requestBody: { requests },
      }),
    "Sheets delete Field Kit Push Subscriptions rows"
  );
}
