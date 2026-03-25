// scripts/migrateProfileDataToLive.ts
import dotenv from "dotenv";
import path from "path";

// Load Next-style env files for scripts
dotenv.config({ path: path.join(process.cwd(), ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") }); // optional fallback

console.log("[migrate] env", {
  hasSheetId: !!process.env.ALUMNI_SHEET_ID,
  hasSaJson: !!process.env.GCP_SA_JSON,
  dryRun: process.env.DRY_RUN === "1",
});

import { google } from "googleapis";
import type { sheets_v4 } from "googleapis";

type Row = Record<string, string>;
type LiveRow = Record<string, string>;

// Accept both GaxiosResponse and GaxiosResponseWithHTTP2 (they’re structurally compatible on `data`)
type ApiResp<T> = { data: T };

const SHEET_ID = process.env.ALUMNI_SHEET_ID;
const SA_JSON = process.env.GCP_SA_JSON;
const DRY_RUN = process.env.DRY_RUN === "1";

// Tabs
const TAB_DATA = "Profile-Data";
const TAB_LIVE = "Profile-Live";
const TAB_CHANGES = "Profile-Changes";

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function boolish(s: unknown): boolean | null {
  const v = norm(s).toLowerCase();
  if (!v) return null;
  if (v === "true" || v === "yes" || v === "y" || v === "1" || v === "checked" || v === "✓") return true;
  if (v === "false" || v === "no" || v === "n" || v === "0") return false;
  return null;
}

function die(msg: string): never {
  throw new Error(msg);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withQuotaBackoff<T>(
  fn: () => Promise<T>,
  label: string
): Promise<T> {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (err: any) {
      const status = err?.code || err?.status || err?.response?.status;
      const message =
        err?.message ||
        err?.response?.data?.error?.message ||
        err?.response?.data?.error ||
        String(err);

      // Sheets quota / rate-limit errors often show up as 429, sometimes 403.
      if (status === 429 || status === 403) {
        attempt++;
        if (attempt > 8) throw err;
        const delay = Math.min(30_000, 1000 * Math.pow(2, attempt - 1));
        console.warn(
          `[migrate][retry] ${label} quota/rate-limit (${status}). waiting ${delay}ms. msg=${message}`
        );
        await sleep(delay);
        continue;
      }

      throw err;
    }
  }
}

function parseSA(jsonStr: string) {
  try {
    return JSON.parse(jsonStr);
  } catch {
    return JSON.parse(jsonStr.replace(/\\n/g, "\n"));
  }
}

function norm(s: unknown) {
  return String(s ?? "").trim();
}

function normSlug(s: unknown) {
  return norm(s).toLowerCase();
}

function nowIso() {
  return new Date().toISOString();
}

function looksLikeDate(s: string) {
  const t = Date.parse(s);
  return Number.isFinite(t);
}

function toBoolCell(raw: string): "true" | "false" {
  const s = norm(raw).toLowerCase();
  const truthy =
    s === "true" ||
    s === "yes" ||
    s === "y" ||
    s === "1" ||
    s === "checked" ||
    s === "✓";
  return truthy ? "true" : "false";
}

/** Convert Sheets values -> array of objects keyed by header */
function valuesToObjects(values: any[][]): Row[] {
  if (!values || values.length < 2) return [];
  const [H, ...rows] = values;
  const headers = (H || []).map((h: any) => norm(h));
  return rows.map((r) => {
    const obj: Row = {};
    for (let i = 0; i < headers.length; i++) obj[headers[i]] = norm(r?.[i]);
    return obj;
  });
}

/** Extract first matching URL or handle from a blob of text */
function firstMatch(text: string, patterns: RegExp[]): string {
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m?.[0]) return m[0];
    if (m?.[1]) return m[1];
  }
  return "";
}

function parseInstagram(raw: string) {
  const s = raw.trim();
  const url = firstMatch(s, [
    /https?:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._-]+/i,
    /instagram\.com\/[A-Za-z0-9._-]+/i,
  ]);
  if (url) return url.startsWith("http") ? url : `https://${url}`;

  const handle = firstMatch(s, [/@([A-Za-z0-9._-]{2,})/]);
  if (handle) return handle.startsWith("@") ? handle : `@${handle}`;

  return "";
}

