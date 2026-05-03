// lib/loadSpotlightsFromSheet.ts
import "server-only";
import { sheetsClient } from "@/lib/googleClients";

const SHEET_ID = process.env.ALUMNI_SHEET_ID || "";
const TAB = "Spotlights & Highlights";

// Column order matches the sheet headers exactly
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
] as const;

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
  all: SpotlightRow[];
}> {
  if (!SHEET_ID) {
    return { spotlights: [], highlights: [], all: [] };
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
    range: `${TAB}!A:O`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const values = (res.data.values ?? []) as string[][];
  if (values.length < 2) return { spotlights: [], highlights: [], all: [] };

  const rawHeader = (values[0] ?? []).map((h) => String(h ?? "").trim());
  const dataRows = values.slice(1);

  const rawRows: SpotlightRow[] = dataRows
    .map((row) => rowToObj(rawHeader, row))
    .filter((r) => aliasSet.has(norm(r.profileSlug ?? "")))
    .map((r) => ({
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

  const spotlights = rows.filter((r) => isSpotlightType(r.type));
  const highlights = rows.filter((r) => isHighlightType(r.type));

  return { spotlights, highlights, all: rows };
}

export async function appendSpotlightRow(row: Omit<SpotlightRow, "evergreen" | "featured"> & {
  evergreen: boolean;
  featured: boolean;
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
    range: `${TAB}!A:O`,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values },
  });
}
