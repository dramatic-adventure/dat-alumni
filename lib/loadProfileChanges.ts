// lib/loadProfileChanges.ts
import "server-only";
import { sheetsClient } from "@/lib/googleClients";

export type ProfileChangeRow = {
  ts: string;
  alumniId: string;
  email?: string;
  field: string;
  before?: string;
  after?: string;
  isUndone?: string; // ✅ new
};

const spreadsheetId = process.env.ALUMNI_SHEET_ID || "";
const CHANGES_TAB = process.env.ALUMNI_CHANGES_TAB || "Profile-Changes";

function tsNum(ts: string) {
  const n = Date.parse(ts);
  return Number.isFinite(n) ? n : 0;
}

function norm(v: any) {
  return String(v ?? "").trim();
}

function isTrue(v: any) {
  return norm(v).toLowerCase() === "true";
}

function idxOf(header: string[], keys: string[]) {
  const lower = header.map((h) => norm(h).toLowerCase());
  for (const k of keys) {
    const i = lower.indexOf(k.toLowerCase());
    if (i >= 0) return i;
  }
  return -1;
}

export async function loadProfileChanges(days = 14): Promise<ProfileChangeRow[]> {
  if (!spreadsheetId) throw new Error("Missing ALUMNI_SHEET_ID");

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const sheets = sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    // ✅ Pull more columns so we can read isUndone (and stay future-proof)
    range: `${CHANGES_TAB}!A:ZZ`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const all = (res.data.values ?? []) as any[][];
  if (all.length < 2) return [];

  const header = (all[0] ?? []).map((h) => norm(h));
  const rows = all.slice(1);

  // Expected header: ts alumniId email field before after isUndone
  const iTs = idxOf(header, ["ts", "timestamp"]);
  const iId = idxOf(header, ["alumniId", "alumniid", "id"]);
  const iEmail = idxOf(header, ["email"]);
  const iField = idxOf(header, ["field"]);
  const iBefore = idxOf(header, ["before"]);
  const iAfter = idxOf(header, ["after"]);
  const iIsUndone = idxOf(header, ["isUndone", "isundone", "undone"]);

  const out: ProfileChangeRow[] = [];

  for (const r of rows) {
    const ts = iTs >= 0 ? norm(r?.[iTs]) : "";
    const alumniId = iId >= 0 ? norm(r?.[iId]) : "";
    const field = iField >= 0 ? norm(r?.[iField]) : "";
    if (!ts || !alumniId || !field) continue;

    const t = tsNum(ts);
    if (t && t < cutoff) continue;

    // ✅ If this change row was undone, it should NOT appear in the feed.
    const undone = iIsUndone >= 0 ? norm(r?.[iIsUndone]) : "";
    if (isTrue(undone)) continue;

    out.push({
      ts,
      alumniId,
      email: iEmail >= 0 ? norm(r?.[iEmail]) || undefined : undefined,
      field,
      before: iBefore >= 0 ? norm(r?.[iBefore]) || undefined : undefined,
      after: iAfter >= 0 ? norm(r?.[iAfter]) || undefined : undefined,
      isUndone: undone || undefined,
    });
  }

  // newest first
  out.sort((a, b) => tsNum(b.ts) - tsNum(a.ts));
  return out;
}
