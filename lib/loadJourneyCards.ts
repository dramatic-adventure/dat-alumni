// lib/loadJourneyCards.ts
//
// Dedicated data layer for Journey Cards — its OWN store, separate from
// "Spotlights & Highlights". Reads/writes the "Journey Cards" tab in the alumni
// spreadsheet (ALUMNI_SHEET_ID). A Journey Card has first-class columns and its
// own soft-delete via the `status` column ("live" | "removed"); it does NOT use
// the Spotlights `hidden` column.
//
// Append-only writes (mirrors the spotlight pattern): edits/takedowns append a
// new row; the loader de-dupes by `id`, last-row-wins, so the newest row
// decides the card's content and visibility.

import "server-only";
import { sheetsClient } from "@/lib/googleClients";
import {
  journeyCardRowToCard,
  type JourneyCard,
  type JourneyCardRow,
} from "@/lib/journeyCard";

const SHEET_ID = process.env.ALUMNI_SHEET_ID || "";
const TAB = "Journey Cards";

// Canonical column order for the "Journey Cards" tab. Mirrors JourneyCardRow.
// 23 columns → A:W ("chaptersJson" appended in Slice 6; rows written before it
// simply have a blank cell and parse to no chapters).
const HEADERS = [
  "id",
  "profileSlug",
  "programId",
  "program",
  "location",
  "country",
  "year",
  "title",
  "primaryRole",
  "pullQuote",
  "heroUrl",
  "accent",
  "dates",
  "body",
  "mediaUrls",
  "ctaText",
  "ctaUrl",
  "featured",
  "sortDate",
  "status",
  "removalReason",
  "createdAt",
  "chaptersJson",
] as const;

const RANGE = `${TAB}!A:W`;

function coerceBool(v: unknown): boolean {
  return ["1", "true", "yes", "y"].includes(String(v ?? "").trim().toLowerCase());
}

function norm(s: unknown): string {
  return String(s ?? "").trim().toLowerCase();
}

/**
 * Normalize a date cell back to ISO "YYYY-MM-DD". The append path writes with
 * USER_ENTERED, so Sheets parses "2026-07-02" into a real date cell — which an
 * UNFORMATTED_VALUE read then returns as a day-serial number (e.g. 45658,
 * days since 1899-12-30). Left raw, serials break byNewest's string compare
 * against ISO values (retroactive backdating made this visible; V1's own
 * sortDate writes had the same latent conversion). Non-numeric values pass
 * through untouched.
 */
function dateCellToIso(raw: string): string {
  const s = String(raw ?? "").trim();
  if (!/^\d{1,6}(\.\d+)?$/.test(s)) return s;
  const serial = Number(s);
  // Only convert plausible modern day-serials (~1954–2118). A bare year like
  // "2026" (or any ≤4-digit value) is left alone — it's a label, not a date.
  if (!Number.isFinite(serial) || serial < 20_000 || serial > 80_000) return s;
  // Sheets epoch: 1899-12-30 (accounts for the historic Lotus leap-year bug).
  const ms = Date.UTC(1899, 11, 30) + serial * 86_400_000;
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return s;
  return d.toISOString().slice(0, 10);
}

function rowToObj(header: string[], row: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (let i = 0; i < header.length; i++) {
    obj[header[i]] = String(row[i] ?? "").trim();
  }
  return obj;
}

function toRow(r: Record<string, string>): JourneyCardRow {
  return {
    id: r.id ?? "",
    profileSlug: r.profileSlug ?? "",
    programId: r.programId ?? "",
    program: r.program ?? "",
    location: r.location ?? "",
    country: r.country ?? "",
    year: r.year ?? "",
    title: r.title ?? "",
    primaryRole: r.primaryRole ?? "",
    pullQuote: r.pullQuote ?? "",
    heroUrl: r.heroUrl ?? "",
    accent: r.accent ?? "",
    dates: r.dates ?? "",
    body: r.body ?? "",
    mediaUrls: r.mediaUrls ?? "",
    ctaText: r.ctaText ?? "",
    ctaUrl: r.ctaUrl ?? "",
    featured: coerceBool(r.featured),
    sortDate: dateCellToIso(r.sortDate ?? ""),
    status: r.status ?? "",
    removalReason: r.removalReason ?? "",
    createdAt: dateCellToIso(r.createdAt ?? ""),
    chaptersJson: r.chaptersJson ?? "",
  };
}

const byNewest = (a: JourneyCardRow, b: JourneyCardRow) =>
  String(b.sortDate || b.createdAt || "").localeCompare(String(a.sortDate || a.createdAt || ""));

