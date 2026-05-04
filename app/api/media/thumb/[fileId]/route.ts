// app/api/media/thumb/[fileId]/route.ts
//
// Drive thumbnail proxy — fileId is in the URL path so Netlify's CDN always keys
// each file independently. Query-param–keyed routes can be collapsed to a single
// cache entry by Netlify's CDN even with no-store headers (the plugin has been
// observed overriding Netlify-CDN-Cache-Control on query-param routes).
import { NextResponse } from "next/server";
import { driveClient } from "@/lib/googleClients";

export const runtime = "nodejs";

// Browser: private cache for 1 year (file IDs are immutable Drive content).
// CDN: cache for 24 h per file-ID path — safe because each fileId gets its own
// CDN cache key (that's exactly why this route uses path-based routing instead
// of a query-param). stale-while-revalidate lets Netlify serve the cached bytes
// while quietly refreshing in the background.
const BROWSER_CACHE  = "private, max-age=31536000, stale-while-revalidate=86400";
const CDN_CACHE      = "public, s-maxage=86400, stale-while-revalidate=86400";

function clampInt(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function bumpThumbSize(url: string, w: number) {
  if (!w) return url;
  return url.replace(/=s\d+(-c)?/i, `=s${w}$1`);
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const { fileId: rawFileId } = await params;
  const fileId = decodeURIComponent(String(rawFileId || "")).trim();

  const { searchParams } = new URL(req.url);
  const wRaw = String(searchParams.get("w") || "").trim();
  const w = wRaw ? clampInt(parseInt(wRaw, 10) || 0, 64, 2400) : 0;

  if (!fileId) {
    return NextResponse.json(
      { error: "fileId required" },
      { status: 400, headers: { "Cache-Control": "no-store" } }
    );
  }

  const drive = driveClient();

  // ✅ Preferred: use Drive thumbnailLink, proxy bytes (no redirect).
  // We validate the returned image dimensions — Drive caps thumbnails for some
  // formats (especially WebP) and returns a low-res image even when a large
  // size is requested.  If the thumbnail is smaller than half the requested
  // width we fall through to the full-file download instead.
  try {
    const meta = await drive.files.get({
      fileId,
      fields: "id,thumbnailLink,mimeType",
      supportsAllDrives: true,
    } as any);

    const rawThumb = String((meta.data as any)?.thumbnailLink || "").trim();

    if (rawThumb) {
      const thumbUrl = bumpThumbSize(rawThumb, w);

      const resp = await fetch(thumbUrl, { cache: "no-store" });

      if (resp.ok) {
        const buf = await resp.arrayBuffer();

        // If the caller asked for a large image but Drive returned a tiny
        // thumbnail (< half the requested size), the image will look blurry
        // when stretched.  Detect this by checking Content-Length vs the
        // expected bytes for a decent-quality JPEG at the requested size:
        // a 1200px JPEG is typically 80–300 kB; anything < 20 kB is likely a
        // Drive placeholder thumbnail, not the real image.
        const MIN_ACCEPTABLE_BYTES = w > 400 ? 20_000 : 5_000;
        if (buf.byteLength < MIN_ACCEPTABLE_BYTES) {
          throw new Error("Thumbnail too small — falling back to full file");
        }

        const contentType = resp.headers.get("content-type") || "image/jpeg";
        return new NextResponse(buf as any, {
          headers: {
            "Content-Type": contentType,
            "Cache-Control": BROWSER_CACHE,
            "Netlify-CDN-Cache-Control": CDN_CACHE,
          },
        });
      }
    }
  } catch {
    // fall through to full-file download
  }

  // Fallback: download original bytes from Drive
  try {
    const r = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true } as any,
      { responseType: "arraybuffer" } as any
    );

    const contentType =
      (r.headers?.["content-type"] as string) ||
      (r.headers?.["Content-Type"] as string) ||
      "image/jpeg";

    return new NextResponse(r.data as any, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": BROWSER_CACHE,
        "Netlify-CDN-Cache-Control": CDN_CACHE,
      },
    });
  } catch (e: any) {
    const msg = e?.message || "thumb fetch failed";
    return NextResponse.json(
      { error: msg },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
