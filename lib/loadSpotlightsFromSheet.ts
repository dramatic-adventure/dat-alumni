// lib/loadSpotlightsFromSheet.ts
import "server-only";
import { sheetsClient } from "@/lib/googleClients";

const SHEET_ID = process.env.ALUMNI_SHEET_ID || "";
const TAB = "Spotlights & Highlights";

// Column order matches the sheet headers exactly.
// `hidden` (column P) is appended after the original 15 columns. It is read by
// POSITION (HIDDEN_IDX) rather than by sheet-header name, so the sheet does NOT
// need a manually-added "hidden" header for soft-delete to work — older rows
// simply read as empty (= not hidden).
const HEADERS = [
  "profileSlug",
  "type",
  "title",
  "subtitle",
  "bodyNote",
  "mediaUrls",
  "mediaType",
  "eventDate",
  "evergreen",
  "expirationDate",
  "ctaText",
  "ctaUrl",
  "featured",
  "sortDate",
  "tags",
  "hidden",
] as const;

const HIDDEN_IDX = HEADERS.indexOf("hidden");

export type SpotlightRow = {
  profileSlug: string;
  type: string;
  title: string;
  subtitle: string;
  bodyNote: string;
  mediaUrls: string;
  mediaType: string;
  eventDate: string;
  evergreen: boolean;
  expirationDate: string;
  ctaText: string;
  ctaUrl: string;
  featured: boolean;
  sortDate: string;
  tags: string;
  /** Soft-delete flag — hidden rows are excluded from the visible spotlight/highlight lists. */
  hidden: boolean;
};

function coerceBool(v: string): boolean {
  return ["1", "true", "yes", "y"].includes(String(v ?? "").trim().toLowerCase());
}

function norm(s: string) {
  return String(s ?? "").trim().toLowerCase();
}

