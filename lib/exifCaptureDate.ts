// lib/exifCaptureDate.ts
//
// Reads a photo's OWN capture moment — EXIF DateTimeOriginal — out of the
// uploaded bytes.
//
// WHY THIS EXISTS. A capture row's `createdAt` is when the artist tapped Save.
// For a photo pulled out of the camera roll after the trip that is the upload
// moment, not the moment the shutter fired, so an entire trip backfilled from
// home would timestamp as "after the trip" and place into the wrong chapter (or
// none). EXIF is the only surviving record of when the photo was actually taken.
//
// WHY IT RUNS HERE AND NOWHERE ELSE. lib/normalizeUploadImage bakes EXIF
// orientation into the pixels, strips the metadata, and re-encodes HEIC to JPEG.
// After that call the date is GONE — nothing downstream can recover it, and
// nothing already in Drive has it. So this must run on the original bytes,
// immediately before normalization (see app/api/field-kit/capture/route.ts).
//
// NO TIMEZONE, ON PURPOSE. EXIF DateTimeOriginal is wall-clock local time where
// the camera was, with no offset — and that is exactly what the assembler wants.
// An itinerary day's `fullDate` is also a local date in the program's zone, so a
// photo taken at 10pm in Bratislava compares directly against "2026-07-25" with
// no conversion and no chance of the off-by-one-day error that catches every
// naive UTC comparison. We therefore return a NAIVE timestamp — no "Z", no
// offset — and callers compare its first 10 characters.
//
// Hand-rolled rather than pulling in `exif-reader`: this is a read-only walk of
// a few IFD entries, it can't corrupt bytes, and it keeps the capture path free
// of a new dependency.

import type sharpType from "sharp";

// Lazy, cached, and null-on-failure — mirroring normalizeUploadImage, so a
// pruned native binary degrades to "no date" instead of 500ing the upload.
let sharpPromise: Promise<typeof sharpType | null> | undefined;
function loadSharp(): Promise<typeof sharpType | null> {
  if (!sharpPromise) {
    sharpPromise = import("sharp")
      .then((m) => (m.default ?? m) as typeof sharpType)
      .catch(() => null);
  }
  return sharpPromise;
}

// EXIF tags we care about.
const TAG_DATETIME = 0x0132; // IFD0 — file modify time; last-resort fallback
const TAG_EXIF_IFD_POINTER = 0x8769; // IFD0 → offset of the Exif SubIFD
const TAG_DATETIME_ORIGINAL = 0x9003; // SubIFD — when the shutter fired
const TAG_DATETIME_DIGITIZED = 0x9004; // SubIFD — when it was digitized

const IFD_ENTRY_BYTES = 12;
const TYPE_ASCII = 2;

/** "2026:07:25 14:32:10" → "2026-07-25T14:32:10"; anything else → "". */
function normalizeExifDateTime(raw: string): string {
  const m = raw
    .replace(/\0+$/, "")
    .trim()
    .match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/);
  if (!m) return "";
  const [, y, mo, d, h, mi, s] = m;
  // Cameras with a dead clock stamp 0000:00:00 — a real date, structurally, and
  // useless. Reject anything that isn't a plausible calendar date.
  const year = Number(y);
  const month = Number(mo);
  const day = Number(d);
  if (year < 1900 || year > 2200 || month < 1 || month > 12 || day < 1 || day > 31) return "";
  if (Number(h) > 23 || Number(mi) > 59 || Number(s) > 59) return "";
  return `${y}-${mo}-${d}T${h}:${mi}:${s}`;
}

type Reader = { u16: (o: number) => number; u32: (o: number) => number };

function readerFor(buf: Buffer, little: boolean): Reader {
  return little
    ? { u16: (o) => buf.readUInt16LE(o), u32: (o) => buf.readUInt32LE(o) }
    : { u16: (o) => buf.readUInt16BE(o), u32: (o) => buf.readUInt32BE(o) };
}

