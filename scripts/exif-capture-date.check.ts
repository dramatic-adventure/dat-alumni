// scripts/exif-capture-date.check.ts
//
// Fixture verification for lib/exifCaptureDate — the EXIF DateTimeOriginal
// reader that tells the Journey Card auto-composer when a photo was actually
// taken (as opposed to when it was uploaded). Run with:
//
//     npm run verify:exif-date    (alias for `tsx scripts/exif-capture-date.check.ts`)
//
// WHY THIS EXISTS
// Two things here are worth pinning down. First, the parser is hand-rolled: it
// walks TIFF/IFD structures out of a binary blob, so it is exactly the kind of
// code that silently returns the wrong answer after a careless edit. Second —
// and more important — the LAST check asserts the invariant the whole design
// rests on: normalizeUploadImage destroys EXIF. If someone ever moves the read
// in app/api/field-kit/capture/route.ts to after normalization, every photo
// silently loses its real date and backfilled trips quietly misfile. That
// failure would be invisible in production and obvious here.
//
// NB: written without TS type annotations on purpose — eslint-config-next
// parses scripts/ with espree (see journey-auto-composer.check.ts), and
// tsconfig does not typecheck scripts/.

import sharp from "sharp";
import { parseExifCaptureDate, readExifCaptureDate } from "../lib/exifCaptureDate";
import { normalizeUploadImage } from "../lib/normalizeUploadImage";

let failures = 0;
function check(name, cond, detail) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    failures += 1;
    console.error(`  ✗ ${name}${detail !== undefined ? ` — ${JSON.stringify(detail)}` : ""}`);
  }
}

// A tiny real JPEG, so every case below runs through actual encode/decode
// rather than a hand-built buffer that only resembles one.
function blank() {
  return sharp({ create: { width: 8, height: 8, channels: 3, background: "#446" } }).jpeg();
}

async function main() {
  console.log("\n[1] reading the date");
  const withOriginal = await blank()
    .withExif({ IFD2: { DateTimeOriginal: "2026:07:25 14:32:10" } })
    .toBuffer();
  check("DateTimeOriginal, normalized to naive local", await readExifCaptureDate(withOriginal) === "2026-07-25T14:32:10", await readExifCaptureDate(withOriginal));

  const withIfd0 = await blank().withExif({ IFD0: { DateTime: "2026:07:18 08:05:00" } }).toBuffer();
  check("falls back to IFD0 DateTime", await readExifCaptureDate(withIfd0) === "2026-07-18T08:05:00", await readExifCaptureDate(withIfd0));

  const both = await blank()
    .withExif({
      IFD0: { DateTime: "2026:08:30 23:00:00" },
      IFD2: { DateTimeOriginal: "2026:07:14 11:00:00" },
    })
    .toBuffer();
  check("shutter time beats file-modify time", await readExifCaptureDate(both) === "2026-07-14T11:00:00", await readExifCaptureDate(both));

  console.log("\n[2] absent or nonsense dates read as absent, never as an error");
  check("no EXIF at all", await readExifCaptureDate(await blank().toBuffer()) === "");
  const deadClock = await blank().withExif({ IFD2: { DateTimeOriginal: "0000:00:00 00:00:00" } }).toBuffer();
  check("a camera with a dead clock", await readExifCaptureDate(deadClock) === "", await readExifCaptureDate(deadClock));
  check("truncated TIFF header", parseExifCaptureDate(Buffer.from([0x49, 0x49, 0x2a])) === "");
  check("empty buffer", parseExifCaptureDate(Buffer.alloc(0)) === "");
  check("arbitrary bytes", parseExifCaptureDate(Buffer.from("not exif at all, truly")) === "");
  check("big-endian header with nothing behind it", parseExifCaptureDate(Buffer.from("MM\0\x2a\0\0\0\x08", "binary")) === "");

  console.log("\n[3] THE INVARIANT: normalization destroys EXIF");
  // This is why route.ts reads the date from the ORIGINAL bytes, before it
  // calls normalizeUploadImage. If this check ever fails, the read order in
  // app/api/field-kit/capture/route.ts is no longer load-bearing — verify that
  // before relaxing anything here.
  const normalized = await normalizeUploadImage(withOriginal, "image/jpeg", "x.jpg");
  const after = await readExifCaptureDate(normalized.buffer);
  check("the date is gone after normalizeUploadImage — so read before it", after === "", after);

  console.log("");
  if (failures) {
    console.error(`✗ ${failures} check(s) FAILED`);
    process.exit(1);
  }
  console.log("✓ all exif-capture-date checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
