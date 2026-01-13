// /lib/loadCsv.ts
"use server";

import { serverDebug, serverInfo, serverWarn } from "@/lib/serverDebug";

const DEBUG = process.env.SHOW_DAT_DEBUG === "true";
const SA_FALLBACK_DISABLED = process.env.DISABLE_SA_FALLBACK === "1";

type LoadCsvOptions = {
  /** Seconds for ISR (default 60). Set to 0 for no-store. */
  revalidate?: number;
  /** Force dynamic fetch w/ no-store; implies cache-buster for Sheets */
  noStore?: boolean;
  /** Force cache-buster even when not noStore (rarely needed) */
  cacheBust?: boolean;
};

/**
 * Load a CSV from a live URL or local fallback.
 * - Defaults to ISR (revalidate: 60) so static prerendering works
 * - Only uses no-store + cache-buster when `noStore: true`
 * - Falls back to Google Sheets API with Service Account on 401/403 for /spreadsheets/d/<fileId> URLs
 * - SA fallback is gated by DISABLE_SA_FALLBACK=1 and bounded retries with backoff
 *
 * NOTE:
 * - On many production hosts (e.g. Vercel), the filesystem is read-only at runtime.
 *   Fallback writes are therefore best-effort and should never break the request.
 */
export async function loadCsv(
  sourceUrl?: string,
  fallbackFileName = "alumni.csv",
  opts: LoadCsvOptions = {}
): Promise<string> {
  const fs = await import("fs/promises");
  const path = await import("path");
  const fallbackPath = path.join(process.cwd(), "public", "fallback", fallbackFileName);

  const stripBOM = (txt: string) =>
    txt.length > 0 && txt.charCodeAt(0) === 0xfeff ? txt.slice(1) : txt;

  const isDocsHost = (url: string) => {
    try { return new URL(url).hostname === "docs.google.com"; } catch { return false; }
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

  // Effective caching mode
  const revalidate = opts.noStore ? 0 : (Number.isFinite(opts.revalidate) ? Number(opts.revalidate) : 60);
  const useNoStore = opts.noStore === true;
  const shouldBust = (opts.cacheBust === true) || (useNoStore && isSheetsCsvish(String(sourceUrl)));

  // ---------------- HTTP path ----------------
  const tryHttpFetch = async (url: string) => {
    const finalUrl = shouldBust ? withCacheBuster(url) : url;
    if (DEBUG) serverInfo("🌐 [loadCsv] HTTP fetch:", finalUrl, { revalidate, noStore: useNoStore });

    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 8000);

    const fetchInit: RequestInit & { next?: { revalidate?: number } } = {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "text/csv, text/plain; q=0.9, */*; q=0.8",
        Referer: "https://docs.google.com/",
      },
      signal: controller.signal,
      next: { revalidate },
    };

    // Only force no-store when requested; otherwise let ISR do its job
    if (useNoStore) {
      (fetchInit as any).cache = "no-store";
    }

    const res = await fetch(finalUrl, fetchInit).finally(() => clearTimeout(t));

    if (!res.ok) {
      const err = new Error(`HTTP ${res.status} ${res.statusText}`);
      (err as any).status = res.status;
      throw err;
    }

    const body = await res.text();
    return stripBOM(body);
  };

  // ---------------- Service Account fallback (Sheets API only, bounded) ----------------
  const tryServiceAccountSheetsBounded = async (url: string) => {
    if (SA_FALLBACK_DISABLED) {
      throw new Error("SA fallback disabled via DISABLE_SA_FALLBACK=1");
    }
    if (!process.env.GCP_SA_JSON) {
      throw new Error("GCP_SA_JSON missing; cannot use Service Account fallback");
    }
    if (!isSheetsFileUrl(url)) {
      throw new Error("SA fallback requires a /spreadsheets/d/<fileId> URL");
    }

    const { google } = await import("googleapis");
    const sa = JSON.parse(process.env.GCP_SA_JSON as string);

    const auth = new google.auth.JWT({
      email: sa.client_email,
      key: sa.private_key,
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
      serverDebug("🔐 [loadCsv] SA Sheets fallback:", { spreadsheetId, wantGid, wantTitle });
    }

    // Helper to do one SA request
    const saOnce = async () => {
      // 1) get sheet list
      const meta = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: "sheets(properties(sheetId,title))",
        includeGridData: false,
      });

      const props = (meta.data.sheets || []).map((s) => s.properties!).filter(Boolean);
      if (!props.length) throw new Error("Spreadsheet has no sheets");

      // 2) resolve sheet
      let title: string | undefined;
      if (wantGid) {
        const gid = Number(wantGid);
        const hit = props.find((p) => p.sheetId === gid);
        if (!hit?.title) throw new Error(`No sheet with gid=${wantGid}`);
        title = hit.title;
      } else if (wantTitle) {
        const hit = props.find((p) => (p.title || "").toLowerCase() === wantTitle.toLowerCase());
        if (!hit?.title) throw new Error(`No sheet with title='${wantTitle}'`);
        title = hit.title;
      } else {
        title = props[0]!.title!;
      }

      // 3) pull values
      const vals = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${title}'`,
        valueRenderOption: "UNFORMATTED_VALUE",
        dateTimeRenderOption: "FORMATTED_STRING",
      });

      // 4) to CSV
      return toCsv(vals.data.values || []);
    };

    // Bounded retries with backoff
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        const csv = await saOnce();
        return csv;
      } catch (err: any) {
        const msg = String(err?.message || err);
        // Early exit on non-retryable conditions
        if (
          msg.includes("Requested entity was not found") || // permissions / not shared with SA
          msg.toLowerCase().includes("quota exceeded") ||   // rate limit — don't keep hammering
          msg.includes("No sheet with gid=") ||
          msg.includes("No sheet with title=")
        ) {
          serverWarn("⚠️ [loadCsv] SA fallback non-retryable:", msg);
          break;
        }
        if (i < maxRetries - 1) {
          const delayMs = (i + 1) * 500; // 0.5s, 1.0s
          if (DEBUG) serverDebug(`⏳ [loadCsv] SA retry in ${delayMs}ms (${i + 1}/${maxRetries - 1})`);
          await new Promise((r) => setTimeout(r, delayMs));
          continue;
        }
        serverWarn("⚠️ [loadCsv] SA fallback failed after retries:", msg);
        break;
      }
    }
    throw new Error("SA fallback did not succeed");
  };

  // ---------------- main flow ----------------
  if (sourceUrl) {
    try {
      const csv = await tryHttpFetch(sourceUrl);

      // Best-effort fallback write (never break runtime if FS is read-only)
      try {
        await fs.mkdir(path.dirname(fallbackPath), { recursive: true });
        await fs.writeFile(fallbackPath, csv, "utf-8");
        if (DEBUG) serverDebug("✅ [loadCsv] HTTP fetch ok; fallback updated:", fallbackFileName);
      } catch (e) {
        if (DEBUG) serverWarn("⚠️ [loadCsv] Could not write fallback (likely read-only FS):", String(e));
      }

      return csv;
    } catch (err: any) {
      const status = err?.status;
      const authError = status === 401 || status === 403;

      if (authError && isDocsHost(sourceUrl) && isSheetsFileUrl(sourceUrl)) {
        try {
          const csv = stripBOM(await tryServiceAccountSheetsBounded(sourceUrl));

          // Best-effort fallback write (never break runtime)
          try {
            await fs.mkdir(path.dirname(fallbackPath), { recursive: true });
            await fs.writeFile(fallbackPath, csv, "utf-8");
            if (DEBUG) serverDebug("✅ [loadCsv] SA Sheets fallback ok; fallback updated:", fallbackFileName);
          } catch (e) {
            if (DEBUG) serverWarn("⚠️ [loadCsv] Could not write fallback (likely read-only FS):", String(e));
          }

          return csv;
        } catch (saErr: any) {
          serverWarn("⚠️ [loadCsv] SA fallback failed:", saErr?.message || String(saErr));
        }
      } else {
        serverWarn("⚠️ [loadCsv] HTTP fetch failed:", err?.message || String(err));
      }
    }
  }

  // Local fallback as last resort
  try {
    if (DEBUG) serverDebug("📂 [loadCsv] Using fallback:", fallbackFileName);
    const csvText = await fs.readFile(fallbackPath, "utf-8");
    return stripBOM(csvText);
  } catch {
    throw new Error(`❌ No CSV content found from URL or fallback: ${fallbackFileName}`);
  }
}