/** Read one IFD, returning the ASCII values of `wanted` tags and any sub-IFD offsets. */
function scanIfd(
  buf: Buffer,
  r: Reader,
  ifdOffset: number,
  wanted: Set<number>
): { ascii: Map<number, string>; pointers: Map<number, number> } {
  const ascii = new Map<number, string>();
  const pointers = new Map<number, number>();
  // A malformed offset must not throw — bail to "no date".
  if (ifdOffset < 0 || ifdOffset + 2 > buf.length) return { ascii, pointers };

  const count = r.u16(ifdOffset);
  for (let i = 0; i < count; i++) {
    const entry = ifdOffset + 2 + i * IFD_ENTRY_BYTES;
    if (entry + IFD_ENTRY_BYTES > buf.length) break;
    const tag = r.u16(entry);
    if (!wanted.has(tag)) continue;
    const type = r.u16(entry + 2);
    const len = r.u32(entry + 4);

    if (tag === TAG_EXIF_IFD_POINTER) {
      pointers.set(tag, r.u32(entry + 8));
      continue;
    }
    if (type !== TYPE_ASCII || len === 0 || len > 64) continue;
    // ≤4 bytes live inline in the value field; longer values are at an offset.
    const at = len <= 4 ? entry + 8 : r.u32(entry + 8);
    if (at < 0 || at + len > buf.length) continue;
    ascii.set(tag, buf.toString("ascii", at, at + len));
  }
  return { ascii, pointers };
}

/**
 * Pull a naive local capture timestamp out of a raw EXIF block.
 *
 * Preference order: DateTimeOriginal (shutter) → DateTimeDigitized → IFD0
 * DateTime. Returns "" for anything unparseable — a missing date is always a
 * valid answer here, never an error.
 *
 * Exported for the fixture harness.
 */
export function parseExifCaptureDate(exif: Buffer): string {
  try {
    // sharp hands back the block still carrying its "Exif\0\0" prefix.
    let buf = exif;
    if (buf.length >= 6 && buf.toString("ascii", 0, 4) === "Exif") buf = buf.subarray(6);
    if (buf.length < 8) return "";

    const order = buf.toString("ascii", 0, 2);
    if (order !== "II" && order !== "MM") return "";
    const r = readerFor(buf, order === "II");
    if (r.u16(2) !== 42) return "";

    const ifd0 = scanIfd(buf, r, r.u32(4), new Set([TAG_DATETIME, TAG_EXIF_IFD_POINTER]));

    const subOffset = ifd0.pointers.get(TAG_EXIF_IFD_POINTER);
    if (subOffset !== undefined) {
      const sub = scanIfd(
        buf,
        r,
        subOffset,
        new Set([TAG_DATETIME_ORIGINAL, TAG_DATETIME_DIGITIZED])
      );
      for (const tag of [TAG_DATETIME_ORIGINAL, TAG_DATETIME_DIGITIZED]) {
        const v = sub.ascii.get(tag);
        if (v) {
          const norm = normalizeExifDateTime(v);
          if (norm) return norm;
        }
      }
    }

    const fallback = ifd0.ascii.get(TAG_DATETIME);
    return fallback ? normalizeExifDateTime(fallback) : "";
  } catch {
    // Truncated or hostile EXIF — never let it break an upload.
    return "";
  }
}

/**
 * Read the capture date from image bytes. "" when there is none, when sharp is
 * unavailable, or when the bytes aren't a readable image.
 *
 * MUST be called BEFORE normalizeUploadImage — that call destroys the metadata
 * this reads.
 */
export async function readExifCaptureDate(buffer: Buffer): Promise<string> {
  const sharp = await loadSharp();
  if (!sharp) return "";
  try {
    const meta = await sharp(buffer, { failOn: "none" }).metadata();
    const exif = meta.exif;
    return exif ? parseExifCaptureDate(exif) : "";
  } catch {
    return "";
  }
}
