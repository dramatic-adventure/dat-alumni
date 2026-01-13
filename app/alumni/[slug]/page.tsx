// app/alumni/[slug]/page.tsx

/**
 * ✅ Next.js 15 App Router
 * `params` and `searchParams` are plain objects (not Promises).
 */

import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  ensureCanonicalAlumniSlug,
  loadAlumniByAliases, // ← find the Profile-Data row by any alias
} from "@/lib/loadAlumni";
import { getAllStories } from "@/lib/loadRows";
import AlumniProfilePage from "@/components/alumni/AlumniProfilePage";
import { getSlugAliases, normSlug, resolveCanonicalSlug } from "@/lib/slugAliases";
import { filterRowsByAliases } from "@/lib/rowsByAliases";
import { loadCsv } from "@/lib/loadCsv";
import { normalizeEmbeddedRefs } from "@/lib/normalizeEmbeddedRefs";
import { rateLog, logOnce } from "@/lib/logHelpers";
import { CanonicalSlugGate } from "@/components/alumni/CanonicalSlugGate";

type PageProps = {
  params: { slug: string | string[] };
  searchParams?: Record<string, string | string[] | undefined>;
};

// Revalidate server-rendered page data periodically
export const revalidate = 60;

/* -----------------------------------------------------------
 * Page-level metadata (recommended in Next 15)
 * ----------------------------------------------------------*/
export async function generateMetadata(
  { params }: { params: { slug: string | string[] } }
): Promise<Metadata> {
  const raw = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const incoming = normSlug(decodeURIComponent(raw || ""));
  if (!incoming) {
    return {
      title: "Alumni Not Found | DAT",
      description: "This alumni profile could not be found.",
    };
  }

  // Resolve alias → canonical for the metadata/title + canonical URL
  const canonical = (await resolveCanonicalSlug(incoming)) || incoming;

  // Try to grab the human name for a nice <title>
  let name = "";
  try {
    const aliases = await getSlugAliases(canonical);
    const alum = await loadAlumniByAliases(aliases);
    name = alum?.name || "";
  } catch {
    // ignore
  }

  // Fallback prettified slug if no name yet
  const pretty =
    name ||
    canonical
      .split("-")
      .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
      .join(" ");

  return {
    title: `${pretty} | DAT Alumni`,
    description: `Discover the story of ${pretty} through Dramatic Adventure Theatre's alumni network.`,
    alternates: { canonical: `/alumni/${canonical}` },
  };
}

/* -----------------------------------------------------------
 * Helpers
 * ----------------------------------------------------------*/
function qsFrom(searchParams?: Record<string, string | string[] | undefined>) {
  if (!searchParams) return "";
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(searchParams)) {
    if (v == null) continue;
    if (Array.isArray(v)) for (const item of v) usp.append(k, item);
    else usp.set(k, v);
  }
  const s = usp.toString();
  return s ? `?${s}` : "";
}

type Row = Record<string, string>;

function parseCsv(text: string): Row[] {
  const rows: string[][] = [];
  let cell = "",
    row: string[] = [],
    inQ = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cell += '"';
          i++;
        } else inQ = false;
      } else cell += ch;
    } else {
      if (ch === '"') inQ = true;
      else if (ch === ",") {
        row.push(cell);
        cell = "";
      } else if (ch === "\n") {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      } else if (ch !== "\r") cell += ch;
    }
  }
  row.push(cell);
  rows.push(row);

  if (!rows.length) return [];
  const header = rows[0].map((h) =>
    (h || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")
  );

  const out: Row[] = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (!cells || cells.every((c) => c === "")) continue;
    const obj: Row = {};
    for (let c = 0; c < header.length; c++) {
      obj[header[c] || `col-${c}`] = (cells[c] ?? "").trim();
    }
    out.push(obj);
  }
  return out;
}

/* -----------------------------------------------------------
 * Google Drive + Sheets helpers
 * ----------------------------------------------------------*/
async function listDriveFiles(folderId: string, max = 40) {
  try {
    const { google } = await import("googleapis");
    const sa = JSON.parse(process.env.GCP_SA_JSON || "{}");
    const auth = new google.auth.JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes: ["https://www.googleapis.com/auth/drive.readonly"],
    });
    const drive = google.drive({ version: "v3", auth });

    const q =
      `'${folderId}' in parents and trashed = false and (` +
      `mimeType contains 'image/' or mimeType contains 'video/' or mimeType = 'application/pdf')`;

    const { data } = await drive.files.list({
      q,
      pageSize: Math.min(max, 100),
      fields:
        "files(id,name,mimeType,webViewLink,webContentLink,thumbnailLink),nextPageToken",
      includeItemsFromAllDrives: true,
      supportsAllDrives: true,
      orderBy: "createdTime desc",
    });

    const files = data.files || [];
    return files.map((f) => {
      const id = f.id!;
      const view = f.webViewLink || `https://drive.google.com/file/d/${id}/view`;
      const direct = `https://drive.google.com/uc?id=${id}`;
      const isImage = (f.mimeType || "").startsWith("image/");
      return isImage ? direct : view;
    });
  } catch (e) {
    rateLog(
      "drive-list-failed",
      undefined,
      60_000,
      "⚠️ [drive] list failed:",
      (e as Error)?.message || String(e)
    );
    return [];
  }
}

