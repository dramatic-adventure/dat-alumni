// app/api/media/list/route.ts
import { NextResponse } from "next/server";
import { sheetsClient, driveClient } from "@/lib/googleClients";

export const runtime = "nodejs";

type MediaKind = "headshot" | "album" | "reel" | "event";
type AnyKind = MediaKind | "all";

type MediaItem = {
  alumniId: string;
  kind: MediaKind;
  fileId: string;
  uploadedAt: string; // ISO
  uploadedByEmail?: string;
  collectionId?: string;
  collectionTitle?: string;
  externalUrl?: string;
  isCurrent?: string; // "TRUE"/"FALSE" or ""
  isFeatured?: string; // "TRUE"/"FALSE" or ""
  sortIndex?: string;
  note?: string;
  drive?: {
    name?: string;
    webViewLink?: string;
    thumbnailLink?: string;
  };
};

function idxOf(header: string[], candidates: string[]) {
  const lower = header.map((h) => String(h || "").trim().toLowerCase());
  for (const c of candidates) {
    const i = lower.indexOf(c.toLowerCase());
    if (i !== -1) return i;
  }
  return -1;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  tries = 3,
  baseDelayMs = 250
): Promise<T> {
  let lastErr: any;
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      return await fn();
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message || e);
      if (
        /ECONNRESET|ENOTFOUND|ETIMEDOUT|EPIPE|socket hang up|rateLimitExceeded|backendError|internalError/i.test(
          msg
        ) &&
        attempt < tries
      ) {
        const delay = baseDelayMs * Math.pow(2, attempt - 1);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      break;
    }
  }
  throw new Error(`${label} failed: ${lastErr?.message || String(lastErr)}`);
}

function parseIntSafe(v: string | null, d: number) {
  const n = v ? parseInt(v, 10) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : d;
}

function toISOOrEmpty(v: string) {
  const s = String(v || "").trim();
  if (!s) return "";
  // Already ISO?
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s;

  const t = Date.parse(s);
  if (Number.isFinite(t)) return new Date(t).toISOString();
  return "";
}

