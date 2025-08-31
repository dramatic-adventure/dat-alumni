import type { AlumniRow } from "@/lib/types";
import { LOCATION_COORDS } from "@/lib/locationCoords";
import type { LatLng } from "@/lib/geo";
import { haversineMiles, hoursToRadiusMiles } from "@/lib/geo";

/* ---------------- Canonicalization ---------------- */

export const LOCATION_ALIASES: Record<string, string> = {
  "nyc": "New York City",
  "new york": "New York City",
  "new york, ny": "New York City",
  "n.y.c.": "New York City",

  // Treat Manhattan as a borough (counts separately but links to NYC)
  "manhattan": "Manhattan, NYC",
  "manhattan, ny": "Manhattan, NYC",

  "brooklyn": "Brooklyn, NYC",
  "queens": "Queens, NYC",
  "bronx": "Bronx, NYC",
  "staten island": "Staten Island, NYC",

  "la": "Los Angeles, CA",
  "l.a.": "Los Angeles, CA",
  "los ángeles": "Los Angeles, CA",

  "sf": "San Francisco, CA",
  "s.f.": "San Francisco, CA",
  "san fran": "San Francisco, CA",

  "dc": "Washington, DC",
  "d.c.": "Washington, DC",
  "washington dc": "Washington, DC",
  "washington, d.c.": "Washington, DC",

  "uk": "United Kingdom",
  "u.k.": "United Kingdom",
  "great britain": "United Kingdom",
  "britain": "United Kingdom",

  "czech republic": "Czechia",

  "quito": "Quito, Ecuador",
  "brno": "Brno, Czechia",

  "remote": "",
  "online": "",
  "n/a": "",
  "—": "",
};

const EXCLUDED = new Set(["remote", "online", "n/a", "—", "-"]);

