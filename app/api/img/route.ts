// app/api/img/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0; // ✅ never ISR-cache this route

// Bump this any time you want to confirm you're running the expected build.
const IMG_ROUTE_BUILD = "2026-02-02T04:35-proxy-only";

// ✅ IMPORTANT: keep this allowlist tight (add only hosts you actually use)
const ALLOWED_HOSTS = new Set<string>([
  "i.imgur.com",
  "images.unsplash.com",
  "live.staticflickr.com",
  "farm1.staticflickr.com",
  "farm2.staticflickr.com",
  "farm3.staticflickr.com",
  "farm4.staticflickr.com",
  "farm5.staticflickr.com",
  "farm6.staticflickr.com",
  "dl.dropboxusercontent.com",
  // Google Drive
  "drive.google.com",
  // ✅ Squarespace image CDN (your log shows this exact host)
  "images.squarespace-cdn.com",
]);

// Safety: prevent very large upstream images from blowing memory.
// (This is upstream payload size, not final transformed size.)
const MAX_UPSTREAM_BYTES = 18 * 1024 * 1024; // 18MB

// Per-instance in-memory cache: survives across requests within the same
// serverless slot (typically minutes–hours). Cuts Google Drive round-trips for
// repeat fetches — most useful for lightbox navigation within a single session.
const _imgCache = new Map<string, { buf: Uint8Array; ct: string; ts: number }>();
const INSTANCE_CACHE_TTL_MS = 15 * 60 * 1000;
const INSTANCE_CACHE_MAX = 80;

function instanceCacheGet(key: string): { buf: Uint8Array; ct: string } | null {
  const e = _imgCache.get(key);
  if (!e) return null;
  if (Date.now() - e.ts > INSTANCE_CACHE_TTL_MS) { _imgCache.delete(key); return null; }
  return { buf: e.buf, ct: e.ct };
}

function instanceCacheSet(key: string, buf: Uint8Array, ct: string) {
  if (_imgCache.size >= INSTANCE_CACHE_MAX) {
    const oldest = _imgCache.keys().next().value;
    if (oldest !== undefined) _imgCache.delete(oldest);
  }
  _imgCache.set(key, { buf, ct, ts: Date.now() });
}

function noStoreHeaders() {
  return {
    // ✅ kill caching everywhere (browser, CDN, Next, proxies)
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Accept",
    "X-Img-Route-Build": IMG_ROUTE_BUILD,
  };
}

/** Cache headers for stable fileId-based image responses.
 *  Google Drive fileIds are immutable — same ID always means the same bytes.
 *  private: browser-only cache (no CDN sharing across users).
 *  max-age=86400: 24h fresh; stale-while-revalidate: serve stale for 7 days
 *  while revalidating in the background.
 */
function fileIdCacheHeaders() {
  return {
    "Cache-Control": "private, max-age=86400, stale-while-revalidate=604800",
    Vary: "Accept",
    "X-Img-Route-Build": IMG_ROUTE_BUILD,
  };
}

function jsonErr(status: number, payload: Record<string, unknown>) {
  return NextResponse.json(payload, { status, headers: noStoreHeaders() });
}

function isAllowedProtocol(p: string) {
  return p === "https:" || p === "http:";
}

function normalizeUrlOrNull(url: string): URL | null {
  try {
    const u = new URL(url);
    if (!isAllowedProtocol(u.protocol)) return null;
    return u;
  } catch {
    return null;
  }
}

function isAllowedHost(hostname: string) {
  const host = hostname.toLowerCase();

  // exact allowlist
  if (ALLOWED_HOSTS.has(host)) return true;

  // allow Googleusercontent subdomains (lh3, lh5, etc.)
  if (host === "googleusercontent.com") return true;
  if (host.endsWith(".googleusercontent.com")) return true;

  return false;
}

function isPlausibleDriveFileId(id: string) {
  const s = (id || "").trim();
  if (s.length < 10 || s.length > 200) return false;
  return /^[a-zA-Z0-9_-]+$/.test(s);
}

function buildDriveUcUrl(fileId: string) {
  const id = (fileId || "").trim();
  if (!id) return "";
  return `https://drive.google.com/uc?export=download&id=${encodeURIComponent(
    id
  )}`;
}

/**
 * HEAD: allow lightweight preflight checks (no upstream fetch)
 */
export async function HEAD(req: Request) {
  const { searchParams } = new URL(req.url);

  const url = (searchParams.get("url") || "").trim();
  const fileId =
    (searchParams.get("fileId") || searchParams.get("id") || "").trim();

  // ✅ If fileId is present, validate it BEFORE building the effective URL.
  if (fileId && !isPlausibleDriveFileId(fileId)) {
    return jsonErr(400, { error: "Invalid fileId" });
  }

  // ✅ Accept either url=... OR fileId=...
  const effectiveUrl = url || (fileId ? buildDriveUcUrl(fileId) : "");
  if (!effectiveUrl) return jsonErr(400, { error: "Missing url" });

  const parsed = normalizeUrlOrNull(effectiveUrl);
  if (!parsed) return jsonErr(400, { error: "Invalid url/protocol" });

  const host = parsed.hostname.toLowerCase();
  if (!isAllowedHost(host)) {
    return jsonErr(403, {
      error: "Host not allowed",
      host,
      hint: "Add this host to ALLOWED_HOSTS in app/api/img/route.ts",
    });
  }

  return new NextResponse(null, { status: 200, headers: noStoreHeaders() });
}