function parseYouTube(raw: string) {
  const s = raw.trim();
  const url = firstMatch(s, [
    /https?:\/\/(www\.)?youtube\.com\/[^\s,;]+/i,
    /https?:\/\/youtu\.be\/[^\s,;]+/i,
    /youtube\.com\/[^\s,;]+/i,
    /youtu\.be\/[^\s,;]+/i,
  ]);
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
}

function parseVimeo(raw: string) {
  const s = raw.trim();
  const url = firstMatch(s, [
    /https?:\/\/(www\.)?vimeo\.com\/[0-9A-Za-z/_-]+/i,
    /vimeo\.com\/[0-9A-Za-z/_-]+/i,
  ]);
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
}

function parseImdb(raw: string) {
  const s = raw.trim();
  const url = firstMatch(s, [
    /https?:\/\/(www\.)?imdb\.com\/name\/nm\d+/i,
    /imdb\.com\/name\/nm\d+/i,
  ]);
  if (!url) return "";
  return url.startsWith("http") ? url : `https://${url}`;
}

function parseSocials(artistSocialLinks: string) {
  const blob = artistSocialLinks || "";
  return {
    instagram: parseInstagram(blob),
    youtube: parseYouTube(blob),
    vimeo: parseVimeo(blob),
    imdb: parseImdb(blob),
  };
}

/**
 * Safe-set rule:
 * - never overwrite a non-empty Live cell with empty source
 * - if source has value and it's different, update
 */
function shouldUpdateCell(liveVal: string, nextVal: string) {
  const live = norm(liveVal);
  const next = norm(nextVal);
  if (!next) return false; // do not write empties
  if (!live) return true; // fill empty
  return live !== next; // replace if different & next non-empty
}

function buildAlumniId(row: Row) {
  const profileId = norm(row["Profile ID"]);
  const slug = normSlug(row["slug"]);
  return normSlug(profileId || slug);
}

function buildCanonicalSlug(row: Row) {
  return normSlug(row["slug"]);
}

function assertHasColumns(headers: string[], cols: string[]) {
  const set = new Set(headers);
  for (const c of cols) {
    if (!set.has(c)) die(`Profile-Live missing required column: "${c}"`);
  }
}

async function writeProfileLiveWholeSheet(opts: {
  sheets: sheets_v4.Sheets;
  spreadsheetId: string;
  liveHeaders: string[];
  rowMatrix: string[][];
}) {
  const { sheets, spreadsheetId, liveHeaders, rowMatrix } = opts;
  const values = [liveHeaders, ...rowMatrix];

  if (DRY_RUN) return;

  await withQuotaBackoff(
    () =>
      sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${TAB_LIVE}!A1`,
        valueInputOption: "RAW",
        requestBody: { values },
      }),
    "write Profile-Live whole sheet"
  );
}

async function ensureChangesHeader(opts: {
  sheets: sheets_v4.Sheets;
  spreadsheetId: string;
}) {
  const { sheets, spreadsheetId } = opts;

  const wantHead = ["ts", "alumniId", "email", "field", "before", "after"];

  const resp = await withQuotaBackoff<ApiResp<sheets_v4.Schema$ValueRange>>(
    () =>
      sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `${TAB_CHANGES}!A1:F1`,
        valueRenderOption: "UNFORMATTED_VALUE",
      }) as any,
    "read Profile-Changes header"
  );

  const head = (resp.data.values?.[0] || []).map((x: any) => norm(x));
  const headOk =
    head.length >= wantHead.length &&
    wantHead.every((h, i) => norm(head[i]).toLowerCase() === h.toLowerCase());

  if (headOk) return;
  if (DRY_RUN) return;

  await withQuotaBackoff(
    () =>
      sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${TAB_CHANGES}!A1:F1`,
        valueInputOption: "RAW",
        requestBody: { values: [wantHead] },
      }),
    "write Profile-Changes header"
  );
}

async function appendChanges(opts: {
  sheets: sheets_v4.Sheets;
  spreadsheetId: string;
  changeRows: string[][];
}) {
  const { sheets, spreadsheetId, changeRows } = opts;
  if (!changeRows.length) return;
  if (DRY_RUN) return;

  await withQuotaBackoff(
    () =>
      sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `${TAB_CHANGES}!A:F`,
        valueInputOption: "RAW",
        insertDataOption: "INSERT_ROWS",
        requestBody: { values: changeRows },
      }),
    "append Profile-Changes rows"
  );
}

