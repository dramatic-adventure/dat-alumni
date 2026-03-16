// lib/invites.ts
import "server-only";
import { randomBytes } from "crypto";
import { sheetsClient } from "@/lib/googleClients";

const SHEET_ID = process.env.ALUMNI_SHEET_ID!;
const INVITES_TAB = "Profile-Owner-Invites";
const OWNERS_TAB = "Profile-Owners";
const INVITE_DAYS = 30;

export type InviteRow = {
  token: string;
  alumniId: string;
  alumniName: string;
  createdAt: string;
  expiresAt: string;
  usedAt: string;
  usedByEmail: string;
};

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function normId(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

function normalizeGmail(raw: string) {
  const e = String(raw || "").trim().toLowerCase();
  const [user, domain] = e.split("@");
  if (!user || !domain) return e;
  const canon = domain === "googlemail.com" ? "gmail.com" : domain;
  if (canon !== "gmail.com") return `${user}@${canon}`;
  const noPlus = user.split("+")[0];
  const noDots = noPlus.replace(/\./g, "");
  return `${noDots}@gmail.com`;
}

// ── Header row ────────────────────────────────────────────────
const HEADERS = [
  "token",
  "alumniId",
  "alumniName",
  "createdAt",
  "expiresAt",
  "usedAt",
  "usedByEmail",
];

function rowToInvite(headers: string[], row: any[]): InviteRow {
  const idx = (k: string) => headers.indexOf(k);
  return {
    token: String(row[idx("token")] ?? "").trim(),
    alumniId: normId(row[idx("alumniId")] ?? ""),
    alumniName: String(row[idx("alumniName")] ?? "").trim(),
    createdAt: String(row[idx("createdAt")] ?? "").trim(),
    expiresAt: String(row[idx("expiresAt")] ?? "").trim(),
    usedAt: String(row[idx("usedAt")] ?? "").trim(),
    usedByEmail: String(row[idx("usedByEmail")] ?? "").trim(),
  };
}

// ── Read all invites from sheet ────────────────────────────────
async function readAllInvites(
  sheets: ReturnType<typeof sheetsClient>
): Promise<{ headers: string[]; rows: InviteRow[] }> {
  try {
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${INVITES_TAB}!A:G`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const vals = (resp.data.values ?? []) as any[][];
    if (vals.length < 1) return { headers: HEADERS, rows: [] };
    const [headerRow, ...dataRows] = vals;
    const headers = headerRow.map((h: any) => String(h ?? "").trim());
    const rows = dataRows.map((r) => rowToInvite(headers, r)).filter((r) => r.token);
    return { headers, rows };
  } catch {
    return { headers: HEADERS, rows: [] };
  }
}

// ── Read Profile-Owners to find already-claimed alumniIds ──────
async function readOwnedAlumniIds(
  sheets: ReturnType<typeof sheetsClient>
): Promise<Set<string>> {
  try {
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${OWNERS_TAB}!A:ZZ`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const vals = (resp.data.values ?? []) as any[][];
    if (vals.length < 2) return new Set();
    const [headerRow, ...rows] = vals;
    const headers = headerRow.map((h: any) => String(h ?? "").trim().toLowerCase());
    const idIdx = headers.findIndex((h) =>
      ["alumniid", "alumni id", "id"].includes(h)
    );
    if (idIdx === -1) return new Set();
    return new Set(rows.map((r) => normId(r[idIdx])).filter(Boolean));
  } catch {
    return new Set();
  }
}

// ── Ensure the invites tab has a header row ────────────────────
async function ensureInvitesHeader(
  sheets: ReturnType<typeof sheetsClient>
): Promise<void> {
  try {
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${INVITES_TAB}!A1:G1`,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    const firstRow = (resp.data.values ?? [])[0] ?? [];
    if (firstRow.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: `${INVITES_TAB}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [HEADERS] },
      });
    }
  } catch {
    // sheet may not exist yet — caller should handle
  }
}

// ── Generate invite tokens for a list of alumniIds ─────────────
export type GenerateResult = {
  alumniId: string;
  alumniName: string;
  status: "generated" | "renewed" | "already_owned" | "active_exists";
  inviteUrl: string;
  expiresAt: string;
  expiresAtFormatted: string;
};