async function readCollectionsViaSheetsApi(): Promise<string> {
  const sheetId = process.env.ALUMNI_SHEET_ID || "";
  if (!sheetId) throw new Error("Missing ALUMNI_SHEET_ID");
  const tab = process.env.COLLECTIONS_TAB || "Profile-Collections";

  const { google } = await import("googleapis");
  const sa = JSON.parse(process.env.GCP_SA_JSON || "{}");
  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });
  const sheets = google.sheets({ version: "v4", auth });

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${tab}!A:Z`,
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  const values = (data.values || []) as string[][];
  if (!values.length) return "";

  const rows = values.map((r) =>
    r
      .map((cell = "") => {
        const s = String(cell ?? "");
        return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
      })
      .join(",")
  );
  return rows.join("\n");
}

/* -----------------------------------------------------------
 * Collections loader
 * ----------------------------------------------------------*/
async function loadCollectionsFor({
  aliases,
  alumniId,
}: {
  aliases: Set<string>;
  alumniId?: string;
}) {
  const candidates: string[] = [];

  if (process.env.NEXT_PUBLIC_COLLECTIONS_CSV_URL)
    candidates.push(process.env.NEXT_PUBLIC_COLLECTIONS_CSV_URL);
  if (process.env.COLLECTIONS_CSV_URL) candidates.push(process.env.COLLECTIONS_CSV_URL);

  const result = { imageUrls: [] as string[], posterUrls: [] as string[] };
  let csvText = "";

  for (const url of candidates) {
    try {
      logOnce(`collections-try:${url}`, undefined, "📦 [collections] trying:", url);
      csvText = await loadCsv(url, "collections.csv");
      if (csvText) break;
    } catch (e) {
      rateLog(
        "collections-failed",
        undefined,
        60_000,
        "⚠️ [collections] failed:",
        (e as Error)?.message || String(e)
      );
    }
  }

  if (!csvText) {
    try {
      logOnce(
        "collections-try-sheets",
        undefined,
        "📦 [collections] trying Sheets API fallback…"
      );
      csvText = await readCollectionsViaSheetsApi();
    } catch (e) {
      rateLog(
        "collections-sheets-failed",
        undefined,
        60_000,
        "⚠️ [collections] Sheets API fallback failed:",
        (e as Error)?.message || String(e)
      );
    }
  }

  if (!csvText) return result;
  const rows = parseCsv(csvText);

  const slugKeys = ["slug", "alumnislug", "profile-slug"];
  const idKeys = ["alumniid", "alumni-id", "artistid", "artist-id"];
  const typeKeys = ["type", "collection-type", "kind"];
  const urlKeys = ["url", "image-url", "src", "href"];
  const folderKeys = ["drivefolderid", "folderid", "drive-folder-id"];

  const pick = (r: Row, keys: string[]) => {
    for (const k of keys) if (k in r && r[k]) return r[k];
    return "";
  };

  const idLower = (alumniId || "").trim().toLowerCase();
  const images: string[] = [];
  const posters: string[] = [];
  const foldersToList = new Set<string>();

  for (const r of rows) {
    const rSlug = normSlug(pick(r, slugKeys));
    const rId = (pick(r, idKeys) || "").trim().toLowerCase();
    const matches = (rSlug && aliases.has(rSlug)) || (!!idLower && rId === idLower);
    if (!matches) continue;

    const t = (pick(r, typeKeys) || "").toLowerCase();
    const u = pick(r, urlKeys);
    const folderId = pick(r, folderKeys);

    if (u) {
      if (/(poster|keyart|one-sheet)/i.test(t)) posters.push(u);
      else images.push(u);
    } else if (folderId) foldersToList.add(folderId);
  }

  if (foldersToList.size) {
    for (const folderId of foldersToList) {
      const urls = await listDriveFiles(folderId, 50);
      for (const u of urls) {
        if (/(\.pdf($|\?))|poster|keyart|one-sheet/i.test(u)) posters.push(u);
        else images.push(u);
      }
    }
  }

  const dedupe = (arr: string[]) => Array.from(new Set(arr.filter(Boolean)));
  result.imageUrls = dedupe(images);
  result.posterUrls = dedupe(posters);
  return result;
}

/* -----------------------------------------------------------
 * Page
 * ----------------------------------------------------------*/
export default async function AlumniPage({ params, searchParams }: PageProps) {
  const raw = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const incoming = normSlug(decodeURIComponent(raw || ""));
  if (!incoming) return notFound();

  const suffix = qsFrom(searchParams);

  // 1) Resolve any alias → latest (canonical) for the URL (server redirect)
  const canonical = await resolveCanonicalSlug(incoming);
  if (canonical && canonical !== incoming) {
    rateLog("slug-forward-redirect", undefined, 60_000, "[slug] forward-redirect", {
      incoming,
      canonical,
    });
    // Best-effort write-through (harmless if disabled)
    ensureCanonicalAlumniSlug(incoming, canonical).catch(() => {});
    redirect(`/alumni/${encodeURIComponent(canonical)}${suffix}`);
  }

  // 2) Build the full alias set from the latest slug (includes original Profile-Data slug)
  const aliases = await getSlugAliases(canonical || incoming);

  // 3) Load the Profile-Data row by ANY alias so we don't rely on its slug changing
  const alumni = await loadAlumniByAliases(aliases);
  if (!alumni) return notFound();

  // 4) STORIES
  const allStories = await getAllStories();
  const storiesForThisAlum = filterRowsByAliases(allStories, aliases, alumni.name, {
    slugFields: ["slug", "alumniSlug", "profileSlug", "authorSlug"],
    nameFields: ["name", "alumniName", "author", "authorName"],
    akaFields: ["aka", "aliases", "previousNames", "formerNames"],
  });

  // 5) COLLECTIONS
  const alumniId =
    (alumni as any).alumniId || (alumni as any).id || (alumni as any).recordId || "";
  const coll = await loadCollectionsFor({
    aliases,
    alumniId: String(alumniId || ""),
  });

  const mergedImageUrls =
    (coll.imageUrls.length ? coll.imageUrls : (alumni as any).imageUrls) || [];
  const mergedPosterUrls =
    (coll.posterUrls.length ? coll.posterUrls : (alumni as any).posterUrls) || [];

  // 6) Normalize embedded slugs/names
  const nameAliases = new Set<string>();
  const pushNameAliases = (val: unknown) => {
    if (!val) return;
    String(val)
      .split(/[,\|]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((a) => nameAliases.add(a));
  };
  pushNameAliases((alumni as any).aka);
  pushNameAliases((alumni as any).previousNames);
  pushNameAliases((alumni as any).formerNames);
  pushNameAliases((alumni as any).aliases);

  const normalizedAlumni = normalizeEmbeddedRefs(alumni, {
    canonicalSlug: (alumni as any).slug || canonical || incoming,
    aliases,
    alsoNormalizeNames: true,
    nameAliases,
    canonicalName: (alumni as any).name,
  });

  // Ensure artistStatement is a proper string (avoid comma-joined arrays)
  const safeArtistStatement =
    typeof (normalizedAlumni as any).artistStatement === "string"
      ? (normalizedAlumni as any).artistStatement
      : Array.isArray((normalizedAlumni as any).artistStatement)
        ? ((normalizedAlumni as any).artistStatement as string[]).filter(Boolean).join("\n\n")
        : "";

  // 7) Render
  return (
    <>
      {/* Client-side self-heal fallback (uses /api/alumni/lookup) */}
      <CanonicalSlugGate slug={incoming} basePath="/alumni" />

      <AlumniProfilePage
        data={{
          slug: (normalizedAlumni as any).slug,
          name: (normalizedAlumni as any).name,
          role: (normalizedAlumni as any).roles?.[0] || "",
          roles: (normalizedAlumni as any).roles || [],
          location: (normalizedAlumni as any).location || "",
          headshotUrl: (normalizedAlumni as any).headshotUrl || "",
          identityTags: (normalizedAlumni as any).identityTags || [],
          statusFlags: (normalizedAlumni as any).statusFlags || [],
          programBadges: (normalizedAlumni as any).programBadges || [],
          programSeasons: (normalizedAlumni as any).programSeasons || [],
          artistStatement: safeArtistStatement,
          fieldNotes: (normalizedAlumni as any).fieldNotes || [],
          imageUrls: mergedImageUrls,
          posterUrls: mergedPosterUrls,
          email: (normalizedAlumni as any).email || "",
          website: (normalizedAlumni as any).website || "",
          socials: (normalizedAlumni as any).socials || [],
          updates: (normalizedAlumni as any).updates || [],
        }}
        allStories={storiesForThisAlum}
      />
      <section className="bg-[#241123] pt-0 pb-10" />
    </>
  );
}