/**
 * Read every row from the "Journey Cards" tab, de-duped by `id` (last-row-wins).
 * Returns [] if the sheet/tab is missing or unconfigured — reads are resilient
 * so the public surfaces render an empty state rather than erroring before the
 * tab exists.
 */
async function readAllRows(): Promise<JourneyCardRow[]> {
  if (!SHEET_ID) return [];

  const sheets = sheetsClient();
  let values: string[][] = [];
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: RANGE,
      valueRenderOption: "UNFORMATTED_VALUE",
    });
    values = (res.data.values ?? []) as string[][];
  } catch (err: any) {
    // Most commonly: the "Journey Cards" tab doesn't exist yet (Sheets returns a
    // 400 "Unable to parse range"). Treat as empty rather than failing the page.
    console.warn("[loadJourneyCards] read failed (tab may not exist yet):", err?.message ?? err);
    return [];
  }

  if (values.length < 2) return [];

  const rawHeader = (values[0] ?? []).map((h) => String(h ?? "").trim());
  // Tolerate a header whose columns differ in case but match by name; fall back
  // to the canonical HEADERS order when the sheet header is blank/short.
  const header = rawHeader.length >= HEADERS.length ? rawHeader : [...HEADERS];

  const rows = values
    .slice(1)
    .map((row) => toRow(rowToObj(header, row)))
    .filter((r) => r.id || r.profileSlug); // skip blank rows

  // De-dupe by id, last-row-wins (newest append decides content + visibility).
  const seen = new Map<string, JourneyCardRow>();
  for (const r of rows) {
    const key = norm(r.id) || `${norm(r.profileSlug)}::${norm(r.title)}`;
    seen.set(key, r);
  }
  return Array.from(seen.values());
}

/**
 * Live Journey Cards for one alumni profile, newest first.
 * Accepts slug aliases so cards written before a slug change still match.
 */
export async function loadJourneyCardsForSlug(
  profileSlug: string,
  slugAliases?: Set<string> | string[]
): Promise<JourneyCard[]> {
  const aliasSet = new Set<string>([norm(profileSlug)]);
  if (slugAliases) for (const a of slugAliases) aliasSet.add(norm(a));

  const rows = (await readAllRows())
    .filter((r) => aliasSet.has(norm(r.profileSlug)))
    .filter((r) => norm(r.status) !== "removed")
    .sort(byNewest);

  return rows.map(journeyCardRowToCard);
}

/** Every live Journey Card across all profiles, newest first (for the archive). */
export async function loadAllJourneyCards(): Promise<JourneyCard[]> {
  const rows = (await readAllRows())
    .filter((r) => norm(r.status) !== "removed")
    .sort(byNewest);
  return rows.map(journeyCardRowToCard);
}

/**
 * Admin/diagnostic read: every row including removed ones, de-duped by id.
 * Used by the takedown UI so staff can see + restore removed cards.
 */
export async function loadAllJourneyCardsIncludingRemoved(): Promise<JourneyCard[]> {
  const rows = (await readAllRows()).sort(byNewest);
  return rows.map(journeyCardRowToCard);
}

/** Find the latest row for a given card id (across all profiles). */
export async function findJourneyCardRowById(id: string): Promise<JourneyCardRow | null> {
  const key = norm(id);
  if (!key) return null;
  const rows = await readAllRows();
  return rows.find((r) => norm(r.id) === key) ?? null;
}

/** Append a Journey Card row to the tab. Throws if the sheet is unconfigured. */
export async function appendJourneyCard(row: JourneyCardRow): Promise<void> {
  if (!SHEET_ID) throw new Error("Missing ALUMNI_SHEET_ID");

  const sheets = sheetsClient();
  const values = [
    HEADERS.map((key) => {
      const v = (row as any)[key];
      if (typeof v === "boolean") return v ? "true" : "false";
      return String(v ?? "");
    }),
  ];

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: RANGE,
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values },
    });
  } catch (err: any) {
    // Surface a clear, actionable error when the tab hasn't been created yet.
    throw new Error(
      `Failed to append Journey Card — ensure a "${TAB}" tab exists in the alumni spreadsheet. Underlying error: ${err?.message ?? err}`
    );
  }
}

/**
 * Set a card's status ("live" | "removed") and removal reason by appending an
 * updated clone of its latest row (last-row-wins). Returns false if no row with
 * that id exists.
 */
export async function setJourneyCardStatus(params: {
  id: string;
  status: "live" | "removed";
  removalReason?: string;
}): Promise<boolean> {
  const existing = await findJourneyCardRowById(params.id);
  if (!existing) return false;

  await appendJourneyCard({
    ...existing,
    status: params.status,
    removalReason: params.status === "removed" ? params.removalReason ?? "" : "",
  });
  return true;
}