function rowToObj(header: string[], row: string[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (let i = 0; i < header.length; i++) {
    obj[header[i]] = String(row[i] ?? "").trim();
  }
  return obj;
}

function isSpotlightType(t: string): boolean {
  const n = norm(t);
  return (
    n === "dat spotlight" ||
    n === "spotlight" ||
    n === "dat-spotlight" ||
    n === "dat" // shorthand alias used in sheet
  );
}

function isHighlightType(t: string): boolean {
  const n = norm(t);
  return n === "highlight" || n === "highlights";
}

/**
 * Load spotlights/highlights for a profile.
 * Accepts a set of slug aliases so rows written before a slug change still match.
 */
export async function loadSpotlightsForSlug(
  profileSlug: string,
  slugAliases?: Set<string> | string[]
): Promise<{
  spotlights: SpotlightRow[];
  highlights: SpotlightRow[];
  hiddenSpotlights: SpotlightRow[];
  hiddenHighlights: SpotlightRow[];
  all: SpotlightRow[];
}> {
  if (!SHEET_ID) {
    return { spotlights: [], highlights: [], hiddenSpotlights: [], hiddenHighlights: [], all: [] };
  }

  // Build a normalized set of all slugs to match against
  const aliasSet = new Set<string>();
  aliasSet.add(norm(profileSlug));
  if (slugAliases) {
    for (const a of slugAliases) aliasSet.add(norm(a));
  }

  const sheets = sheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A:P`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const values = (res.data.values ?? []) as string[][];
  if (values.length < 2) return { spotlights: [], highlights: [], hiddenSpotlights: [], hiddenHighlights: [], all: [] };

  const rawHeader = (values[0] ?? []).map((h) => String(h ?? "").trim());
  const dataRows = values.slice(1);

  const rawRows: SpotlightRow[] = dataRows
    // Keep the raw array alongside the named-object view so `hidden` can be read
    // by POSITION (HIDDEN_IDX) even when the sheet has no "hidden" header cell.
    .map((row) => ({ r: rowToObj(rawHeader, row), raw: row }))
    .filter(({ r }) => aliasSet.has(norm(r.profileSlug ?? "")))
    .map(({ r, raw }) => ({
      profileSlug: r.profileSlug ?? "",
      type: r.type ?? "",
      title: r.title ?? "",
      subtitle: r.subtitle ?? "",
      bodyNote: r.bodyNote ?? "",
      mediaUrls: r.mediaUrls ?? "",
      mediaType: r.mediaType ?? "",
      eventDate: r.eventDate ?? "",
      evergreen: coerceBool(r.evergreen ?? ""),
      expirationDate: r.expirationDate ?? "",
      ctaText: r.ctaText ?? "",
      ctaUrl: r.ctaUrl ?? "",
      featured: coerceBool(r.featured ?? ""),
      sortDate: r.sortDate ?? "",
      tags: r.tags ?? "",
      // Prefer a named "hidden" header if the sheet has one, else fall back to position.
      hidden: coerceBool(
        r.hidden !== undefined && r.hidden !== ""
          ? r.hidden
          : String(raw[HIDDEN_IDX] ?? "")
      ),
    }));

  // Deduplicate by (type + title): since the POST API appends new rows rather than
  // updating existing ones, the sheet may contain multiple versions of the same item.
  // We iterate in sheet order and overwrite on each match, so the LAST row wins —
  // which is always the most recently edited/appended version.
  const seen = new Map<string, SpotlightRow>();
  for (const r of rawRows) {
    const key = `${norm(r.type)}::${norm(r.title)}`;
    seen.set(key, r); // later row overwrites earlier
  }
  const rows = Array.from(seen.values());

  // Soft-deleted (hidden) rows are kept out of the visible lists the profile
  // renders, but surfaced separately so the admin UI can offer a restore.
  const visible = rows.filter((r) => !r.hidden);
  const hidden = rows.filter((r) => r.hidden);

  const spotlights = visible.filter((r) => isSpotlightType(r.type));
  const highlights = visible.filter((r) => isHighlightType(r.type));
  const hiddenSpotlights = hidden.filter((r) => isSpotlightType(r.type));
  const hiddenHighlights = hidden.filter((r) => isHighlightType(r.type));

  return { spotlights, highlights, hiddenSpotlights, hiddenHighlights, all: rows };
}

export async function appendSpotlightRow(row: Omit<SpotlightRow, "evergreen" | "featured" | "hidden"> & {
  evergreen: boolean;
  featured: boolean;
  hidden?: boolean;
}): Promise<void> {
  if (!SHEET_ID) throw new Error("Missing ALUMNI_SHEET_ID");

  const sheets = sheetsClient();

  const values = [
    HEADERS.map((key) => {
      const v = (row as any)[key];
      if (typeof v === "boolean") return v ? "true" : "false";
      return String(v ?? "");
    }),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A:P`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}

/**
 * Permanently remove every row for a given (profileSlug + kind + title) from the
 * sheet — used by the "Delete permanently" action. Unlike soft-delete (which
 * appends a hidden row), this physically deletes the underlying rows, so all
 * append-history versions of the item are purged. Returns the number removed.
 */
export async function deleteSpotlightRows(params: {
  profileSlug: string;
  kind: "highlight" | "spotlight";
  title: string;
  slugAliases?: Set<string> | string[];
}): Promise<number> {
  if (!SHEET_ID) throw new Error("Missing ALUMNI_SHEET_ID");

  const aliasSet = new Set<string>();
  aliasSet.add(norm(params.profileSlug));
  if (params.slugAliases) {
    for (const a of params.slugAliases) aliasSet.add(norm(a));
  }
  const targetTitle = norm(params.title);
  const matchKind = params.kind === "spotlight" ? isSpotlightType : isHighlightType;

  const sheets = sheetsClient();

  // Row deletion needs the tab's numeric sheetId (gid), not just its title.
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: "sheets(properties(sheetId,title))",
  });
  const gid = (meta.data.sheets ?? []).find(
    (s) => s.properties?.title === TAB
  )?.properties?.sheetId;
  if (gid == null) throw new Error(`Tab not found: ${TAB}`);

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A:P`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });
  const values = (res.data.values ?? []) as string[][];
  if (values.length < 2) return 0;

  const rawHeader = (values[0] ?? []).map((h) => String(h ?? "").trim());

  // 0-based sheet row indices to delete (row 0 is the header, never matched).
  const indices: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const r = rowToObj(rawHeader, values[i]);
    if (!aliasSet.has(norm(r.profileSlug ?? ""))) continue;
    if (norm(r.title ?? "") !== targetTitle) continue;
    if (!matchKind(r.type ?? "")) continue;
    indices.push(i);
  }
  if (indices.length === 0) return 0;

  // Delete bottom-up so earlier indices remain valid as rows are removed.
  const requests = indices
    .sort((a, b) => b - a)
    .map((idx) => ({
      deleteDimension: {
        range: { sheetId: gid, dimension: "ROWS", startIndex: idx, endIndex: idx + 1 },
      },
    }));

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests },
  });

  return indices.length;
}
