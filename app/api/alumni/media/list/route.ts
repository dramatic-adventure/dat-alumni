// app/api/alumni/media/list/route.ts
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
  isCurrent?: boolean;
  isFeatured?: boolean;
  sortIndex?: string;
  note?: string;
  drive?: {
    name?: string;
    webViewLink?: string;
    thumbnailLink?: string;
  };
};

function truthyCell(v: unknown): boolean {
  if (v === true) return true;
  if (v === false || v == null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "yes" || s === "1" || s === "y";
}

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

      // Do NOT retry quota errors (it makes the storm worse)
      if (/quota exceeded/i.test(msg)) break;

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
  return Number.isFinite(n) ? n : d;
}

function toISOOrEmpty(v: string) {
  const s = String(v || "").trim();
  if (!s) return "";

  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s;

  if (/^\d+(\.\d+)?$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n) && n > 0) {
      const epochMs = Date.UTC(1899, 11, 30) + n * 24 * 60 * 60 * 1000;
      return new Date(epochMs).toISOString();
    }
  }

  const t = Date.parse(s);
  if (Number.isFinite(t)) return new Date(t).toISOString();

  return "";
}

/**
 * ---- Caching + in-flight de-dupe (stops Sheets quota storms) ----
 * Module-level cache survives within a running Node process.
 * In dev with HMR it can reset; still helps a lot.
 */
type CacheValue = {
  ts: number;
  data: any;
};

const CACHE_TTL_MS = 15_000; // 15s is enough to kill loops but still feels "live"

const g = globalThis as any;
const mediaListCache: Map<string, CacheValue> =
  g.__DAT_MEDIA_LIST_CACHE__ ?? (g.__DAT_MEDIA_LIST_CACHE__ = new Map());
const inflight: Map<string, Promise<any>> =
  g.__DAT_MEDIA_LIST_INFLIGHT__ ?? (g.__DAT_MEDIA_LIST_INFLIGHT__ = new Map());

function makeCacheKey(params: {
  alumniId: string;
  kind: AnyKind;
  limit: number;
  offset: number;
  includeDrive: boolean;
}) {
  return [
    "v1",
    params.alumniId,
    params.kind,
    `l=${params.limit}`,
    `o=${params.offset}`,
    `d=${params.includeDrive ? 1 : 0}`,
  ].join("|");
}

function cacheFresh(key: string) {
  const hit = mediaListCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts <= CACHE_TTL_MS) return hit.data;
  return null;
}

function cacheAny(key: string) {
  const hit = mediaListCache.get(key);
  return hit ? hit.data : null;
}

