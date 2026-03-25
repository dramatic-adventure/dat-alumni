// /app/api/alumni/update/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { sheetsClient } from "@/lib/googleClients";
import { isDatGold } from "@/lib/updateStarters";
import { requireAuth } from "@/lib/requireAuth";
import { getOwnerEmailForAlumniId, normalizeGmail } from "@/lib/ownership";

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
const UPDATE_EXPIRE_DAYS = 90;

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

function addDaysYYYYMMDD(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  // store as YYYY-MM-DD (Live sheet friendly)
  return d.toISOString().slice(0, 10);
}

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

  const currentUpdateExpiresAtIdx = idxOf(header, ["currentUpdateExpiresAt"]);

  const nameIdx = idxOf(header, ["name", "fullName", "fullname"]);
  const slugIdx = idxOf(header, ["slug"]);

  const beforeText = cell(row, currentUpdateTextIdx);
  const beforeExpiresAt = cell(row, currentUpdateExpiresAtIdx);

  return {
    header,
    row,
    rowIndex1,
    currentUpdateTextIdx,
    currentUpdateExpiresAtIdx,
    identity: {
      name: cell(row, nameIdx) || "Unknown",
      slug: cell(row, slugIdx) || alumniId,
    },
    beforeText,
    beforeExpiresAt,
  };
}

async function writeLiveCell(rowIndex1: number, colIdx0: number, value: string) {
  if (!spreadsheetId) throw new Error("Missing ALUMNI_SHEET_ID");

  const sheets = sheetsClient();
  const col = colToA1(colIdx0);
  const range = `${LIVE_TAB}!${col}${rowIndex1}:${col}${rowIndex1}`;

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values: [[value]] },
  });
}

async function appendProfileChange(args: {
  alumniId: string;
  email?: string; // keep header name "email" but store editor session email
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

async function appendTestimonialRow(row: {
  timestamp: string;
  alumniId: string;
  name: string;
  email: string; // editor email for internal follow-up if desired
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

  // ✅ Auth gate FIRST
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;

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

  // ✅ Ownership gate BEFORE touching Profile-Live
  if (!auth.isAdmin) {
    const ownerEmail = await getOwnerEmailForAlumniId(spreadsheetId, alumniId);
    if (!ownerEmail) {
      return NextResponse.json(
        { ok: false, error: "This profile is not yet claimed. Please contact DAT." },
        { status: 403 }
      );
    }
    if (normalizeGmail(auth.email) !== normalizeGmail(ownerEmail)) {
      return NextResponse.json(
        { ok: false, error: "Forbidden: you may only update your own profile." },
        { status: 403 }
      );
    }
  }

  try {
    const live = await loadLiveRow(alumniId);
    const beforeText = (live.beforeText || "").trim();
    const beforeExp = (live.beforeExpiresAt || "").trim();
    const ts = tsISO();

    const nextExpiresAt = addDaysYYYYMMDD(UPDATE_EXPIRE_DAYS);
    const hasExpCol = live.currentUpdateExpiresAtIdx >= 0;

    // If same text: dedupe, but refresh expiry if possible
    if (beforeText && beforeText === text) {
      if (hasExpCol && beforeExp !== nextExpiresAt) {
        await writeLiveCell(live.rowIndex1, live.currentUpdateExpiresAtIdx, nextExpiresAt);
        await appendProfileChange({
          ts,
          alumniId,
          email: auth.email,
          field: "currentUpdateExpiresAt",
          before: beforeExp,
          after: nextExpiresAt,
        });
      }

      return NextResponse.json(
        { ok: true, deduped: true, id: `${alumniId}::${ts}`, ts, expiresAt: hasExpCol ? nextExpiresAt : undefined },
        { status: 200 }
      );
    }

    // 1) write text
    await writeLiveCell(live.rowIndex1, live.currentUpdateTextIdx, text);

    // 1b) write expiry (if column exists)
    if (hasExpCol) {
      await writeLiveCell(live.rowIndex1, live.currentUpdateExpiresAtIdx, nextExpiresAt);
    }

    // 2) changes (text)
    await appendProfileChange({
      ts,
      alumniId,
      email: auth.email,
      field: "currentUpdateText",
      before: beforeText,
      after: text,
    });

    // 2b) changes (expiry)
    if (hasExpCol) {
      await appendProfileChange({
        ts,
        alumniId,
        email: auth.email,
        field: "currentUpdateExpiresAt",
        before: beforeExp,
        after: nextExpiresAt,
      });
    }

    // 3) internal-only append (no response changes, no UI leakage)
    const shouldSendInternal = promptUsed ? isDatGold(promptUsed) : false;
    if (shouldSendInternal) {
      await appendTestimonialRow({
        timestamp: ts,
        alumniId,
        name: live.identity.name,
        email: auth.email, // editor email (not public)
        slug: live.identity.slug,
        full_text: text,
        prompt_used: promptUsed,
        is_DAT_gold: true,
      });
    }

    return NextResponse.json(
      { ok: true, deduped: false, id: `${alumniId}::${ts}`, ts, expiresAt: hasExpCol ? nextExpiresAt : undefined },
      { status: 200 }
    );
  } catch (err: any) {
    const msg = String(err?.message || "Update failed");
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