// app/api/img/route.ts
import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  // ✅ Squarespace image CDN (your log shows this exact host)
  "images.squarespace-cdn.com",
]);

// Safety: prevent very large upstream images from blowing memory.
// (This is upstream payload size, not final webp size.)
const MAX_UPSTREAM_BYTES = 18 * 1024 * 1024; // 18MB

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function jsonErr(status: number, payload: Record<string, unknown>) {
  return NextResponse.json(payload, { status });
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
  return ALLOWED_HOSTS.has(host);
}

/**
 * HEAD: allow lightweight preflight checks (used by your ProfileCard poster preflight)
 */
export async function HEAD(req: Request) {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url") || "";
  if (!url) return jsonErr(400, { error: "Missing url" });

  const parsed = normalizeUrlOrNull(url);
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
      "Cache-Control": "public, max-age=300",
      Vary: "Accept",
    },
  });
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const url = searchParams.get("url") || "";
    const w = clamp(Number(searchParams.get("w") || "1400"), 200, 2400);
    const q = clamp(Number(searchParams.get("q") || "72"), 40, 90);

    if (!url) return jsonErr(400, { error: "Missing url" });

    const parsed = normalizeUrlOrNull(url);
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

    // Fetch remote image (more browser-like headers help with some CDNs)
    const upstream = await fetch(parsed.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        Accept: "image/avif,image/webp,image/*,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        // Some CDNs are fussier without a referer; harmless if ignored.
        Referer: "https://www.dramaticadventure.com/",
      },
      // Cache upstream fetch in Next’s data cache a bit (helps repeat loads)
      next: { revalidate: 60 * 60 * 24 }, // 24h
    });

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
    // Some servers omit/lie about content-type; only reject when it's clearly non-image.
    if (contentType && !contentType.startsWith("image/")) {
      return jsonErr(415, { error: "URL is not an image", contentType, host });
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
    const out = await sharp(inputBuf, { failOn: "none" })
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
        // cache aggressively; URL is parameterized by (url,w,q)
        "Cache-Control": "public, max-age=31536000, immutable",
        Vary: "Accept",
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : typeof err === "string"
          ? err
          : JSON.stringify(err);

    return NextResponse.json({ error: "Image proxy error", detail: message }, { status: 500 });
  }
}
