// lib/projectHeroImage.ts
//
// Resolves the hero image for an archived project page (/projects/[slug]).
//
// Resolution order:
//   1. A curated per-project file at /images/projects/heroes/{slug}.{jpg,webp,png}
//      (drop a file there to give a project its own hero — no code change needed).
//   2. The project's ERA image already used on the /projects archive index,
//      chosen by season number.
//   3. A final generic default.
//
// The per-project lookup uses the filesystem at build/SSG time (server only).

import fs from "node:fs";
import path from "node:path";

const HEROES_DIR_REL = "images/projects/heroes";
const ARCHIVE_PREFIX = "/images/projects/archive";
const GENERIC_DEFAULT = `${ARCHIVE_PREFIX}/ACTion-Tanzania-3-hike.webp`;
const CANDIDATE_EXTS = ["jpg", "jpeg", "webp", "png"] as const;

// Season → era hero image, mirroring the ERAS table on app/projects/page.tsx.
// Season 20 (the newest era) has no archive image yet → falls through to the
// generic default unless a per-project hero file exists.
const SEASON_ERA_IMAGE: Record<number, string> = {
  1: `${ARCHIVE_PREFIX}/Creative-Trek-Zimbabwe.webp`,
  2: `${ARCHIVE_PREFIX}/Creative-Trek-Zimbabwe.webp`,
  3: `${ARCHIVE_PREFIX}/creative-trek-ecuador-teatro-la-catanga.webp`,
  4: `${ARCHIVE_PREFIX}/teaching-artist-residency-esmeraldas.webp`,
  5: `${ARCHIVE_PREFIX}/teaching-artist-residency-esmeraldas.webp`,
  6: `${ARCHIVE_PREFIX}/teaching-artist-residency-esmeraldas.webp`,
  7: `${ARCHIVE_PREFIX}/action-heart-of-europe-street-theatre.webp`,
  8: `${ARCHIVE_PREFIX}/action-heart-of-europe-street-theatre.webp`,
  9: `${ARCHIVE_PREFIX}/ACTion-Tanzania-7-kids.webp`,
  10: `${ARCHIVE_PREFIX}/ACTion-Tanzania-7-kids.webp`,
  11: `${ARCHIVE_PREFIX}/teaching-artist-residency-slovakia-camp.webp`,
  12: `${ARCHIVE_PREFIX}/teaching-artist-residency-slovakia-camp.webp`,
  13: `${ARCHIVE_PREFIX}/teaching-artist-residency-slovakia-camp.webp`,
  14: `${ARCHIVE_PREFIX}/teaching-artist-residency-slovakia-camp.webp`,
  15: `${ARCHIVE_PREFIX}/teaching-artist-residency-slovakia-camp.webp`,
  16: `${ARCHIVE_PREFIX}/travelogue-on-clubhouse-4-17-21.webp`,
  17: `${ARCHIVE_PREFIX}/travelogue-on-clubhouse-4-17-21.webp`,
  18: `${ARCHIVE_PREFIX}/travelogue-on-clubhouse-4-17-21.webp`,
  19: `${ARCHIVE_PREFIX}/travelogue-on-clubhouse-4-17-21.webp`,
};

/** Look for a curated per-project hero file under /public. Returns the public path or null. */
function findCuratedHero(slug: string): string | null {
  for (const ext of CANDIDATE_EXTS) {
    const rel = `${HEROES_DIR_REL}/${slug}.${ext}`;
    const abs = path.join(process.cwd(), "public", rel);
    try {
      if (fs.existsSync(abs)) return `/${rel}`;
    } catch {
      // ignore fs errors — fall through to era/default
    }
  }
  return null;
}

/** Resolve the hero image src for a project. */
export function resolveProjectHeroImage(slug: string, season?: number): string {
  const curated = findCuratedHero(slug);
  if (curated) return curated;
  if (season != null && SEASON_ERA_IMAGE[season]) return SEASON_ERA_IMAGE[season];
  return GENERIC_DEFAULT;
}