export async function generateInvites(
  requests: { alumniId: string; alumniName: string }[],
  siteUrl: string
): Promise<GenerateResult[]> {
  const sheets = sheetsClient();
  await ensureInvitesHeader(sheets);

  const [{ rows: existingInvites }, ownedIds] = await Promise.all([
    readAllInvites(sheets),
    readOwnedAlumniIds(sheets),
  ]);

  const now = new Date();
  const results: GenerateResult[] = [];
  const newRows: any[][] = [];

  for (const { alumniId, alumniName } of requests) {
    const id = normId(alumniId);
    if (!id) continue;

    // Already has an owner — skip
    if (ownedIds.has(id)) {
      results.push({
        alumniId: id,
        alumniName,
        status: "already_owned",
        inviteUrl: "",
        expiresAt: "",
        expiresAtFormatted: "",
      });
      continue;
    }

    // Has an active (unexpired, unused) invite — skip
    const active = existingInvites.find(
      (r) =>
        r.alumniId === id &&
        !r.usedAt &&
        r.expiresAt &&
        new Date(r.expiresAt) > now
    );
    if (active) {
      results.push({
        alumniId: id,
        alumniName: active.alumniName || alumniName,
        status: "active_exists",
        inviteUrl: `${siteUrl}/alumni/update?invite=${active.token}`,
        expiresAt: active.expiresAt,
        expiresAtFormatted: formatExpiry(active.expiresAt),
      });
      continue;
    }

    // Generate a new token
    const token = randomBytes(24).toString("hex");
    const createdAt = now.toISOString();
    const expiresAt = addDays(now, INVITE_DAYS).toISOString();

    const isRenewal = existingInvites.some((r) => r.alumniId === id);
    newRows.push([token, id, alumniName, createdAt, expiresAt, "", ""]);

    results.push({
      alumniId: id,
      alumniName,
      status: isRenewal ? "renewed" : "generated",
      inviteUrl: `${siteUrl}/alumni/update?invite=${token}`,
      expiresAt,
      expiresAtFormatted: formatExpiry(expiresAt),
    });
  }

  // Append all new rows in one call
  if (newRows.length > 0) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${INVITES_TAB}!A:G`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: newRows },
    });
  }

  return results;
}

// ── Redeem a token ─────────────────────────────────────────────
export type RedeemResult =
  | { ok: true; alumniId: string; alumniName: string }
  | { ok: false; reason: "invalid" | "expired" | "already_used" | "already_owned" };

export async function redeemInviteToken(
  token: string,
  email: string
): Promise<RedeemResult> {
  const sheets = sheetsClient();
  const nEmail = normalizeGmail(email);
  const nToken = token.trim();

  const { headers, rows } = await readAllInvites(sheets);
  const match = rows.find((r) => r.token === nToken);

  if (!match) return { ok: false, reason: "invalid" };
  if (match.usedAt) return { ok: false, reason: "already_used" };
  if (new Date(match.expiresAt) < new Date()) return { ok: false, reason: "expired" };

  // Check if alumni already has an owner
  const ownedIds = await readOwnedAlumniIds(sheets);
  if (ownedIds.has(match.alumniId)) return { ok: false, reason: "already_owned" };

  // Write to Profile-Owners
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${OWNERS_TAB}!A:B`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [[match.alumniId, nEmail]] },
  });

  // Mark token as used — find its row index (1-based, +1 for header)
  const rowIndex = rows.indexOf(match) + 2; // +1 for header, +1 for 1-based
  const usedAtIdx = headers.indexOf("usedAt");
  const usedByEmailIdx = headers.indexOf("usedByEmail");
  const usedAtCol = String.fromCharCode(65 + usedAtIdx); // A=65
  const usedByCol = String.fromCharCode(65 + usedByEmailIdx);
  const usedAt = new Date().toISOString();

  await Promise.all([
    sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${INVITES_TAB}!${usedAtCol}${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [[usedAt]] },
    }),
    sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${INVITES_TAB}!${usedByCol}${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values: [[nEmail]] },
    }),
  ]);

  return { ok: true, alumniId: match.alumniId, alumniName: match.alumniName };
}
