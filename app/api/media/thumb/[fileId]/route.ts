// app/api/media/thumb/[fileId]/route.ts
//
// Drive thumbnail proxy — fileId is in the URL path so Netlify's CDN always keys
// each file independently. Query-param–keyed routes can be collapsed to a single
// cache entry by Netlify's CDN even with no-store headers (the plugin has been
// observed overriding Netlify-CDN-Cache-Control on query-param routes).
import { NextResponse } from "next/server";
import { driveClient } from "@/lib/googleClients";
import { orientImageBuffer } from "@/lib/orientImageBuffer";
import { decodeHeicToJpeg } from "@/lib/decodeHeic";

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

function imageHeaders(fileId: string, contentType: string) {
  return {
    "Content-Type": contentType,
    "Cache-Control": BROWSER_CACHE,
    "Netlify-CDN-Cache-Control": CDN_CACHE,
    "Netlify-Cache-Tag": `headshot-${fileId}`,
  };
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

  // Fetch file metadata once. We need thumbnailLink (the fast path) and mimeType
  // (to detect HEIC/HEIF, whose orientation Drive's thumbnails get wrong).
  let rawThumb = "";
  let mimeType = "";
  try {
    const meta = await drive.files.get({
      fileId,
      fields: "id,thumbnailLink,mimeType",
      supportsAllDrives: true,
    } as any);
    rawThumb = String((meta.data as any)?.thumbnailLink || "").trim();
    mimeType = String((meta.data as any)?.mimeType || "").trim();
  } catch {
    // metadata fetch failed — fall through to the raw-download fallback below.
  }

  const isHeic = /heic|heif/i.test(mimeType);

  // HEIC/HEIF first: Drive's generated thumbnail bakes the WRONG orientation and
  // strips the EXIF flag, so the sideways pixels can't be corrected after the
  // fact (and browsers can't render HEIC at all). sharp can't decode HEIC/HEVC
  // either. So decode the ORIGINAL with the WASM/asm.js HEIC decoder (which
  // applies the image's stored rotation → upright JPEG pixels), then let sharp
  // downscale. If HEIC decoding is unavailable we fall through to Drive's
  // (sideways but at least visible) JPEG thumbnail instead of an unrenderable
  // HEIC.
  if (isHeic) {
    try {
      const r = await drive.files.get(
        { fileId, alt: "media", supportsAllDrives: true } as any,
        { responseType: "arraybuffer" } as any
      );
      const jpeg = await decodeHeicToJpeg(
        Buffer.from(r.data as unknown as ArrayBuffer)
      );
      if (jpeg) {
        // Already upright JPEG from the decoder; orientImageBuffer just downscales.
        const { buffer: outBuf, contentType } = await orientImageBuffer(
          jpeg,
          "image/jpeg",
          { maxWidth: w || 2400 }
        );
        return new NextResponse(outBuf as any, {
          headers: imageHeaders(fileId, contentType),
        });
      }
      // HEIC decode unavailable/failed — fall through to the thumbnail path.
    } catch {
      // fall through to the thumbnail path
    }
  }

  // ✅ Preferred (non-HEIC): use Drive thumbnailLink, proxy bytes (no redirect).
  // We validate the returned image dimensions — Drive caps thumbnails for some
  // formats (especially WebP) and returns a low-res image even when a large
  // size is requested.  If the thumbnail is smaller than half the requested
  // width we fall through to the full-file download instead.
  if (rawThumb) {
    try {
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
        if (buf.byteLength >= MIN_ACCEPTABLE_BYTES) {
          const upstreamType = resp.headers.get("content-type") || "image/jpeg";
          // Drive bakes EXIF orientation into small thumbnails but not always
          // into larger ones, so normalize here to guarantee upright output.
          const { buffer: outBuf, contentType } = await orientImageBuffer(
            Buffer.from(buf),
            upstreamType
          );
          return new NextResponse(outBuf as any, {
            headers: imageHeaders(fileId, contentType),
          });
        }
      }
    } catch {
      // fall through to full-file download
    }
  }

  // Fallback: download original bytes from Drive
  try {
    const r = await drive.files.get(
      { fileId, alt: "media", supportsAllDrives: true } as any,
      { responseType: "arraybuffer" } as any
    );

    const upstreamType =
      (r.headers?.["content-type"] as string) ||
      (r.headers?.["Content-Type"] as string) ||
      "image/jpeg";

    // The full-file fallback serves raw Drive bytes. If they're HEIC (sharp
    // can't decode it), run the dedicated HEIC decoder first; otherwise pass the
    // bytes straight to sharp. orientImageBuffer then normalizes orientation and
    // downscales so every browser renders it upright.
    let srcBuf: Buffer = Buffer.from(r.data as unknown as ArrayBuffer);
    let srcType = upstreamType;
    if (/heic|heif/i.test(upstreamType)) {
      const jpeg = await decodeHeicToJpeg(srcBuf);
      if (jpeg) {
        srcBuf = jpeg;
        srcType = "image/jpeg";
      }
    }
    const { buffer: outBuf, contentType } = await orientImageBuffer(
      srcBuf,
      srcType,
      { maxWidth: w || 2400 }
    );

    return new NextResponse(outBuf as any, {
      headers: imageHeaders(fileId, contentType),
    });
  } catch (e: any) {
    const msg = e?.message || "thumb fetch failed";
    return NextResponse.json(
      { error: msg },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
}
