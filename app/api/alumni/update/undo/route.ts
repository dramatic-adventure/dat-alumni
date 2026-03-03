// /app/api/alumni/update/undo/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { requireAuth } from "@/lib/requireAuth";
import { getOwnerEmailForAlumniId, normalizeGmail } from "@/lib/ownership";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
const LIVE_TAB =
  process.env.ALUMNI_LIVE_TAB || process.env.ALUMNI_TAB || "Profile-Live";
const CHANGES_TAB = process.env.ALUMNI_CHANGES_TAB || "Profile-Changes";

function norm(s: unknown) {
  return String(s ?? "").trim();
}

function normLower(s: unknown) {
  return String(s ?? "").trim().toLowerCase();
}

const isTrue = (v: any) => normLower(v) === "true";

function idxOf(header: string[], keys: string[]) {
  const lower = header.map((h) => String(h || "").trim().toLowerCase());
  for (const k of keys) {
    const i = lower.indexOf(k.toLowerCase());
    if (i >= 0) return i;
  }
  return -1;
}

function cell(row: any[], idx: number) {
  return idx >= 0 ? String(row?.[idx] ?? "").trim() : "";
}

function tsNum(ts: string) {
  const n = Date.parse(ts);
  return Number.isFinite(n) ? n : 0;
}

function colToA1(colIdx0: number) {
  let n = colIdx0 + 1;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function tsISO() {
  return new Date().toISOString();
}

/** Load Profile-Live row by alumniId + find currentUpdateText col index */
async function loadLiveRow(alumniId: string) {
  if (!spreadsheetId) throw new Error("Missing ALUMNI_SHEET_ID");

  const sheets = sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${LIVE_TAB}!A:ZZ`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const all = (res.data.values ?? []) as any[][];
  if (all.length < 2) throw new Error("Profile sheet appears empty.");

  const header = (all[0] ?? []).map((h) => String(h ?? "").trim());
  const rows = all.slice(1);

  const alumniIdIdx = idxOf(header, ["alumniId", "alumniid", "id"]);
  if (alumniIdIdx < 0) throw new Error("Missing alumniId column on Profile sheet.");

  const rowIdx0 = rows.findIndex((r) => cell(r, alumniIdIdx) === alumniId);
  if (rowIdx0 < 0) throw new Error("Profile row not found for this alumniId.");

  const rowIndex1 = 2 + rowIdx0; // header row is 1, first data row is 2
  const row = rows[rowIdx0] ?? [];

  const currentUpdateTextIdx = idxOf(header, ["currentUpdateText"]);
  if (currentUpdateTextIdx < 0)
    throw new Error("Missing currentUpdateText column on Profile sheet.");

  const beforeText = cell(row, currentUpdateTextIdx);

  return { rowIndex1, currentUpdateTextIdx, beforeText };
}

async function writeLiveCurrentUpdate(
  rowIndex1: number,
  currentUpdateTextIdx: number,
  text: string
) {
  const sheets = sheetsClient();
  const col = colToA1(currentUpdateTextIdx);
  const range = `${LIVE_TAB}!${col}${rowIndex1}:${col}${rowIndex1}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[text]] },
  });
}

async function appendProfileChange(args: {
  alumniId: string;
  email?: string;
  field: string;
  before?: string;
  after?: string;
  ts: string;
  isUndone?: string; // keep blank normally; set "true" to suppress from feeds
}) {
  const sheets = sheetsClient();

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${CHANGES_TAB}!A:G`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          args.ts,
          args.alumniId,
          args.email ?? "",
          args.field,
          args.before ?? "",
          args.after ?? "",
          args.isUndone ?? "",
        ],
      ],
    },
  });
}

type Body = { id: string } | { alumniId: string; ts: string };

function parseIdOrBody(body: any): { alumniId: string; ts: string } {
  const id = norm(body?.id);

  if (id && id.includes("::")) {
    const parts = id.split("::");
    return { alumniId: norm(parts[0]), ts: norm(parts[1] || "") };
  }

  return { alumniId: norm(body?.alumniId), ts: norm(body?.ts) };
}

async function markChangeRowUndone(rowIndex1: number, isUndoneIdx: number) {
  if (rowIndex1 <= 1) return;
  if (isUndoneIdx < 0) return;

  const sheets = sheetsClient();
  const col = colToA1(isUndoneIdx);
  const range = `${CHANGES_TAB}!${col}${rowIndex1}:${col}${rowIndex1}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [["true"]] },
  });
}

