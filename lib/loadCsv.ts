// /lib/loadCsv.ts
"use server";

import { serverDebug, serverInfo, serverWarn } from "@/lib/serverDebug";
import { getStore } from "@netlify/blobs";

type LoadCsvOptions = {
  /** Seconds for ISR (default 60). Set to 0 for no-store. */
  revalidate?: number;
  /** Force dynamic fetch w/ no-store; implies cache-buster for Sheets */
  noStore?: boolean;
  /** Force cache-buster even when not noStore (rarely needed) */
  cacheBust?: boolean;

  /**
   * Optional: override blob key (defaults to fallbackFileName).
   * Handy if you want multiple caches for same fallback name.
   */
  blobKey?: string;

  /**
   * Optional: override store name (defaults "csv-cache")
   */
  blobStoreName?: string;
};

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";
const SA_FALLBACK_DISABLED = process.env.DISABLE_SA_FALLBACK === "1";

/**
 * Netlify Blobs availability:
 * - On Netlify runtime, you can call getStore("name") without credentials.
 * - For local dev, you MAY supply NETLIFY_SITE_ID + NETLIFY_AUTH_TOKEN
 *   and Blobs reads/writes will work locally too.
 */
function getBlobStore(storeName: string) {
  const siteID = (process.env.NETLIFY_SITE_ID || process.env.SITE_ID || "").trim();
  const token = (process.env.NETLIFY_AUTH_TOKEN || "").trim();

  // If you have local creds set, use them. Otherwise rely on Netlify runtime.
  if (siteID && token) return getStore({ name: storeName, siteID, token });
  return getStore(storeName);
}

const isNetlifyRuntime = () =>
  process.env.NETLIFY === "true" || !!process.env.NETLIFY_SITE_ID;

const stripBOM = (txt: string) =>
  txt.length > 0 && txt.charCodeAt(0) === 0xfeff ? txt.slice(1) : txt;

const isDocsHost = (url: string) => {
  try {
    return new URL(url).hostname === "docs.google.com";
  } catch {
    return false;
  }
};

const isSheetsFileUrl = (url: string) => {
  try {
    const u = new URL(url);
    return u.hostname === "docs.google.com" && /\/spreadsheets\/d\//.test(u.pathname);
  } catch {
    return false;
  }
};

const isSheetsCsvish = (url: string) => {
  try {
    const u = new URL(url);
    if (u.hostname !== "docs.google.com") return false;
    if (!u.pathname.includes("/spreadsheets/")) return false;
    const fmt = (u.searchParams.get("format") || u.searchParams.get("output") || "").toLowerCase();
    return fmt === "csv" || u.pathname.endsWith("/export") || u.pathname.endsWith("/gviz/tq");
  } catch {
    return false;
  }
};

const withCacheBuster = (url: string) => {
  try {
    const u = new URL(url);
    u.searchParams.set("_cb", String(Date.now()));
    return u.toString();
  } catch {
    return url;
  }
};

