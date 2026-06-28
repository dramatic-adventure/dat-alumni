// lib/normalizeUploadImage.ts
//
// Normalizes uploaded images at the single upload chokepoint (/app/api/upload).
//
// Why this exists: phone photos (especially iPhone HEIC, but also many JPEGs)
// carry an EXIF "orientation" flag instead of storing upright pixels. Different
// renderers honor that flag inconsistently — in particular, Google Drive's
// generated thumbnails (which our profile pages display, since browsers can't
// render HEIC) can bake the rotation in differently than the original. The net
// effect was landscape headshots appearing rotated inside the 4:5 frame.
//
// The fix: bake EXIF orientation into the actual pixels and strip the flag, and
// convert HEIC/HEIF to JPEG so every browser renders the real image rather than
// leaning on Drive's thumbnail. We also cap dimensions to keep Drive lean — the
// display path downscales anyway.
//
// sharp's prebuilt binaries include libheif (verified for the Linux runtime
// Netlify uses), so HEIC decode works without any extra dependency.

// sharp is loaded lazily (not a top-level static import) so that if its native
// binary is missing from the serverless bundle the upload still succeeds with the
// original bytes instead of 500ing at module load. See loadSharp() below.
import type sharpType from "sharp";
import { decodeHeicToJpeg } from "./decodeHeic";

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
          "normalizeUploadImage: sharp unavailable, keeping original bytes:",
          err instanceof Error ? err.message : String(err)
        );
        return null;
      });
  }
  return sharpPromise;
}

// Long-edge cap and JPEG quality for normalized output. 2400px is crisp on any
// screen; the thumbnail proxy downsizes further for display.
const MAX_EDGE = 2400;
const JPEG_QUALITY = 88;

// Still raster formats we re-encode. Animated GIFs are intentionally excluded
// (re-encoding would flatten the animation), as are video/PDF (sharp can't read
// them and they fall through untouched).
const PROCESSABLE_FORMATS = new Set(["jpeg", "png", "webp", "heif"]);

export type NormalizeResult = {
  buffer: Buffer;
  mimeType: string;
  /** True when we actually re-encoded the bytes. */
  changed: boolean;
};

/**
 * Apply EXIF orientation and convert HEIC/HEIF → JPEG.
 *
 * - HEIC/HEIF is decoded to an upright JPEG and kept at FULL resolution (no
 *   downscale) so the original quality is preserved on file.
 * - Other raster formats (JPEG/PNG/WebP/AVIF) have EXIF orientation baked in and
 *   are capped at MAX_EDGE to keep Drive lean.
 *
 * Safe by design:
 *  - `.rotate()` with no argument only applies the image's own EXIF orientation.
 *    An already-upright photo (orientation = normal) is not rotated.
 *  - Non-images (video, PDF), animated GIFs, and anything sharp can't parse are
 *    returned untouched.
 *  - Any failure falls back to the original buffer so uploads never break.
 *
 * @param buffer   Raw uploaded bytes.
 * @param mimeType Declared MIME type (may be "application/octet-stream").
 * @param filename Original filename, used as a fallback hint for octet-stream.
 */
export async function normalizeUploadImage(
  buffer: Buffer,
  mimeType: string,
  filename = ""
): Promise<NormalizeResult> {
  const mime = (mimeType || "").toLowerCase();
  const nameLower = (filename || "").toLowerCase();

  const looksLikeImage =
    mime.startsWith("image/") ||
    ((mime === "application/octet-stream" || mime === "") &&
      /\.(jpe?g|png|webp|heic|heif)$/.test(nameLower));

  // Never touch animated GIFs or non-images.
  if (
    !looksLikeImage ||
    mime.includes("gif") ||
    nameLower.endsWith(".gif")
  ) {
    return { buffer, mimeType, changed: false };
  }

  // HEIC/HEIF: sharp's prebuilt binary can't decode HEVC, so decode with the
  // dedicated decoder (libheif applies the stored rotation → upright pixels).
  // Keep HEIC uploads at FULL resolution on file — these are high-quality phone
  // photos worth archiving; the thumb proxy downsizes per request for display,
  // and the lightbox serves this full image. AVIF (mime image/avif) is NOT
  // matched here and is downscaled by sharp natively below.
  const isHeic =
    mime.includes("heic") ||
    mime.includes("heif") ||
    /\.(heic|heif)$/.test(nameLower);

  if (isHeic) {
    const jpeg = await decodeHeicToJpeg(buffer);
    if (!jpeg) {
      // No HEIC support / undecodable — leave the original untouched.
      return { buffer, mimeType, changed: false };
    }
    return { buffer: jpeg, mimeType: "image/jpeg", changed: true };
  }

  const sharp = await loadSharp();
  if (!sharp) return { buffer, mimeType, changed: false };

  try {
    const meta = await sharp(buffer, { failOn: "none" }).metadata();
    const fmt = meta.format;
    if (!fmt || !PROCESSABLE_FORMATS.has(fmt)) {
      return { buffer, mimeType, changed: false };
    }

    const pipeline = sharp(buffer, { failOn: "none" })
      // Apply EXIF orientation into the pixels and drop the flag. No-op for
      // already-upright images.
      .rotate()
      // Cap the long edge; never upscale smaller images.
      .resize({
        width: MAX_EDGE,
        height: MAX_EDGE,
        fit: "inside",
        withoutEnlargement: true,
      });

    // AVIF (reported by sharp as "heif") and JPEG → JPEG. PNG/WebP keep their
    // format (preserves transparency where it matters).
    if (fmt === "heif" || fmt === "jpeg") {
      const out = await pipeline.jpeg({ quality: JPEG_QUALITY }).toBuffer();
      return { buffer: out, mimeType: "image/jpeg", changed: true };
    }
    if (fmt === "png") {
      const out = await pipeline.png().toBuffer();
      return { buffer: out, mimeType: "image/png", changed: true };
    }
    if (fmt === "webp") {
      const out = await pipeline.webp({ quality: JPEG_QUALITY }).toBuffer();
      return { buffer: out, mimeType: "image/webp", changed: true };
    }

    return { buffer, mimeType, changed: false };
  } catch (err) {
    // Corrupt/unsupported input — leave the original untouched so the upload
    // still succeeds.
    console.warn(
      "normalizeUploadImage: skipped (could not process):",
      err instanceof Error ? err.message : String(err)
    );
    return { buffer, mimeType, changed: false };
  }
}