function cacheHeaders(opts: { includeDrive: boolean }) {
  // "Nicer option":
  // - Cache the list for a short window at the edge/CDN
  // - Allow stale-while-revalidate for snappy repeat loads
  //
  // IMPORTANT: if includeDrive=true, we skip caching because it triggers Drive lookups
  // (expensive + potentially variable) and we don't want that stuck in caches.
  if (opts.includeDrive) {
    return {
      "Cache-Control": "private, no-store",
    };
  }

  return {
    // Browser can keep it briefly; CDN keeps it longer.
    // Adjust if you want: s-maxage=120 for 2min, etc.
    "Cache-Control": "public, max-age=60, s-maxage=300, stale-while-revalidate=86400",
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const alumniId = String(searchParams.get("alumniId") || "").trim();
    const kind = String(searchParams.get("kind") || "all")
      .trim()
      .toLowerCase() as AnyKind;

    const limit = Math.min(parseIntSafe(searchParams.get("limit"), 50) || 50, 100);
    const offset = Math.max(parseIntSafe(searchParams.get("offset"), 0) || 0, 0);

    const includeDrive =
      String(searchParams.get("includeDrive") || "false").toLowerCase() === "true";

    if (!alumniId) {
      return NextResponse.json(
        { error: "alumniId required" },
        { status: 400, headers: cacheHeaders({ includeDrive }) }
      );
    }
    if (!["headshot", "album", "reel", "event", "all"].includes(kind)) {
      return NextResponse.json(
        { error: "kind invalid" },
        { status: 400, headers: cacheHeaders({ includeDrive }) }
      );
    }

    const sheets = sheetsClient();
    const spreadsheetId = process.env.ALUMNI_SHEET_ID!;

    // Read Profile-Media
    const mediaResp = await withRetry(
      () =>
        sheets.spreadsheets.values.get({
          spreadsheetId,
          range: "Profile-Media!A:L",
          valueRenderOption: "UNFORMATTED_VALUE",
        }),
      "Sheets get Profile-Media"
    );

    const mRows = (mediaResp.data.values ?? []) as string[][];
    if (mRows.length === 0) {
      return NextResponse.json(
        { ok: true, items: [], total: 0, offset, limit },
        { headers: cacheHeaders({ includeDrive }) }
      );
    }

    const header = mRows[0] as string[];
    const rows = mRows.slice(1);

    const idxAid = idxOf(header, ["alumniid", "alumni id", "alumni_id"]);
    const idxKind = idxOf(header, ["kind"]);
    const idxFile = idxOf(header, ["fileid", "file id"]);
    const idxUploadedAt = idxOf(header, ["uploadedat", "uploaded at"]);
    const idxUploadedBy = idxOf(header, ["uploadedbyemail", "uploaded by email", "uploadedby"]);
    const idxColId = idxOf(header, ["collectionid", "collection id"]);
    const idxColTitle = idxOf(header, ["collectiontitle", "collection title"]);
    const idxExtUrl = idxOf(header, ["externalurl", "external url"]);
    const idxIsCur = idxOf(header, ["iscurrent"]);
    const idxIsFeat = idxOf(header, ["isfeatured"]);
    const idxSort = idxOf(header, ["sortindex", "sort index"]);
    const idxNote = idxOf(header, ["note", "notes"]);

    // Filter
    const filtered = rows.filter((r) => {
      const aid = idxAid !== -1 ? String(r[idxAid] || "").trim() : "";
      if (aid !== alumniId) return false;

      if (kind !== "all") {
        const k = idxKind !== -1 ? String(r[idxKind] || "").trim().toLowerCase() : "";
        if (k !== kind) return false;
      }
      return true;
    });

    // Map to typed objects
    const itemsAll: MediaItem[] = filtered.map((r) => {
      const k = (idxKind !== -1 ? String(r[idxKind] || "").trim().toLowerCase() : "") as MediaKind;
      return {
        alumniId,
        kind: k,
        fileId: idxFile !== -1 ? String(r[idxFile] || "").trim() : "",
        uploadedAt: idxUploadedAt !== -1 ? toISOOrEmpty(String(r[idxUploadedAt] || "")) : "",
        uploadedByEmail: idxUploadedBy !== -1 ? String(r[idxUploadedBy] || "").trim() : "",
        collectionId: idxColId !== -1 ? String(r[idxColId] || "").trim() : "",
        collectionTitle: idxColTitle !== -1 ? String(r[idxColTitle] || "").trim() : "",
        externalUrl: idxExtUrl !== -1 ? String(r[idxExtUrl] || "").trim() : "",
        isCurrent: idxIsCur !== -1 ? String(r[idxIsCur] || "").trim() : "",
        isFeatured: idxIsFeat !== -1 ? String(r[idxIsFeat] || "").trim() : "",
        sortIndex: idxSort !== -1 ? String(r[idxSort] || "").trim() : "",
        note: idxNote !== -1 ? String(r[idxNote] || "").trim() : "",
      };
    });

    // Sort: uploadedAt desc, then sortIndex asc (numeric-ish), then fileId desc
    itemsAll.sort((a, b) => {
      const ta = Date.parse(a.uploadedAt || "") || 0;
      const tb = Date.parse(b.uploadedAt || "") || 0;
      if (tb !== ta) return tb - ta;

      const sa = Number.isFinite(Number(a.sortIndex))
        ? Number(a.sortIndex)
        : Number.POSITIVE_INFINITY;
      const sb = Number.isFinite(Number(b.sortIndex))
        ? Number(b.sortIndex)
        : Number.POSITIVE_INFINITY;
      if (sa !== sb) return sa - sb;

      // stable tie-breaker
      return (b.fileId || "").localeCompare(a.fileId || "");
    });

    const total = itemsAll.length;
    const items = itemsAll.slice(offset, offset + limit);

    // Optional: hydrate Drive metadata (name, links)
    if (includeDrive && items.length) {
      const drive = driveClient();
      for (const it of items) {
        if (!it.fileId) continue;
        try {
          const file = await withRetry(
            () =>
              drive.files.get({
                fileId: it.fileId,
                fields: "id,name,webViewLink,thumbnailLink",
                supportsAllDrives: true,
              } as any),
            `Drive get ${it.fileId}`
          );
          it.drive = {
            name: file.data.name || undefined,
            webViewLink: file.data.webViewLink || undefined,
            thumbnailLink: file.data.thumbnailLink || undefined,
          };
        } catch {
          // non-fatal
        }
      }
    }

    const nextOffset = offset + items.length < total ? offset + items.length : undefined;

    return NextResponse.json(
      { ok: true, items, total, offset, limit, nextOffset },
      { headers: cacheHeaders({ includeDrive }) }
    );
  } catch (e: any) {
    const msg = e?.message || "server error";
    console.error("MEDIA LIST ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
