// app/api/img/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0; // ✅ never ISR-cache this route

// Bump this any time you want to confirm you're running the expected build.
const IMG_ROUTE_BUILD = "2026-02-12T14:05-proxy-only-redirect-fallback-usercontent-fix";

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

  // ✅ Squarespace image CDN
  "images.squarespace-cdn.com",
]);

// Safety: prevent very large upstream images from blowing memory.
// (This is upstream payload size, not final transformed size.)
const MAX_UPSTREAM_BYTES = 18 * 1024 * 1024; // 18MB

function noStoreHeaders(extra?: Record<string, string>) {
  return {
    // ✅ kill caching everywhere (browser, CDN, Next, proxies)
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Accept",
    "X-Img-Route-Build": IMG_ROUTE_BUILD,
    // ✅ prevents content-type sniffing (defense-in-depth for proxy bytes)
    "X-Content-Type-Options": "nosniff",
    ...(extra || {}),
  };
}

function jsonErr(
  status: number,
  payload: Record<string, unknown>,
  extra?: Record<string, string>
) {
  return NextResponse.json(payload, { status, headers: noStoreHeaders(extra) });
}

/**
 * HEAD errors should be bodyless.
 * We still surface minimal debug info via headers.
 */
function headErr(
  status: number,
  payload: Record<string, unknown>,
  extra?: Record<string, string>
) {
  const err = String(payload.error || "error");
  const host = payload.host ? String(payload.host) : "";
  const hint = payload.hint ? String(payload.hint) : "";
  const detail = payload.detail ? String(payload.detail) : "";

  const headers: Record<string, string> = {
    ...noStoreHeaders(extra),
    "X-Img-Error": err,
  };
  if (host) headers["X-Img-Host"] = host;
  if (hint) headers["X-Img-Hint"] = hint;
  if (detail) headers["X-Img-Detail"] = detail.slice(0, 180);

  return new NextResponse(null, { status, headers });
}

function isAllowedProtocol(p: string) {
  return p === "https:" || p === "http:";
}

