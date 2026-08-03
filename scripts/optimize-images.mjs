// scripts/optimize-images.mjs
//
// Finds oversized images in /public and shrinks them in place.
//
//     npm run optimize:images          rewrite anything over the limits
//     npm run optimize:images:check    report only, exit 1 if work is needed
//     npm run optimize:images:dry      show exactly what each file would become
//
// WHY THIS EXISTS
// Posters arrive straight from a camera or a designer at 3000-4000px and 1MB+.
// Nothing on the site displays wider than ~1400 CSS px, and these files double
// as Open Graph images, so every oversized poster is paid for twice: once by
// the visitor loading the hero, once by every link preview scraper that fetches
// the full file to build a thumbnail. Next's image optimizer does not help —
// heroes and OG tags reference /public paths directly.
//
// WHAT IT WILL NOT DO
// - Never converts formats. JPEG stays JPEG, PNG stays PNG, so transparency
//   survives and no reference to a file extension breaks.
// - Never enlarges. Small assets (logos, icons) are left alone entirely.
// - Only touches files that exceed a limit, so re-running is a no-op.
// - Skips SVG, WebP, GIF, and ICO.

import { readdir, stat, readFile, writeFile } from "node:fs/promises";
import { join, extname } from "node:path";
import sharp from "sharp";

const DIRS = ["public/posters", "public/images"];
const MAX_WIDTH = 2400;
const MAX_KB = 400;
// Quality 92 is chosen to preserve the image, not to hit a size target. These
// files are bloated because they were exported near quality 100, which stores
// sensor noise no display resolves — not because they carry more real detail.
// At 92 the savings are 70-85% with no perceptible change on photographic
// content. Lower values (76-82) save more but soften edges, which is a bad
// trade for poster art.
const JPEG = { quality: 92, mozjpeg: true, progressive: true };

// PNG is losslessly re-deflated only. `palette: true` would quantize to 256
// colours — that is where the big PNG "savings" came from, and it bands
// gradients visibly. With palette off, an already well-compressed PNG comes
// out no smaller and is skipped by the guard below, which is the correct
// outcome: nothing to win without giving something up.
const PNG = { compressionLevel: 9, effort: 10, palette: false };

const checkOnly = process.argv.includes("--check");
const dryRun = process.argv.includes("--dry-run");
const kb = (bytes) => Math.round(bytes / 1024);

async function walk(dir) {
  const found = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return found;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...(await walk(full)));
    else if ([".jpg", ".jpeg", ".png"].includes(extname(entry.name).toLowerCase())) {
      found.push(full);
    }
  }
  return found;
}

const files = (await Promise.all(DIRS.map(walk))).flat();
const oversized = [];

for (const file of files) {
  const { size } = await stat(file);
  let meta;
  try {
    meta = await sharp(file).metadata();
  } catch {
    continue; // unreadable or not really an image
  }
  const tooWide = (meta.width ?? 0) > MAX_WIDTH;
  const tooHeavy = kb(size) > MAX_KB;
  if (tooWide || tooHeavy) {
    oversized.push({ file, size, width: meta.width, height: meta.height, tooWide, tooHeavy });
  }
}

if (!oversized.length) {
  console.log(`\n${files.length} images checked — all within ${MAX_WIDTH}px / ${MAX_KB}KB.\n`);
  process.exit(0);
}

console.log(
  `\n${oversized.length} of ${files.length} images exceed ${MAX_WIDTH}px or ${MAX_KB}KB:\n`
);

let savedTotal = 0;

for (const item of oversized) {
  const reason = [item.tooWide ? `${item.width}px` : null, item.tooHeavy ? `${kb(item.size)}KB` : null]
    .filter(Boolean)
    .join(" · ");

  if (checkOnly) {
    console.log(`  ✗ ${item.file}  (${reason})`);
    continue;
  }

  const isPng = extname(item.file).toLowerCase() === ".png";
  const pipeline = sharp(await readFile(item.file)).resize({
    width: MAX_WIDTH,
    withoutEnlargement: true,
  });
  const buf = await (isPng ? pipeline.png(PNG) : pipeline.jpeg(JPEG)).toBuffer();

  // Only write when we actually helped — recompression can inflate a file
  // that was already well optimized.
  if (buf.length >= item.size) {
    console.log(`  ~ ${item.file}  (${reason}) — already optimal, left alone`);
    continue;
  }

  const newMeta = await sharp(buf).metadata();
  const pct = Math.round((1 - buf.length / item.size) * 100);
  const dims =
    newMeta.width !== item.width ? `  ${item.width}px → ${newMeta.width}px` : "";

  if (!dryRun) await writeFile(item.file, buf);
  savedTotal += item.size - buf.length;
  console.log(
    `  ${dryRun ? "·" : "✓"} ${item.file}  ${kb(item.size)}KB → ${kb(buf.length)}KB  (${pct}% smaller)${dims}`
  );
}

if (checkOnly) {
  console.log(`\nRun \`npm run optimize:images\` to fix.\n`);
  process.exit(1);
}

console.log(
  dryRun
    ? `\nWould save ${(savedTotal / 1024 / 1024).toFixed(1)}MB. Nothing was written.\n`
    : `\nSaved ${(savedTotal / 1024 / 1024).toFixed(1)}MB.\n`
);