async function findChangeRow(alumniId: string, ts: string) {
  const sheets = sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${CHANGES_TAB}!A:ZZ`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const all = (res.data.values ?? []) as any[][];
  if (all.length < 2) throw new Error("Changes sheet appears empty.");

  const header = (all[0] ?? []).map((h) => String(h ?? "").trim());
  const rows = all.slice(1);

  const tsIdx = idxOf(header, ["ts"]);
  const alumniIdIdx = idxOf(header, ["alumniId", "alumniid", "id"]);
  const emailIdx = idxOf(header, ["email"]);
  const fieldIdx = idxOf(header, ["field"]);
  const beforeIdx = idxOf(header, ["before"]);
  const afterIdx = idxOf(header, ["after"]);
  const isUndoneIdx = idxOf(header, ["isUndone", "isundone"]);

  if (alumniIdIdx < 0 || fieldIdx < 0)
    throw new Error("Changes sheet missing required columns.");

  const isUndoneAt = (r: any[]) => isTrue(cell(r, isUndoneIdx));

  const exactIdx0 = rows.findIndex((r) => {
    if (isUndoneAt(r)) return false;
    return (
      (ts ? cell(r, tsIdx) === ts : true) &&
      cell(r, alumniIdIdx) === alumniId &&
      cell(r, fieldIdx) === "currentUpdateText"
    );
  });

  if (exactIdx0 >= 0) {
    const r = rows[exactIdx0];
    return {
      rowIndex1: 2 + exactIdx0,
      isUndoneIdx,
      email: cell(r, emailIdx),
      before: cell(r, beforeIdx),
      after: cell(r, afterIdx),
      ts: cell(r, tsIdx),
    };
  }

  const candidates = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r }) => !isUndoneAt(r))
    .filter(
      ({ r }) =>
        cell(r, alumniIdIdx) === alumniId &&
        cell(r, fieldIdx) === "currentUpdateText"
    )
    .sort((a, b) => tsNum(cell(b.r, tsIdx)) - tsNum(cell(a.r, tsIdx)));

  const best = candidates[0];
  if (!best) throw new Error("No matching update found to undo.");

  return {
    rowIndex1: 2 + best.i,
    isUndoneIdx,
    email: cell(best.r, emailIdx),
    before: cell(best.r, beforeIdx),
    after: cell(best.r, afterIdx),
    ts: cell(best.r, tsIdx),
  };
}

export async function POST(req: Request) {
  if (!spreadsheetId) {
    return NextResponse.json(
      { ok: false, error: "Missing ALUMNI_SHEET_ID" },
      { status: 500 }
    );
  }

  // ✅ Auth gate
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

  let body: Body | any = null;
  try {
    body = (await req.json()) as any;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseIdOrBody(body);
  const alumniId = norm(parsed.alumniId);
  const ts = norm(parsed.ts);

  if (!alumniId) {
    return NextResponse.json(
      { ok: false, error: "Missing alumniId/id" },
      { status: 400 }
    );
  }

  // ✅ Ownership gate
  if (!auth.isAdmin) {
    const ownerEmail = await getOwnerEmailForAlumniId(spreadsheetId, alumniId);
    if (!ownerEmail) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
    if (normalizeGmail(auth.email) !== normalizeGmail(ownerEmail)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const change = await findChangeRow(alumniId, ts);

    const target = norm(change.before);

    const live = await loadLiveRow(alumniId);
    const liveNow = norm(live.beforeText);

    if (liveNow === target) {
      await markChangeRowUndone(change.rowIndex1, change.isUndoneIdx);
      return NextResponse.json({ ok: true, alreadyUndone: true }, { status: 200 });
    }

    await writeLiveCurrentUpdate(live.rowIndex1, live.currentUpdateTextIdx, target);

    await markChangeRowUndone(change.rowIndex1, change.isUndoneIdx);

    const tsNow = tsISO();
    await appendProfileChange({
      ts: tsNow,
      alumniId,
      email: auth.email, // ✅ record who performed the undo
      field: "currentUpdateText",
      before: liveNow,
      after: target,
      isUndone: "true",
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: String(err?.message || "Undo failed") },
      { status: 500 }
    );
  }
}