function normalizeUrlOrNull(url: string): URL | null {
  try {
    const u = new URL(url);
    if (!isAllowedProtocol(u.protocol)) return null;
    // Disallow auth-in-url (defense-in-depth)
    if (u.username || u.password) return null;
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

  // ✅ PATCH: Drive increasingly redirects to drive.usercontent.google.com
  // This is a DIFFERENT base domain than googleusercontent.com.
  if (host === "usercontent.google.com") return true;
  if (host.endsWith(".usercontent.google.com")) return true;

  return false;
}

function isPlausibleDriveFileId(id: string) {
  const s = (id || "").trim();
  if (s.length < 10 || s.length > 200) return false;
  return /^[a-zA-Z0-9_-]+$/.test(s);
}

/**
 * ✅ PATCH: use export=view (more reliable for returning image/*)
 * ✅ PATCH: carry v through to upstream as a cache-bust marker
 */
function buildDriveUcUrl(fileId: string, v?: string) {
  const id = (fileId || "").trim();
  if (!id) return "";
  const u = new URL("https://drive.google.com/uc");
  u.searchParams.set("export", "view");
  u.searchParams.set("id", id);
  if (v) u.searchParams.set("v", v);
  return u.toString();
}

/**
 * Add/override v on any upstream URL safely.
 * (No-op if url invalid; caller already validates in normal paths.)
 */
function withV(rawUrl: string, v?: string) {
  const vv = String(v || "").trim();
  if (!vv) return rawUrl;

  try {
    const u = new URL(rawUrl);
    u.searchParams.set("v", vv);
    return u.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * HEAD: lightweight preflight checks (NO upstream fetch)
 */
export async function HEAD(req: Request) {
  const { searchParams } = new URL(req.url);

  const url = (searchParams.get("url") || "").trim();
  const fileId = (searchParams.get("fileId") || searchParams.get("id") || "").trim();
  const v = (searchParams.get("v") || searchParams.get("cacheKey") || "").trim();

  if (fileId && !isPlausibleDriveFileId(fileId)) {
    return headErr(400, { error: "Invalid fileId" });
  }

  const effectiveUrl = url
    ? withV(url, v)
    : fileId
      ? buildDriveUcUrl(fileId, v)
      : "";

  if (!effectiveUrl) return headErr(400, { error: "Missing url" });

  const parsed = normalizeUrlOrNull(effectiveUrl);
  if (!parsed) return headErr(400, { error: "Invalid url/protocol" });

  const host = parsed.hostname.toLowerCase();
  if (!isAllowedHost(host)) {
    return headErr(403, {
      error: "Host not allowed",
      host,
      hint: "Add this host to ALLOWED_HOSTS in app/api/img/route.ts",
    });
  }

  return new NextResponse(null, { status: 200, headers: noStoreHeaders() });
}

/**
 * GET: proxy-only (no sharp).
 * ✅ PATCH: if server-side fetch fails (DNS/VPN/etc), redirect the browser to upstream URL.
 * That keeps UI working even when Node can't resolve DNS.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const url = (searchParams.get("url") || "").trim();
  const fileId = (searchParams.get("fileId") || searchParams.get("id") || "").trim();
  const v = (searchParams.get("v") || searchParams.get("cacheKey") || "").trim();

  if (fileId && !isPlausibleDriveFileId(fileId)) {
    return jsonErr(400, { error: "Invalid fileId" });
  }

  // Build effective URL (and thread v through)
  const effectiveUrl = url
    ? withV(url, v)
    : fileId
      ? buildDriveUcUrl(fileId, v)
      : "";

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

  try {
    const upstream = await fetch(parsed.toString(), {
      cache: "no-store",
      headers: {
        Accept: "image/*,*/*;q=0.8",
      },
      redirect: "follow",
    });

    // 🔐 Re-validate host after redirects (Drive → googleusercontent / usercontent)
    const finalUrl = new URL(upstream.url);
    const finalHost = finalUrl.hostname.toLowerCase();

    if (!isAllowedHost(finalHost)) {
      return jsonErr(
        403,
        {
          error: "Redirected host not allowed",
          host: finalHost,
        },
        {
          "X-Img-Redirected-Host": finalHost,
        }
      );
    }

    if (!upstream.ok) {
      return jsonErr(
        502,
        { error: "Upstream fetch failed", status: upstream.status, host: finalHost },
        { "X-Img-Upstream": finalHost }
      );
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
          host: finalHost,
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
        return jsonErr(415, { error: "URL is not an image", contentType, host: finalHost });
      }
    }

    const inputBuf = Buffer.from(await upstream.arrayBuffer());

    // If Content-Length wasn’t provided, enforce size after download.
    if (inputBuf.byteLength > MAX_UPSTREAM_BYTES) {
      return jsonErr(413, {
        error: "Upstream image too large",
        bytes: inputBuf.byteLength,
        maxBytes: MAX_UPSTREAM_BYTES,
        host: finalHost,
      });
    }

    // ✅ Proxy-only response: preserve upstream bytes and content-type.
    const outCt = contentType || "application/octet-stream";

    return new NextResponse(new Uint8Array(inputBuf), {
      status: 200,
      headers: {
        // Cache images briefly; our callers pass v=uploadedAt so cache busting is automatic.
        "Cache-Control": "public, max-age=600, stale-while-revalidate=86400",
        Vary: "Accept",
        "X-Img-Route-Build": IMG_ROUTE_BUILD,
        "X-Content-Type-Options": "nosniff",
        "X-Img-Upstream": finalHost,
        "Content-Type": outCt,
      },
    });
  } catch (err: unknown) {
    // ✅ PATCH: redirect fallback on fetch failure (DNS/VPN/etc).
    const msg =
      err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);

    const redirectUrl = parsed.toString();
    const res = NextResponse.redirect(redirectUrl, 302);
    const h = noStoreHeaders({
      "X-Img-Error": "Upstream fetch failed (redirect fallback)",
      "X-Img-Detail": msg.slice(0, 180),
      "X-Img-Redirect": new URL(redirectUrl).hostname,
    });
    Object.entries(h).forEach(([k, v2]) => res.headers.set(k, v2));
    return res;
  }
}
