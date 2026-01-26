import { schedule } from "@netlify/functions";
import { blobSetText } from "../../lib/blobFallback";

type SheetSpec = { name: string; url: string };

// Configure via env so we don't hardcode Sheet IDs/GIDs in git.
// Format (JSON):
// [
//   {"name":"Profile-Live.csv","url":"https://docs.google.com/spreadsheets/d/<ID>/export?format=csv&gid=<GID>"},
//   {"name":"alumni.csv","url":"https://docs.google.com/spreadsheets/d/<ID>/export?format=csv&gid=<GID>"}
// ]
const SHEETS: SheetSpec[] = (() => {
  // 1) Preferred: explicit JSON mapping (highest control)
  try {
    const raw = process.env.FALLBACK_SHEETS_JSON || "[]";
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const fromJson = parsed
        .map((x: any) => ({
          name: String(x?.name || ""),
          url: String(x?.url || ""),
        }))
        .filter((x) => x.name && x.url);
      if (fromJson.length) return fromJson;
    }
  } catch {
    // fall through
  }

  // 2) Fallback: build from known env vars (safe defaults)
  const pick = (...vals: Array<string | undefined>) =>
    (vals.find((v) => typeof v === "string" && v.trim().length > 0) || "").trim();

  const out: SheetSpec[] = [
    // Core profile system
    { name: "Profile-Live.csv", url: pick(process.env.NEXT_PUBLIC_PROFILE_LIVE_CSV_URL) },
    { name: "Profile-Media.csv", url: pick(process.env.NEXT_PUBLIC_PROFILE_MEDIA_CSV_URL) },
    { name: "Profile-Changes.csv", url: pick(process.env.NEXT_PUBLIC_PROFILE_CHANGES_CSV_URL) },
    { name: "Profile-Folders.csv", url: pick(process.env.NEXT_PUBLIC_PROFILE_FOLDERS_CSV_URL) },
    { name: "Profile-Slugs.csv", url: pick(process.env.NEXT_PUBLIC_SLUGS_CSV_URL, process.env.SLUGS_CSV_URL) },

    // Collections + directory/alumni
    { name: "collections.csv", url: pick(process.env.NEXT_PUBLIC_COLLECTIONS_CSV_URL, process.env.COLLECTIONS_CSV_URL) },
    { name: "alumni.csv", url: pick(process.env.NEXT_PUBLIC_ALUMNI_CSV_URL, process.env.ALUMNI_CSV_URL) },

    // Community / promos
    { name: "alumni-updates.csv", url: pick(process.env.NEXT_PUBLIC_ALUMNI_UPDATES_CSV_URL) },
    { name: "spotlights-highlights.csv", url: pick(process.env.NEXT_PUBLIC_SPOTLIGHTS_CSV_URL) },
    { name: "promos.csv", url: pick(process.env.NEXT_PUBLIC_PROMOS_CSV_URL) },

    // Journey (you said: no journey updates yet → do NOT include it)
    { name: "journey-albums.csv", url: pick(process.env.NEXT_PUBLIC_JOURNEY_ALBUMS_CSV_URL) },
    // { name: "journey-updates.csv", url: pick(process.env.NEXT_PUBLIC_UPDATES_CSV_URL) }, // intentionally disabled

    // Stories
    { name: "stories.csv", url: pick(process.env.NEXT_PUBLIC_STORIES_CSV_URL) },

    // Map (you said: Clean Map Data is the one to point to)
    // IMPORTANT: NEXT_PUBLIC_MAP_CSV_URL must be set to the *published CSV URL* for the "Clean Map Data" sheet.
    { name: "Clean Map Data.csv", url: pick(process.env.NEXT_PUBLIC_MAP_CSV_URL) },

    // Optional (only if you later add an env var for it)
    // { name: "story-map.csv", url: pick(process.env.NEXT_PUBLIC_STORY_MAP_CSV_URL) },
  ];

  return out.filter((s) => s.name && s.url);
})();

async function refreshAll() {
  const results: Array<{ name: string; ok: boolean; bytes: number; status?: number }> = [];

  for (const s of SHEETS) {
    // extra safety: skip any accidental empties
    if (!s.url) {
      results.push({ name: s.name, ok: false, bytes: 0 });
      continue;
    }

    try {
      const res = await fetch(s.url, { cache: "no-store" });
      if (!res.ok) {
        results.push({ name: s.name, ok: false, bytes: 0, status: res.status });
        continue;
      }

      const text = await res.text();
      if (!text || text.trim().length < 10) {
        results.push({ name: s.name, ok: false, bytes: 0, status: res.status });
        continue;
      }

      const ok = await blobSetText(s.name, text);
      results.push({ name: s.name, ok, bytes: text.length, status: res.status });
    } catch {
      results.push({ name: s.name, ok: false, bytes: 0 });
    }
  }

  return results;
}

const baseHandler = async () => {
  const results = await refreshAll();
  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true, results }),
  };
};

// Every 15 minutes (UTC); change as you like.
export const handler = schedule("*/15 * * * *", baseHandler);
