// app/api/map/countries/route.ts
import "server-only";
import { NextResponse } from "next/server";
import { programMap } from "@/lib/programMap";
import { productionMap } from "@/lib/productionMap";
import { fetchStories } from "@/lib/fetchStories";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// US localities/states that show up in production `location` strings. Any of
// these means the production is in the United States → normalize to "USA".
const US_TOKENS = new Set([
  "usa",
  "us",
  "nyc",
  "ny",
  "new york",
  "brooklyn",
  "manhattan",
  "east village",
  "hells kitchen",
  "dc",
  "washington",
  "md",
  "maryland",
  "pa",
  "pennsylvania",
  "towson",
]);

// productionMap stores a free-form "city / region / country" location string.
// Pull a country out of it: any US signal → "USA"; otherwise the last
// comma/"and"-separated segment, if it looks like a country name.
function countryFromProductionLocation(location: string): string | null {
  const loc = String(location || "").trim();
  if (!loc) return null;

  const parts = loc
    .split(/,|\band\b/i)
    .map((s) => s.trim())
    .filter(Boolean);

  if (parts.some((p) => US_TOKENS.has(p.toLowerCase()))) return "USA";

  const last = parts[parts.length - 1] || "";
  if (last.length >= 4 && /^[A-Za-z .'-]+$/.test(last)) return last;
  return null;
}

function noStore(payload: unknown) {
  return NextResponse.json(payload, {
    headers: { "Cache-Control": "no-store, max-age=0" },
  });
}

// GET /api/map/countries → { countries: string[] }
// Authoritative source = programMap + productionMap (where DAT actually works),
// unioned with any country already used in a story so author-typed "Other"
// values keep appearing. Deduped (case-insensitive) and sorted.
export async function GET() {
  const seen = new Map<string, string>(); // lowercased key → display value
  const add = (raw: unknown) => {
    const v = String(raw ?? "").trim();
    if (!v) return;
    const k = v.toLowerCase();
    if (!seen.has(k)) seen.set(k, v);
  };

  // 1) programMap — structured country fields (+ per-footprint countries).
  for (const p of Object.values(programMap)) {
    add(p.country);
    for (const fp of p.footprints ?? []) add(fp.country);
  }

  // 2) productionMap — parsed from each production's location.
  for (const prod of Object.values(productionMap)) {
    add(countryFromProductionLocation(prod.location));
  }

  // 3) Existing stories — keeps any author-typed country selectable next time.
  try {
    const stories = await fetchStories();
    for (const s of stories) add((s as any)?.country);
  } catch {
    // Best-effort; the maps above are the reliable base.
  }

  const countries = Array.from(seen.values()).sort((a, b) => a.localeCompare(b));
  return noStore({ countries });
}
