// lib/orientImageBuffer.ts
//
// Display-time orientation guard for image bytes served by our proxies
// (e.g. /api/media/thumb). Companion to lib/normalizeUploadImage.ts, which fixes
// images at upload time; this one fixes images already sitting in Drive.
//
// Why it's needed: Google Drive bakes EXIF orientation into its *small* generated
// thumbnails but not consistently into larger ones, and the full-file fallback
// serves raw bytes untouched. So the same headshot can look upright in a small
// thumbnail yet sideways at ?w=900. Browsers other than Safari also can't render
// HEIC at all. Running served bytes through sharp.rotate() (which applies and
// strips the EXIF orientation flag) and converting HEIC/HEIF to JPEG makes every
// size render identically and upright.

// sharp is loaded lazily (not a top-level static import) so that if its native
// binary is missing from the serverless bundle the route degrades to serving the
// original bytes instead of 500ing at module load. See loadSharp() below.
import type sharpType from "sharp";

// Cached lazy loader. Resolves to the sharp factory, or null if it can't load
// (e.g. the native .node binary was pruned from the function bundle). The null
// is cached so we don't retry the failing import on every request.
let sharpPromise: Promise<typeof sharpType | null> | undefined;
function loadSharp(): Promise<typeof sharpType | null> {
  if (!sharpPromise) {
    sharpPromise = import("sharp")
      .then((m) => (m.default ?? m) as typeof sharpType)
      .catch((err) => {
        console.warn(
          "orientImageBuffer: sharp unavailable, serving original bytes:",
          err instanceof Error ? err.message : String(err)
        );
        return null;
      });
  }
  return sharpPromise;
}

// Formats a browser can render directly. (gif handled separately so we never
// flatten an animation.)
const BROWSER_RENDERABLE = new Set(["jpeg", "png", "webp", "gif"]);
// Formats we always transcode to JPEG (not universally renderable in browsers).
const NEEDS_TRANSCODE = new Set(["heif", "tiff", "avif"]);

export type OrientedImage = { buffer: Buffer; contentType: string };

/**
 * Normalize image orientation (and format) for browser display.
 *
 * - Already-correct JPEG/PNG/WebP (no EXIF orientation flag) are returned
 *   untouched — no needless re-encode.
 * - Images carrying an EXIF orientation flag are physically rotated and the flag
 *   stripped.
 * - HEIC/HEIF/TIFF/AVIF are transcoded to JPEG.
 * - GIFs and anything sharp can't parse pass through unchanged.
 * - Any failure falls back to the original bytes so the proxy never 500s.
 *
 * @param input        Original image bytes.
 * @param contentType  The upstream Content-Type (used as the fallback).
 * @param opts.maxWidth Optional long-edge cap (px). When set, re-encoded output
 *                      is downscaled to this width (never upscaled). Used by the
 *                      thumb proxy when it processes a full-size original so it
 *                      doesn't ship a multi-thousand-pixel image for a small w.
 */
export async function orientImageBuffer(
  input: Buffer,
  contentType: string,
  opts: { maxWidth?: number } = {}
): Promise<OrientedImage> {
  const sharp = await loadSharp();
  if (!sharp) return { buffer: input, contentType };

  try {
    const meta = await sharp(input, { failOn: "none" }).metadata();
    const fmt = meta.format;
    if (!fmt) return { buffer: input, contentType };

    // Never re-encode animated GIFs.
    if (fmt === "gif") return { buffer: input, contentType };

    const hasOrientation =
      typeof meta.orientation === "number" && meta.orientation > 1;
    const transcode = NEEDS_TRANSCODE.has(fmt);
    // Does the caller's maxWidth actually require a downscale of this image?
    const needsResize =
      typeof opts.maxWidth === "number" &&
      opts.maxWidth > 0 &&
      typeof meta.width === "number" &&
      meta.width > opts.maxWidth;

    // Fast path: already a browser-renderable format with upright pixels that
    // also doesn't need downscaling.
    if (
      BROWSER_RENDERABLE.has(fmt) &&
      !hasOrientation &&
      !transcode &&
      !needsResize
    ) {
      return { buffer: input, contentType };
    }

    const pipeline = sharp(input, { failOn: "none" }).rotate();
    if (opts.maxWidth && opts.maxWidth > 0) {
      pipeline.resize({ width: opts.maxWidth, withoutEnlargement: true });
    }

    if (fmt === "png") {
      return { buffer: await pipeline.png().toBuffer(), contentType: "image/png" };
    }
    if (fmt === "webp") {
      return {
        buffer: await pipeline.webp({ quality: 90 }).toBuffer(),
        contentType: "image/webp",
      };
    }
    // jpeg (rotate in place) and heif/tiff/avif (transcode) → JPEG.
    return {
      buffer: await pipeline.jpeg({ quality: 90 }).toBuffer(),
      contentType: "image/jpeg",
    };
  } catch (err) {
    console.warn(
      "orientImageBuffer: serving original (could not process):",
      err instanceof Error ? err.message : String(err)
    );
    return { buffer: input, contentType };
  }
}