// ------------------------------------------------------------
// Main
// ------------------------------------------------------------
async function main() {
  if (!SHEET_ID) die("Missing env ALUMNI_SHEET_ID");
  if (!SA_JSON) die("Missing env GCP_SA_JSON");

  const sa = parseSA(SA_JSON);
  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  // Read Profile-Data
  const dataResp = await withQuotaBackoff<ApiResp<sheets_v4.Schema$ValueRange>>(
    () =>
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${TAB_DATA}!A:ZZ`,
        valueRenderOption: "UNFORMATTED_VALUE",
      }) as any,
    "read Profile-Data"
  );

  const dataVals = (dataResp.data.values || []) as any[][];
  const dataObjects = valuesToObjects(dataVals);

  // Read Profile-Live
  const liveResp = await withQuotaBackoff<ApiResp<sheets_v4.Schema$ValueRange>>(
    () =>
      sheets.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${TAB_LIVE}!A:ZZ`,
        valueRenderOption: "UNFORMATTED_VALUE",
      }) as any,
    "read Profile-Live"
  );

  const liveVals = (liveResp.data.values || []) as any[][];
  const [LH_RAW, ...liveRowsRaw] = liveVals.length ? liveVals : [[]];
  const liveHeaders = (LH_RAW || []).map((h: any) => norm(h));

  if (!liveHeaders.length) die("Profile-Live has no header row.");

  // Required columns (your current Live headers + mapping needs)
  assertHasColumns(liveHeaders, [
    "name",
    "alumniId",
    "email",
    "slug",
    "pronouns",
    "roles",
    "location",
    "currentWork",
    "bioShort",
    "bioLong",
    "website",
    "instagram",
    "youtube",
    "vimeo",
    "imdb",
    "spotlight",
    "programs",
    "tags",
    "statusFlags",
    "isPublic",
    "status",
    "updatedAt",
    "currentHeadshotId",
    "currentHeadshotUrl",
    "featuredAlbumId",
    "featuredReelId",
    "featuredEventId",
  ]);

  // Build live objects
  const liveObjects: LiveRow[] = liveRowsRaw.map((r) => {
    const obj: LiveRow = {};
    for (let i = 0; i < liveHeaders.length; i++) obj[liveHeaders[i]] = norm(r?.[i]);
    return obj;
  });

  // alumniId -> row idx
  const liveIndexById = new Map<string, number>();
  for (let i = 0; i < liveObjects.length; i++) {
    const id = normSlug(liveObjects[i]["alumniId"]);
    if (id && !liveIndexById.has(id)) liveIndexById.set(id, i);
  }

  // column -> index
  const liveColIndex = new Map<string, number>();
  for (let i = 0; i < liveHeaders.length; i++) liveColIndex.set(liveHeaders[i], i);

  // Working matrix we will write back (starting from existing values)
  const outRowsMatrix: string[][] = liveRowsRaw.map((r) => {
    const row = new Array(liveHeaders.length).fill("");
    for (let i = 0; i < liveHeaders.length; i++) row[i] = norm(r?.[i]);
    return row;
  });

  const changesToAppend: string[][] = [];

  // Stats
  let touchedRows = 0;
  let changedCells = 0;
  let skippedNoId = 0;
  let appendedNewLiveRows = 0;
  let updatedExistingLiveRows = 0;

  function getOrCreateRowByAlumniId(alumniId: string) {
    const key = normSlug(alumniId);
    const hit = liveIndexById.get(key);
    if (hit !== undefined) return { idx0: hit, isNew: false };

    const blank = new Array(liveHeaders.length).fill("");
    outRowsMatrix.push(blank);
    const newIdx0 = outRowsMatrix.length - 1;

    liveIndexById.set(key, newIdx0);
    liveObjects.push({}); // keep aligned; “before” is blank
    appendedNewLiveRows++;

    return { idx0: newIdx0, isNew: true };
  }

  function getCell(rowIdx0: number, col: string) {
    const c = liveColIndex.get(col);
    if (c === undefined) return "";
    return norm(outRowsMatrix[rowIdx0]?.[c]);
  }

  function setCell(rowIdx0: number, col: string, val: string) {
    const c = liveColIndex.get(col);
    if (c === undefined) return;
    outRowsMatrix[rowIdx0][c] = val;
  }

  for (const src of dataObjects) {
    const alumniId = buildAlumniId(src);
    const slug = buildCanonicalSlug(src);
    if (!alumniId) {
      skippedNoId++;
      continue;
    }

    const { idx0, isNew } = getOrCreateRowByAlumniId(alumniId);

    const beforeEmail = getCell(idx0, "email");

    const socials = parseSocials(norm(src["Artist Social Links"]));
    const lastModifiedRaw = norm(src["lastModified"]);
const srcUpdatedAt =
  lastModifiedRaw && looksLikeDate(lastModifiedRaw)
    ? new Date(lastModifiedRaw).toISOString()
    : "";

// Only advance updatedAt when it’s empty in Live, or source has a newer timestamp.
// (Never use nowIso() as a fallback — that causes “always dirty” runs.)
const liveUpdatedAt = getCell(idx0, "updatedAt");
const shouldSetUpdatedAt =
  !liveUpdatedAt ||
  (srcUpdatedAt &&
    (!looksLikeDate(liveUpdatedAt) ||
      Date.parse(srcUpdatedAt) > Date.parse(liveUpdatedAt)));

const updatedAt = shouldSetUpdatedAt ? (srcUpdatedAt || liveUpdatedAt || "") : liveUpdatedAt;


    // Mapping (80/20)
    const next: LiveRow = {
      alumniId,
      slug,

      name: norm(src["Name"]),
      roles: norm(src["Role"]),
      location: norm(src["Location"]),
      currentHeadshotUrl: norm(src["Headshot URL"]),
      email: norm(src["Artist Email"]),
      website: norm(src["Artist URL"]),
      currentWork: norm(src["Current Work"]),
      bioLong: norm(src["Artist Statement"]),

      instagram: socials.instagram,
      youtube: socials.youtube,
      vimeo: socials.vimeo,
      imdb: socials.imdb,

      statusFlags: norm(src["Status Signifier"]),
      isPublic: toBoolCell(norm(src["Show on Profile?"])),
      updatedAt,
    };

    // Safe default for new rows
    if (isNew) {
      const curStatus = getCell(idx0, "status");
      if (!curStatus) setCell(idx0, "status", "pending");
    }

    let rowChanged = false;
    const ts = nowIso();
    const emailForLog = norm(next.email || beforeEmail);

    for (const [field, afterRaw] of Object.entries(next)) {
  if (!liveColIndex.has(field)) continue;

  const before = getCell(idx0, field);
  const after = norm(afterRaw);

  // ✅ Special-case: Sheets returns booleans as true/false when UNFORMATTED_VALUE is used
  if (field === "isPublic") {
    const b0 = boolish(before);
    const b1 = boolish(after);
    if (b0 !== null && b1 !== null && b0 === b1) continue;
  }

  if (!shouldUpdateCell(before, after)) continue;

  setCell(idx0, field, after);
  changesToAppend.push([ts, normSlug(alumniId), emailForLog, field, before, after]);

  changedCells++;
  rowChanged = true;
}


    if (rowChanged) {
      touchedRows++;
      if (!isNew) updatedExistingLiveRows++;
    }
  }

  await ensureChangesHeader({ sheets, spreadsheetId: SHEET_ID });

  await writeProfileLiveWholeSheet({
    sheets,
    spreadsheetId: SHEET_ID,
    liveHeaders,
    rowMatrix: outRowsMatrix,
  });

  await appendChanges({
    sheets,
    spreadsheetId: SHEET_ID,
    changeRows: changesToAppend,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        dryRun: DRY_RUN,
        touchedRows,
        changedCells,
        appendedChangeRows: changesToAppend.length,
        appendedNewLiveRows,
        updatedExistingLiveRows,
        skippedNoId,
      },
      null,
      2
    )
  );

  if (DRY_RUN) {
    console.log(
      `[migrate][dry-run] would write ${outRowsMatrix.length} Profile-Live rows (+ header) in 1 request, and append ${changesToAppend.length} Profile-Changes rows in 1 request.`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