// Serialize 2D array to CSV (quote minimal)
const toCsv = (rows: any[][]): string => {
  const needsQ = /[",\r\n]/;
  const q = (v: any) => {
    const s = v == null ? "" : String(v);
    return needsQ.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return (rows || []).map((r) => (r || []).map(q).join(",")).join("\n");
};

async function blobSetTextBestEffort(storeName: string, key: string, value: string) {
  if (!isNetlifyRuntime() && !(process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN)) {
    if (DEBUG) serverDebug("🫙 [loadCsv] Blobs skip (not netlify runtime + no local creds)", { storeName, key });
    return;
  }

  try {
    const store = getBlobStore(storeName);
    await store.set(key, value, {
      metadata: {
        cachedAt: new Date().toISOString(),
      },
    });

    if (DEBUG) serverDebug("🫙 [loadCsv] Blobs set OK", { storeName, key, bytes: value.length });
  } catch (e) {
    if (DEBUG) serverWarn("🫙 [loadCsv] Blobs set FAILED", { storeName, key, err: String(e) });
  }
}

async function blobGetTextBestEffort(storeName: string, key: string): Promise<string | null> {
  if (!isNetlifyRuntime() && !(process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN)) {
    if (DEBUG) serverDebug("🫙 [loadCsv] Blobs skip get (not netlify runtime + no local creds)", { storeName, key });
    return null;
  }

  try {
    const store = getBlobStore(storeName);
    const v = await store.get(key, { type: "text" });
    const txt = typeof v === "string" ? v : null;

    if (DEBUG) serverDebug("🫙 [loadCsv] Blobs get", { storeName, key, hit: !!txt, bytes: txt?.length || 0 });
    return txt && txt.trim() ? txt : null;
  } catch (e) {
    if (DEBUG) serverWarn("🫙 [loadCsv] Blobs get FAILED", { storeName, key, err: String(e) });
    return null;
  }
}

/**
 * Load a CSV from a live URL or local fallback.
 * - Defaults to ISR (revalidate: 60) so static prerendering works
 * - Only uses no-store + cache-buster when `noStore: true`
 * - Falls back to Google Sheets API with Service Account on 401/403 for /spreadsheets/d/<fileId> URLs
 * - SA fallback is gated by DISABLE_SA_FALLBACK=1 and bounded retries with backoff
 *
 * Persistence:
 * - Writes last-known-good CSV to Netlify Blobs (KV) on success.
 * - On failure, tries Blobs, then local /public/fallback/<file>.
 */
export async function loadCsv(
  sourceUrl?: string,
  fallbackFileName = "alumni.csv",
  opts: LoadCsvOptions = {}
): Promise<string> {
  const fs = await import("fs/promises");
  const path = await import("path");

  const fallbackPath = path.join(process.cwd(), "public", "fallback", fallbackFileName);

  // ------------------------------------------------------------
  // Effective caching mode
  //
  // During `next build`, some routes/pages are evaluated in build workers.
  // Forcing `noStore` there triggers Next's "Dynamic server usage" warnings.
  // So: during build, we degrade `noStore` to ISR.
  // ------------------------------------------------------------
  const IS_BUILD = process.env.NEXT_PHASE === "phase-production-build";

  const useNoStore = opts.noStore === true && !IS_BUILD;
  const revalidate = useNoStore
    ? 0
    : Number.isFinite(opts.revalidate)
    ? Number(opts.revalidate)
    : 60;

  const shouldBust =
    opts.cacheBust === true || (useNoStore && !!sourceUrl && isSheetsCsvish(sourceUrl));

  const blobStoreName = (opts.blobStoreName || "csv-cache").trim();
  const blobKey = (opts.blobKey || fallbackFileName).trim();

  if (DEBUG) {
    serverInfo("🧭 [loadCsv] start", {
      sourceUrl: sourceUrl ? sourceUrl.slice(0, 160) : null,
      fallbackFileName,
      fallbackPath,
      blobStoreName,
      blobKey,
      revalidate,
      useNoStore,
      shouldBust,
      isBuild: IS_BUILD,
      isNetlifyRuntime: isNetlifyRuntime(),
    });
  }

  // ---------------- HTTP path ----------------
  const tryHttpFetch = async (url: string) => {
    const finalUrl = shouldBust ? withCacheBuster(url) : url;

    if (DEBUG) {
      serverInfo("🌐 [loadCsv] HTTP fetch", finalUrl, {
        revalidate,
        noStore: useNoStore,
        isBuild: IS_BUILD,
      });
    }

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);

    const fetchInit: RequestInit & { next?: { revalidate?: number } } = {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/csv, text/plain; q=0.9, */*; q=0.8",
        Referer: "https://docs.google.com/",
      },
      signal: controller.signal,
      };

      if (!useNoStore && revalidate > 0) {
        fetchInit.next = { revalidate };
      }

    if (useNoStore) (fetchInit as any).cache = "no-store";

    const res = await fetch(finalUrl, fetchInit).finally(() => clearTimeout(t));

    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} ${res.statusText}`);
      (err as any).status = res.status;
      throw err;
    }

    const body = await res.text();
    const txt = stripBOM(body);

    // Google sometimes returns a 200 HTML login/redirect page instead of CSV.
    // Treat as auth failure so SA fallback + cached fallbacks can trigger.
    const ct = (res.headers.get("content-type") || "").toLowerCase();
    const looksLikeHtml =
      ct.includes("text/html") || /^\s*<!doctype html/i.test(txt) || /^\s*<html[\s>]/i.test(txt);

    if (looksLikeHtml) {
      const err = new Error("Google returned HTML instead of CSV (likely not public / auth required)");
      (err as any).status = 403;
      throw err;
    }

    return txt;
  };

  // ---------------- Service Account fallback (Sheets API only, bounded) ----------------
  const tryServiceAccountSheetsBounded = async (url: string) => {
    if (SA_FALLBACK_DISABLED) throw new Error("SA fallback disabled via DISABLE_SA_FALLBACK=1");
    if (!process.env.GCP_SA_JSON) throw new Error("GCP_SA_JSON missing; cannot use Service Account fallback");
    if (!isSheetsFileUrl(url)) throw new Error("SA fallback requires a /spreadsheets/d/<fileId> URL");

    const { google } = await import("googleapis");
    const sa = JSON.parse(process.env.GCP_SA_JSON as string);

    let privateKey = String(sa.private_key || "");
    if (privateKey.includes("\\n")) privateKey = privateKey.replace(/\\n/g, "\n");

    const auth = new google.auth.JWT({
      email: sa.client_email,
      key: privateKey,
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets.readonly",
        "https://www.googleapis.com/auth/drive.readonly",
      ],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const u = new URL(url);
    const m = u.pathname.match(/\/spreadsheets\/d\/([^/]+)/);
    const spreadsheetId = m?.[1];
    if (!spreadsheetId) throw new Error("Could not parse spreadsheetId from URL");

    const wantGid = u.searchParams.get("gid");
    const wantTitle = u.searchParams.get("sheet");

    if (DEBUG) {
      serverDebug("🔐 [loadCsv] SA Sheets fallback begin", { spreadsheetId, wantGid, wantTitle });
    }

    const saOnce = async () => {
      const meta = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets(properties(sheetId,title))",
        includeGridData: false,
      });

      const props = (meta.data.sheets || []).map((s) => s.properties!).filter(Boolean);
      if (!props.length) throw new Error("Spreadsheet has no sheets");

      let title: string | undefined;

      if (wantGid) {
        const gidNum = Number(wantGid);
        const hit = props.find((p) => p.sheetId === gidNum);
        if (!hit?.title) throw new Error(`No sheet with gid=${wantGid}`);
        title = hit.title;
      } else if (wantTitle) {
        const hit = props.find((p) => (p.title || "").toLowerCase() === wantTitle.toLowerCase());
        if (!hit?.title) throw new Error(`No sheet with title='${wantTitle}'`);
        title = hit.title;
      } else {
        title = props[0]!.title!;
      }

      const vals = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${title}'`,
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      });

      return toCsv(vals.data.values || []);
    };

    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const csv = await saOnce();
        if (DEBUG) serverDebug("🔐 [loadCsv] SA Sheets fallback OK", { attempt: i + 1, bytes: csv.length });
        return csv;
      } catch (err: any) {
        const msg = String(err?.message || err);

        if (
          msg.includes("Requested entity was not found") ||
          msg.toLowerCase().includes("quota exceeded") ||
          msg.includes("No sheet with gid=") ||
          msg.includes("No sheet with title=")
        ) {
          serverWarn("⚠️ [loadCsv] SA fallback non-retryable", msg);
          break;
        }

        if (i < maxRetries - 1) {
          const delayMs = (i + 1) * 500;
          if (DEBUG) serverDebug(`⏳ [loadCsv] SA retry in ${delayMs}ms (${i + 1}/${maxRetries - 1})`);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }

        serverWarn("⚠️ [loadCsv] SA fallback failed after retries", msg);
        break;
      }
    }

    throw new Error("SA fallback did not succeed");
  };

  const persistLastKnownGood = async (csv: string, reason: string) => {
    if (DEBUG) serverDebug("💾 [loadCsv] Persist last-known-good", { reason, blobStoreName, blobKey, bytes: csv.length });

    // 1) Blobs (persist across deploys)
    await blobSetTextBestEffort(blobStoreName, blobKey, csv);

    // 2) Best-effort local fallback write (may be read-only in prod)
    try {
      await fs.mkdir(path.dirname(fallbackPath), { recursive: true });
      await fs.writeFile(fallbackPath, csv, "utf-8");
      if (DEBUG) serverDebug("📂 [loadCsv] Local fallback file write OK", { fallbackFileName });
    } catch (e) {
      if (DEBUG) serverWarn("📂 [loadCsv] Local fallback file write FAILED (likely read-only FS)", String(e));
    }
  };

  // ---------------- main flow ----------------
  if (sourceUrl) {
    // 1) Try HTTP
    try {
      const csv = await tryHttpFetch(sourceUrl);
      if (DEBUG) serverInfo("✅ [loadCsv] HTTP OK", { bytes: csv.length });

      await persistLastKnownGood(csv, "http-ok");
      return csv;
    } catch (err: any) {
      const status = err?.status;
      const authError = status === 401 || status === 403;

      if (DEBUG) {
        serverWarn("❌ [loadCsv] HTTP FAILED", {
          status,
          authError,
          msg: err?.message || String(err),
        });
      }

      // 2) If auth error on docs.google.com file URL, try SA fallback
      if (authError && isDocsHost(sourceUrl) && isSheetsFileUrl(sourceUrl)) {
        try {
          const csv = stripBOM(await tryServiceAccountSheetsBounded(sourceUrl));
          if (DEBUG) serverInfo("✅ [loadCsv] SA OK", { bytes: csv.length });

          await persistLastKnownGood(csv, "sa-ok");
          return csv;
        } catch (saErr: any) {
          serverWarn("⚠️ [loadCsv] SA FAILED", saErr?.message || String(saErr));
        }
      }
    }
  } else {
    if (DEBUG) serverWarn("⚠️ [loadCsv] No sourceUrl provided; going straight to fallbacks", { fallbackFileName });
  }

  // 3) Blobs fallback (last known good)
  const blobCsv = await blobGetTextBestEffort(blobStoreName, blobKey);
  if (blobCsv) {
    if (DEBUG) serverInfo("🫙 [loadCsv] Using Blobs fallback", { blobStoreName, blobKey, bytes: blobCsv.length });
    return stripBOM(blobCsv);
  }

  // 4) Local fallback last resort
  try {
    if (DEBUG) serverInfo("📂 [loadCsv] Using local fallback file", { fallbackFileName, fallbackPath });
    const csvText = await fs.readFile(fallbackPath, "utf-8");
    return stripBOM(csvText);
  } catch (e) {
    serverWarn("❌ [loadCsv] No CSV content from URL, Blobs, or fallback file", {
      fallbackFileName,
      err: String(e),
    });
    throw new Error(`❌ No CSV content found from URL, Blobs, or fallback: ${fallbackFileName}`);
  }
}
