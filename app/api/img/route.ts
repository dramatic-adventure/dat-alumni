// app/api/img/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0; // ✅ never ISR-cache this route

// Bump this any time you want to confirm you're running the expected build.
const IMG_ROUTE_BUILD = "2026-02-01T21:48";

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
// (This is upstream payload size, not final webp size.)
const MAX_UPSTREAM_BYTES = 18 * 1024 * 1024; // 18MB

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function noStoreHeaders() {
  return {
    // ✅ kill caching everywhere (browser, CDN, Next, proxies)
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Accept",
  };
}

function jsonErr(status: number, payload: Record<string, unknown>) {
  return NextResponse.json(payload, {
    status,
    headers: {
      ...noStoreHeaders(),
      "X-Img-Route-Build": IMG_ROUTE_BUILD,
    },
  });
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
 * HEAD: allow lightweight preflight checks (used by your ProfileCard poster preflight)
 */
export async function HEAD(req: Request) {
  const { searchParams } = new URL(req.url);

  const url = (searchParams.get("url") || "").trim();
  const fileId =
    (searchParams.get("fileId") || searchParams.get("id") || "").trim();

  // ✅ If fileId is present, validate it BEFORE building the effective URL.
  // This prevents junk like fileId=... from returning 200.
  if (fileId && !isPlausibleDriveFileId(fileId)) {
    return jsonErr(400, { error: "Invalid fileId" });
  }

  // ✅ Accept either url=... OR fileId=...
  const effectiveUrl = url || (fileId ? buildDriveUcUrl(fileId) : "");
  if (!effectiveUrl) return jsonErr(400, { error: "Missing url" });

  // ✅ IMPORTANT: parse effectiveUrl (not raw url)
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

  // We don’t fetch upstream for HEAD — just say “ok, allowed”
  return new NextResponse(null, {
    status: 200,
    headers: {
      ...noStoreHeaders(),
      "X-Img-Route-Build": IMG_ROUTE_BUILD,
    },
  });
}

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

    const w = clamp(Number(searchParams.get("w") || "1400"), 200, 2400);
    const q = clamp(Number(searchParams.get("q") || "72"), 40, 90);

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

    // ✅ NOTE: we intentionally DO NOT cache upstream fetches.
    // This prevents stale headshots when Drive/CDNs cache aggressively.
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
    // Some CDNs/hosts (including Drive flows) may return octet-stream for images.
    // Only reject when it's clearly NOT an image (html/text/json).
    const ct = contentType.toLowerCase();

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

    // Resize + convert
    // Resize + convert (lazy-load sharp so module init doesn't crash)
    let sharpFn: any;
    try {
      const mod: any = await import("sharp");
      // Works across CJS + ESM shapes:
      // - CJS: mod is the function
      // - ESM: mod.default is the function
      sharpFn = typeof mod === "function" ? mod : mod?.default;
      if (typeof sharpFn !== "function") {
        return jsonErr(500, {
          error: "sharp loaded but is not callable",
          detail: `typeof mod=${typeof mod}, typeof mod.default=${typeof mod?.default}`,
        });
      }
    } catch (e) {
      const detail =
        e instanceof Error
          ? e.message
          : typeof e === "string"
            ? e
            : JSON.stringify(e);

      return jsonErr(500, {
        error: "sharp failed to load in production",
        detail,
        hint: "Native sharp binary unavailable in this environment",
      });
    }

    const out = await sharpFn(inputBuf, { failOn: "none" })
      .rotate() // respect EXIF orientation
      .resize({
        width: w,
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality: q })
      .toBuffer();



    // ✅ BodyInit-safe for Response/NextResponse
    const body = new Uint8Array(out);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        ...noStoreHeaders(),
        "X-Img-Route-Build": IMG_ROUTE_BUILD,
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
      {
        status: 500,
        headers: {
          ...noStoreHeaders(),
          "X-Img-Route-Build": IMG_ROUTE_BUILD,
        },
      }
    );
  }
}
