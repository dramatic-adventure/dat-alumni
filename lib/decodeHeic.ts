// lib/decodeHeic.ts
//
// HEIC/HEIF → JPEG decoder. This exists because sharp's prebuilt binary cannot
// decode HEIC/HEVC (its libvips is built with AVIF/AV1 only — HEVC is patent-
// encumbered), so the upload normalizer and the thumb proxy can't rely on sharp
// for iPhone HEIC photos. heic-convert wraps libheif compiled to pure JS
// (asm.js, no native binary and no separate .wasm file), which decodes HEVC and
// applies the image's stored rotation, yielding upright JPEG pixels.
//
// It's loaded lazily and never throws: callers get null when HEIC support is
// unavailable or the bytes can't be decoded, and degrade gracefully from there.

import type heicConvertType from "heic-convert";

// Cached lazy loader for heic-convert (large asm.js module — only pulled in when
// a HEIC is actually encountered). null is cached on failure so we don't retry a
// broken import per request.
let convertPromise: Promise<typeof heicConvertType | null> | undefined;
function loadHeicConvert(): Promise<typeof heicConvertType | null> {
  if (!convertPromise) {
    convertPromise = import("heic-convert")
      .then((m) => (m.default ?? m) as typeof heicConvertType)
      .catch((err) => {
        console.warn(
          "decodeHeic: heic-convert unavailable:",
          err instanceof Error ? err.message : String(err)
        );
        return null;
      });
  }
  return convertPromise;
}

/**
 * Decode HEIC/HEIF bytes to an upright JPEG buffer.
 *
 * @returns the JPEG buffer, or null if HEIC support is unavailable or the bytes
 *          could not be decoded (caller should fall back to other handling).
 */
export async function decodeHeicToJpeg(
  input: Buffer,
  quality = 0.9
): Promise<Buffer | null> {
  const convert = await loadHeicConvert();
  if (!convert) return null;
  try {
    const out = await convert({ buffer: input, format: "JPEG", quality });
    return Buffer.from(out);
  } catch (err) {
    console.warn(
      "decodeHeic: could not decode HEIC bytes:",
      err instanceof Error ? err.message : String(err)
    );
    return null;
  }
}