/** Strip accents for stable slugs/alias lookups */
function stripDiacritics(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function titleCaseCity(s: string) {
  return s
    .trim()
    .split(/\s+/)
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(" ");
}

export function slugifyLocation(label: string): string {
  return stripDiacritics(label)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function normalizeLocation(raw?: string | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().replace(/^based in:\s*/i, "");
  const lower = stripDiacritics(trimmed).toLowerCase();
  if (EXCLUDED.has(lower)) return null;

  // Aliases take priority (e.g., NYC → New York City; boroughs → "Borough, NYC")
  const aliased = LOCATION_ALIASES[lower];
  let val = (aliased !== undefined ? aliased : trimmed).replace(/\s+/g, " ").trim();

  // Standardize "City, ST" capitalization (skip canonical NYC borough labels)
  if (!/,(\s*)nyc$/i.test(val)) {
    const mUS = stripDiacritics(val).match(/^\s*([a-z .'\-]+),\s*([a-z]{2})\s*$/i);
    if (mUS) {
      const city = titleCaseCity(mUS[1]);
      const st = mUS[2].toUpperCase();
      val = `${city}, ${st}`;
    }
  }

  return val;
}

/** Split multi-location strings; avoid splitting on commas (keeps "New York, NY"). */
export function splitLocations(raw?: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/[;\/|]|(?:\s*\n\s*)/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ---------------- Coords & Hierarchy ---------------- */

export function getCoords(label: string): LatLng | null {
  const c = LOCATION_COORDS[label];
  if (c) return { lat: c[0], lng: c[1] };
  // fallback: any "..., NYC" uses NYC centroid for distance calcs
  if (/,(\s*)NYC$/i.test(label)) {
    const nyc = LOCATION_COORDS["New York City"];
    return nyc ? { lat: nyc[0], lng: nyc[1] } : null;
  }
  return null;
}

export function getParentFor(
  label: string
): { label: string; slug: string } | null {
  // Boroughs roll up to NYC
  if (/,(\s*)NYC$/i.test(label)) {
    return { label: "New York City", slug: "new-york-city" };
  }
  // Example: Galápagos → Ecuador (extend as needed)
  if (/Galápagos, Ecuador$/i.test(label)) {
    return { label: "Ecuador", slug: "ecuador" };
  }
  return null;
}

export function resolveNearbyCenter(label: string): string {
  const parent = getParentFor(label);
  return parent?.label ?? label;
}

/* ---------------- Links (collapse boroughs to NYC for href only) ---------------- */

function isNYCBoroughLabel(label: string): boolean {
  const s = label.trim().toLowerCase();
  return /,\s*nyc$/.test(s) && s !== "new york city";
}

/** Build href from an already-canonical label (used in grids, link building) */
export function getLocationHrefForLabel(label: string): string {
  if (isNYCBoroughLabel(label)) return "/location/new-york-city";
  return `/location/${slugifyLocation(label)}`;
}

/** Build href from a raw token */
export function getLocationHrefForToken(token?: string | null): string | null {
  const label = normalizeLocation(token ?? "") ?? "";
  if (!label) return null;
  return getLocationHrefForLabel(label);
}

/* ---------------- Alumni ↔ Locations ---------------- */

export function getLocationLinksForAlumni(
  a: AlumniRow
): { label: string; href: string }[] {
  const raw: string[] = [];

  // Priority order
  if (typeof (a as any).location_primary === "string")
    raw.push((a as any).location_primary);
  if (typeof (a as any).location === "string") raw.push((a as any).location);

  if (Array.isArray((a as any).locations)) {
    raw.push(...((a as any).locations as string[]));
  }
  if (typeof (a as any).locations_other === "string") {
    raw.push(...splitLocations((a as any).locations_other));
  }

  const out: { label: string; href: string }[] = [];
  const seen = new Set<string>();

  for (const r of raw) {
    const norm = normalizeLocation(r);
    if (!norm) continue;
    const label = norm;
    const slug = slugifyLocation(label);
    if (!seen.has(slug)) {
      seen.add(slug);
      // IMPORTANT: use helper so boroughs link to NYC and commas never appear
      out.push({ label, href: getLocationHrefForLabel(label) });
    }
  }

  return out;
}

/* ---------------- Nearby & Hotspots ---------------- */

export function findNearbyAlumni(
  centerLabel: string,
  allAlumni: AlumniRow[],
  opts?: { hours?: number; avgMph?: number; excludeSlugs?: Set<string> }
) {
  const hours = opts?.hours ?? 2;
  const avgMph = opts?.avgMph ?? 50;
  const excludeSlugs = opts?.excludeSlugs ?? new Set<string>();
  const radius = hoursToRadiusMiles(hours, avgMph);

  const center = getCoords(centerLabel);
  if (!center) return [];

  const items = allAlumni
    .map((alum) => {
      const locs = getLocationLinksForAlumni(alum);
      const primary = locs[0]?.label;
      const coords = primary ? getCoords(primary) : null;
      const slug = primary ? slugifyLocation(primary) : null;
      return { alum, primary, coords, slug };
    })
    .filter(
      (x): x is { alum: AlumniRow; primary: string; coords: LatLng; slug: string } =>
        Boolean(x.primary && x.coords && x.slug)
    );

  return items
    .filter((x) => !excludeSlugs.has(x.slug))
    .map((x) => ({
      alum: x.alum,
      distance: haversineMiles(center, x.coords),
      primaryLabel: x.primary,
    }))
    .filter((x) => x.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
}

export function computeHotspots(
  allAlumni: AlumniRow[],
  opts?: { hours?: number; avgMph?: number; minCount?: number }
) {
  const hours = opts?.hours ?? 2;
  const avgMph = opts?.avgMph ?? 50;
  const minCount = opts?.minCount ?? 5;
  const radius = hoursToRadiusMiles(hours, avgMph);

  const citySet = new Set<string>();
  for (const a of allAlumni) {
    for (const l of getLocationLinksForAlumni(a)) citySet.add(l.label);
  }

  const cities = [...citySet]
    .map((label) => ({ label, coords: getCoords(label) }))
    .filter((x): x is { label: string; coords: LatLng } => Boolean(x.coords));

  const indexed = allAlumni
    .map((alum) => {
      const locs = getLocationLinksForAlumni(alum);
      const primary = locs[0]?.label;
      const coords = primary ? getCoords(primary) : null;
      return { alum, primary, coords };
    })
    .filter(
      (x): x is { alum: AlumniRow; primary: string; coords: LatLng } =>
        Boolean(x.primary && x.coords)
    );

  const results = cities.map((c) => {
    const within = new Set<string>();
    for (const it of indexed) {
      if (haversineMiles(c.coords, it.coords) <= radius) {
        const id =
          (it.alum as any).id ??
          (it.alum as any).email ??
          (it.alum as any).slug ??
          (it.alum as any).name;
        within.add(String(id));
      }
    }
    return { label: c.label, slug: slugifyLocation(c.label), count: within.size };
  });

  return results
    .filter((r) => r.count >= minCount)
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

/* ---------------- CSV lat/lng support + flexible nearby ---------------- */

type PossiblyNumeric = number | string | null | undefined;
function toNum(x: PossiblyNumeric): number | null {
  if (x === null || x === undefined) return null;
  const n = typeof x === "string" ? parseFloat(x) : x;
  return Number.isFinite(n as number) ? (n as number) : null;
}

/** Pull primary coords for an alum.
 * Priority: CSV fields (lat/lng | latitude/longitude | location_lat/location_lng)
 * Fallback: coords by primary location label (incl. borough→NYC centroid)
 */
export function getAlumPrimaryCoords(alum: AlumniRow): LatLng | null {
  const a = alum as any;

  const lat =
    toNum(a.lat) ??
    toNum(a.latitude) ??
    toNum(a.location_lat) ??
    null;

  const lng =
    toNum(a.lng) ??
    toNum(a.long) ??
    toNum(a.longitude) ??
    toNum(a.location_lng) ??
    null;

  if (lat !== null && lng !== null) return { lat, lng };

  // Fallback to first normalized label
  const locs = getLocationLinksForAlumni(alum);
  const primary = locs[0]?.label;
  return primary ? getCoords(primary) : null;
}

/** Does a candidate label belong to a parent bucket (e.g., borough → NYC)? */
function belongsToBucket(candidateLabel: string, mainLabel: string): boolean {
  if (slugifyLocation(candidateLabel) === slugifyLocation(mainLabel)) return true;
  const p = getParentFor(candidateLabel);
  return p?.label === mainLabel;
}

/** Center to use for a location page:
 * 1) Static coords table if present
 * 2) Otherwise average coords of all alumni in the bucket (works for arbitrary locations)
 */
export function getCenterForLabel(label: string, allAlumni: AlumniRow[]): LatLng | null {
  const direct = getCoords(label);
  if (direct) return direct;

  const points: LatLng[] = [];
  for (const a of allAlumni) {
    const matches = getLocationLinksForAlumni(a).some((l) => belongsToBucket(l.label, label));
    if (!matches) continue;
    const c = getAlumPrimaryCoords(a);
    if (c) points.push(c);
  }
  if (!points.length) return null;

  const sum = points.reduce(
    (acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }),
    { lat: 0, lng: 0 }
  );
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

/** Nearby search from an explicit center point (uses CSV coords when present). */
export function findNearbyAlumniByPoint(
  center: LatLng,
  allAlumni: AlumniRow[],
  opts?: { hours?: number; avgMph?: number; excludeSlugs?: Set<string> }
) {
  const hours = opts?.hours ?? 2;
  const avgMph = opts?.avgMph ?? 50;
  const excludeSlugs = opts?.excludeSlugs ?? new Set<string>();
  const radius = hoursToRadiusMiles(hours, avgMph);

  const items = allAlumni
    .map((alum) => {
      const locs = getLocationLinksForAlumni(alum);
      const primary = locs[0]?.label;
      const coords = getAlumPrimaryCoords(alum);
      const slug = primary ? slugifyLocation(primary) : null;
      return { alum, primary, coords, slug };
    })
    .filter(
      (x): x is { alum: AlumniRow; primary: string; coords: LatLng; slug: string } =>
        Boolean(x.primary && x.coords && x.slug)
    );

  return items
    .filter((x) => !excludeSlugs.has(x.slug))
    .map((x) => ({
      alum: x.alum,
      distance: haversineMiles(center, x.coords),
      primaryLabel: x.primary,
    }))
    .filter((x) => x.distance <= radius)
    .sort((a, b) => a.distance - b.distance);
}

/* ---------------- Slug ↔ Label helpers ---------------- */

export function unslugToCanonical(slug: string): string {
  for (const label of Object.keys(LOCATION_COORDS)) {
    if (slugifyLocation(label) === slug) return label;
  }
  // humanize fallback
  const guess = slug.replace(/-/g, " ");
  return guess.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isKnownLocationSlug(slug: string): boolean {
  return Object.keys(LOCATION_COORDS).some((label) => slugifyLocation(label) === slug);
}