function responseHeaders() {
  // Let the browser cache briefly too (helps even if component is noisy)
  return {
    "Cache-Control": "public, max-age=10, stale-while-revalidate=60",
  };
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const alumniId = String(searchParams.get("alumniId") || "")
      .trim()
      .toLowerCase();
    const kind = String(searchParams.get("kind") || "all")
      .trim()
      .toLowerCase() as AnyKind;

    // NOTE: parseIntSafe returns number even for 0; clamp ourselves.
    const limit = Math.min(Math.max(parseIntSafe(searchParams.get("limit"), 50), 1), 100);
    const offset = Math.max(parseIntSafe(searchParams.get("offset"), 0), 0);

    const includeDrive =
      String(searchParams.get("includeDrive") || "false").toLowerCase() === "true";

    if (!alumniId) {
      return NextResponse.json(
        { error: "alumniId required" },
        { status: 400, headers: responseHeaders() }
      );
    }
    if (!["headshot", "album", "reel", "event", "all"].includes(kind)) {
      return NextResponse.json(
        { error: "kind invalid" },
        { status: 400, headers: responseHeaders() }
      );
    }

    const key = makeCacheKey({ alumniId, kind, limit, offset, includeDrive });

    // 1) If we have a fresh cache, return immediately
    const fresh = cacheFresh(key);
    if (fresh) {
      return NextResponse.json(fresh, { status: 200, headers: responseHeaders() });
    }

    // 2) If an identical request is already in-flight, await it
    const existing = inflight.get(key);
    if (existing) {
      const data = await existing;
      return NextResponse.json(data, { status: 200, headers: responseHeaders() });
    }

    // 3) Otherwise, start the work and register as in-flight
    const work = (async () => {
      const sheets = sheetsClient();
      const spreadsheetId = process.env.ALUMNI_SHEET_ID!;

      const mediaResp = await withRetry(
        () =>
          sheets.spreadsheets.values.get({
            spreadsheetId,
            range: "Profile-Media!A:L",
            valueRenderOption: "UNFORMATTED_VALUE",
          }),
        "Sheets get Profile-Media"
      );

      const mRows = (mediaResp.data.values ?? []) as any[][];
      if (mRows.length === 0) {
        return { ok: true, items: [], total: 0, offset, limit };
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

      const filtered = rows.filter((r) => {
        const aid = idxAid !== -1 ? String(r[idxAid] || "").trim().toLowerCase() : "";
        if (aid !== alumniId) return false;

        if (kind !== "all") {
          const k = idxKind !== -1 ? String(r[idxKind] || "").toLowerCase() : "";
          if (k !== kind) return false;
        }
        return true;
      });

      const itemsAll: MediaItem[] = filtered.map((r) => {
        const k = (idxKind !== -1 ? String(r[idxKind] || "").toLowerCase() : "") as MediaKind;
        return {
          alumniId,
          kind: k,
          fileId: idxFile !== -1 ? String(r[idxFile] || "") : "",
          uploadedAt: idxUploadedAt !== -1 ? toISOOrEmpty(String(r[idxUploadedAt] || "")) : "",
          uploadedByEmail: idxUploadedBy !== -1 ? String(r[idxUploadedBy] || "") : "",
          collectionId: idxColId !== -1 ? String(r[idxColId] || "") : "",
          collectionTitle: idxColTitle !== -1 ? String(r[idxColTitle] || "") : "",
          externalUrl: idxExtUrl !== -1 ? String(r[idxExtUrl] || "") : "",
          isCurrent: idxIsCur !== -1 ? truthyCell(r[idxIsCur]) : false,
          isFeatured: idxIsFeat !== -1 ? truthyCell(r[idxIsFeat]) : false,
          sortIndex: idxSort !== -1 ? String(r[idxSort] || "") : "",
          note: idxNote !== -1 ? String(r[idxNote] || "") : "",
        };
      });

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

        return (b.fileId || "").localeCompare(a.fileId || "");
      });

      const total = itemsAll.length;
      const items = itemsAll.slice(offset, offset + limit);

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

      return { ok: true, items, total, offset, limit, nextOffset };
    })();

    inflight.set(key, work);

    try {
      const data = await work;
      mediaListCache.set(key, { ts: Date.now(), data });
      return NextResponse.json(data, { status: 200, headers: responseHeaders() });
    } catch (e: any) {
      const msg = String(e?.message || "server error");

      // If quota exceeded, serve stale cache if we have it
      if (/quota exceeded/i.test(msg)) {
        const stale = cacheAny(key);
        if (stale) {
          return NextResponse.json(
            { ...stale, stale: true, warning: "Served from cache due to Sheets quota." },
            { status: 200, headers: responseHeaders() }
          );
        }

        return NextResponse.json(
          { error: msg, retryAfterSeconds: 60 },
          {
            status: 429,
            headers: { ...responseHeaders(), "Retry-After": "60" },
          }
        );
      }

      console.error("MEDIA LIST ERROR:", msg);
      return NextResponse.json({ error: msg }, { status: 500, headers: responseHeaders() });
    } finally {
      inflight.delete(key);
    }
  } catch (e: any) {
    const msg = String(e?.message || "server error");
    console.error("MEDIA LIST ERROR:", msg);
    return NextResponse.json({ error: msg }, { status: 500, headers: responseHeaders() });
  }
}
