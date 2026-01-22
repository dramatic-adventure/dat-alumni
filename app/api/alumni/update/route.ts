// /app/api/alumni/update/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { isDatGold } from "@/lib/updateStarters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  alumniId: string;
  text: string;
  promptUsed?: string;
};

const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";

const LIVE_TAB = process.env.ALUMNI_LIVE_TAB || process.env.ALUMNI_TAB || "Profile-Live";
const CHANGES_TAB = process.env.ALUMNI_CHANGES_TAB || "Profile-Changes";

// internal-only (no UI leakage)
const TESTIMONIALS_TAB = process.env.DAT_TESTIMONIALS_TAB || "DAT_Testimonials";
const TESTIMONIALS_SHEET_ID = process.env.DAT_TESTIMONIALS_SHEET_ID || ""; // optional override

const MAX_CHARS = 280;

function tsISO() {
  return new Date().toISOString();
}

function norm(s: unknown) {
  return String(s ?? "").trim();
}

function normalizeNewlines(s: string) {
  return String(s ?? "").replace(/\r\n/g, "\n");
}

function clamp(s: string, max: number) {
  return s.length > max ? s.slice(0, max) : s;
}

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

/**
 * Loads Profile-Live sheet, finds row by alumniId, and returns:
 * - rowIndex1 (1-based row number in sheet)
 * - header + row
 * - identity fields (best effort)
 * - beforeText (currentUpdateText)
 */
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

  const rowIndex1 = 2 + rowIdx0;
  const row = rows[rowIdx0] ?? [];

  const currentUpdateTextIdx = idxOf(header, ["currentUpdateText"]);
  if (currentUpdateTextIdx < 0)
    throw new Error("Missing currentUpdateText column on Profile sheet.");

  const nameIdx = idxOf(header, ["name", "fullName", "fullname"]);
  const slugIdx = idxOf(header, ["slug"]);
  const emailIdx = idxOf(header, ["email"]);

  const beforeText = cell(row, currentUpdateTextIdx);

  return {
    header,
    row,
    rowIndex1,
    currentUpdateTextIdx,
    identity: {
      name: cell(row, nameIdx) || "Unknown",
      slug: cell(row, slugIdx) || alumniId,
      email: cell(row, emailIdx) || "",
    },
    beforeText,
  };
}

async function writeLiveCurrentUpdate(
  rowIndex1: number,
  currentUpdateTextIdx: number,
  text: string
) {
  if (!spreadsheetId) throw new Error("Missing ALUMNI_SHEET_ID");

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
}) {
  if (!spreadsheetId) throw new Error("Missing ALUMNI_SHEET_ID");

  const sheets = sheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${CHANGES_TAB}!A:F`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [args.ts, args.alumniId, args.email ?? "", args.field, args.before ?? "", args.after ?? ""],
      ],
    },
  });
}

/**
 * Internal-only sink. Never referenced in UI strings or responses.
 */
async function appendTestimonialRow(row: {
  timestamp: string;
  alumniId: string;
  name: string;
  email: string;
  slug: string;
  full_text: string;
  prompt_used: string;
  is_DAT_gold: boolean;
}) {
  const targetSpreadsheetId = TESTIMONIALS_SHEET_ID || spreadsheetId;
  if (!targetSpreadsheetId) throw new Error("Missing sheet id for internal append.");

  const sheets = sheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: targetSpreadsheetId,
    range: `${TESTIMONIALS_TAB}!A:K`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          row.timestamp,
          row.alumniId,
          row.name,
          row.email,
          row.slug,
          row.full_text,
          row.prompt_used,
          row.is_DAT_gold ? "TRUE" : "FALSE",
          "", // testimonial_score
          "", // themes
          "FALSE", // reviewed
        ],
      ],
    },
  });
}

export async function POST(req: Request) {
  if (!spreadsheetId) {
    return NextResponse.json({ ok: false, error: "Missing ALUMNI_SHEET_ID" }, { status: 500 });
  }

  let body: Body | null = null;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const alumniId = norm(body?.alumniId);
  const rawText = normalizeNewlines(String(body?.text ?? ""));
  const text = clamp(rawText, MAX_CHARS).trim();
  const promptUsed = norm(body?.promptUsed || "");

  if (!alumniId) {
    return NextResponse.json({ ok: false, error: "Missing alumniId" }, { status: 400 });
  }
  if (!text) {
    return NextResponse.json({ ok: false, error: "Empty update" }, { status: 400 });
  }

  try {
    const live = await loadLiveRow(alumniId);
    const before = (live.beforeText || "").trim();

    // Dedupe only on exact match
    if (before && before === text) {
      const ts = tsISO();
      return NextResponse.json(
        {
          ok: true,
          deduped: true,
          id: `${alumniId}::${ts}`, // still return a usable id for client logic
        },
        { status: 200 }
      );
    }

    // 1) write
    await writeLiveCurrentUpdate(live.rowIndex1, live.currentUpdateTextIdx, text);

    // 2) changes
    const ts = tsISO();
    await appendProfileChange({
      ts,
      alumniId,
      email: live.identity.email || undefined,
      field: "currentUpdateText",
      before,
      after: text,
    });

    // 3) internal-only append (no response changes, no UI leakage)
    const shouldSendInternal = promptUsed ? isDatGold(promptUsed) : false;
    if (shouldSendInternal) {
      await appendTestimonialRow({
        timestamp: ts,
        alumniId,
        name: live.identity.name,
        email: live.identity.email,
        slug: live.identity.slug,
        full_text: text,
        prompt_used: promptUsed,
        is_DAT_gold: true,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        deduped: false,
        id: `${alumniId}::${ts}`, // ✅ critical for Undo
        ts, // optional, handy for debugging
      },
      { status: 200 }
    );
  } catch (err: any) {
    const msg = String(err?.message || "Update failed");

    // user-facing hints WITHOUT internal tab names
    const lower = msg.toLowerCase();
    const hint =
      lower.includes("currentupdatetext")
        ? `Missing required column: currentUpdateText.`
        : lower.includes("row not found")
        ? `That profile could not be found. Confirm the alumniId exists and matches exactly.`
        : lower.includes("permission")
        ? `Permission error: confirm your service account has edit access to the spreadsheet.`
        : "";

    return NextResponse.json({ ok: false, error: msg, hint }, { status: 500 });
  }
}