/**
 * GET: proxy-only (no sharp). Returns upstream bytes + upstream content-type.
 * This avoids sharp native-module issues on Netlify Next runtime.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const url = (searchParams.get("url") || "").trim();
    const fileId =
      (searchParams.get("fileId") || searchParams.get("id") || "").trim();

    // ✅ Validate fileId early (avoid wasted fetch/processing).
    if (fileId && !isPlausibleDriveFileId(fileId)) {
      return jsonErr(400, { error: "Invalid fileId" });
    }

    // ✅ Accept either url=... OR fileId=...
    const effectiveUrl = url || (fileId ? buildDriveUcUrl(fileId) : "");
    if (!effectiveUrl) return jsonErr(400, { error: "Missing url" });

    const parsed = normalizeUrlOrNull(effectiveUrl);
    if (!parsed) return jsonErr(400, { error: "Invalid url/protocol" });

    // 🔒 SSRF protection: allowlist hostnames
    const host = parsed.hostname.toLowerCase();
    if (!isAllowedHost(host)) {
      return jsonErr(403, {
        error: "Host not allowed",
        host,
        hint: "Add this host to ALLOWED_HOSTS in app/api/img/route.ts",
      });
    }

    const cacheKey = fileId ? `fid:${fileId}` : `url:${effectiveUrl}`;
    const cached = instanceCacheGet(cacheKey);
    if (cached) {
      const cacheHeaders = fileId ? fileIdCacheHeaders() : noStoreHeaders();
      return new NextResponse(Buffer.from(cached.buf), {
        status: 200,
        headers: { ...cacheHeaders, "Content-Type": cached.ct },
      });
    }

    // ✅ NOTE: we intentionally DO NOT cache upstream fetches.
    const upstream = await fetch(parsed.toString(), {
      cache: "no-store",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.dramaticadventure.com/",
      },
      redirect: "follow",
    });

    // 🔐 Re-validate host after redirects (Drive → googleusercontent)
    const finalUrl = new URL(upstream.url);
    const finalHost = finalUrl.hostname.toLowerCase();

    if (!isAllowedHost(finalHost)) {
      return jsonErr(403, {
        error: "Redirected host not allowed",
        host: finalHost,
      });
    }

    if (!upstream.ok) {
      return jsonErr(502, {
        error: "Upstream fetch failed",
        status: upstream.status,
        host,
      });
    }

    // Optional: enforce max payload size if Content-Length is present
    const lenHeader = upstream.headers.get("content-length");
    if (lenHeader) {
      const len = Number(lenHeader);
      if (Number.isFinite(len) && len > MAX_UPSTREAM_BYTES) {
        return jsonErr(413, {
          error: "Upstream image too large",
          bytes: len,
          maxBytes: MAX_UPSTREAM_BYTES,
          host,
        });
      }
    }

    const contentType = upstream.headers.get("content-type") || "";
    const ct = contentType.toLowerCase();

    // Only reject when it's clearly NOT an image (html/text/json/xml).
    if (ct) {
      const clearlyNotImage =
        ct.startsWith("text/") ||
        ct.includes("html") ||
        ct.includes("json") ||
        ct.includes("xml");

      if (clearlyNotImage) {
        return jsonErr(415, { error: "URL is not an image", contentType, host });
      }
    }

    const inputBuf = Buffer.from(await upstream.arrayBuffer());

    // If Content-Length wasn’t provided, enforce size after download.
    if (inputBuf.byteLength > MAX_UPSTREAM_BYTES) {
      return jsonErr(413, {
        error: "Upstream image too large",
        bytes: inputBuf.byteLength,
        maxBytes: MAX_UPSTREAM_BYTES,
        host,
      });
    }

    // ✅ Proxy-only response: preserve upstream bytes and content-type.
    const outCt = contentType || "application/octet-stream";
    const outBuf = new Uint8Array(inputBuf);

    instanceCacheSet(cacheKey, outBuf, outCt);

    // fileId requests are immutable — cache in the browser for 24h.
    // url= requests may change, so keep no-store for those.
    const cacheHeaders = fileId ? fileIdCacheHeaders() : noStoreHeaders();

    return new NextResponse(Buffer.from(outBuf), {
      status: 200,
      headers: {
        ...cacheHeaders,
        "Content-Type": outCt,
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : JSON.stringify(err);

    return NextResponse.json(
      { error: "Image proxy error", detail: message },
      { status: 500, headers: noStoreHeaders() }
    );
  }
}
