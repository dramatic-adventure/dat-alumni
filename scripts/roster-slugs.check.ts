// scripts/roster-slugs.check.ts
//
// Diagnoses missing links + headshots on a production's Cast / Creative Team.
// Run with:
//
//     npm run verify:roster                 (defaults to water-that-wanders)
//     npm run verify:roster -- <production-slug>
//
// WHY THIS EXISTS
// A roster row gets its profile link and its headshot from the SAME lookup: the
// artist's key in productionMap / programMap is matched against alumni `slug`.
// Miss that match and the person renders with no link and no photo, silently —
// there is no error, they just look different from everyone else on the page.
// The name-based fallback in app/theatre/[slug]/page.tsx cannot rescue them,
// because the generated display name is de-slugified ASCII ("Jana Stafurova")
// and will never match a sheet name carrying diacritics ("Jana Štafurová").
//
// This script does that same lookup against the real sheet and prints which
// slugs resolve, so a mismatch is visible in one command instead of by
// eyeballing a rendered page.
//
// Reads .env.local the way `next dev` would, since tsx does not.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";

for (const line of readFileSync(resolve(process.cwd(), ".env.local"), "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
  if (m && !(m[1] in process.env)) {
    process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, "");
  }
}

const productionSlug = process.argv[2] || "water-that-wanders";

async function main() {
  const { loadAlumni } = await import("../lib/loadAlumni");
  const { productionMap } = await import("../lib/productionMap");
  const { programMap } = await import("../lib/programMap");

  const production = productionMap[productionSlug];
  if (!production) {
  console.error(`No productionMap entry for "${productionSlug}".`);
  process.exit(1);
  }

  // The page resolves exactly the production roster — programme entries only
  // supply extra titles for people already listed here, never new names.
  const wanted = new Set(Object.keys(production.artists ?? {}));
  void programMap;

  const alumni = await loadAlumni();
  const bySlug = new Map(alumni.map((a) => [a.slug, a]));

  console.log(`\n${production.title} — ${wanted.size} artists · ${alumni.length} alumni rows loaded\n`);

  const broken = [];

  for (const slug of [...wanted].sort()) {
  const alum = bySlug.get(slug);
  const roles = (production.artists?.[slug] ?? []).join(", ");

  if (!alum) {
    broken.push(slug);
    console.log(`  ✗ ${slug.padEnd(24)} NO ALUMNI ROW — no link, no headshot   (${roles})`);
    continue;
  }
  if (!alum.headshotUrl) {
    console.log(`  ~ ${slug.padEnd(24)} row ok, NO HEADSHOT — links but no photo (${alum.name})`);
    continue;
  }
  console.log(`  ✓ ${slug.padEnd(24)} ${alum.name}`);
  }

  if (broken.length) {
  console.log(`\n${broken.length} slug(s) unmatched. Closest names in the sheet:\n`);
  for (const slug of broken) {
    const stem = slug.split("-").pop() ?? slug;
    const near = alumni
      .filter((a) => a.slug.includes(stem.slice(0, 4)) || a.name?.toLowerCase().includes(stem.slice(0, 4)))
      .slice(0, 5);
    console.log(`  ${slug}`);
    if (near.length) {
      for (const a of near) console.log(`      candidate → ${a.slug}  (${a.name})`);
    } else {
      console.log(`      no similar slug or name found — the row may not exist yet`);
    }
  }
  console.log("");
  process.exit(1);
  }

  console.log("\nAll slugs resolve. If the page still looks wrong it is cache — hit /api/admin/invalidate.\n");

}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
