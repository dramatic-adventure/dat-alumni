import { schedule } from "@netlify/functions";
import { blobSetText } from "../../lib/blobFallback";
import { csvUrls } from "../../lib/csvUrls";

type SheetSpec = { name: string; url: string };

// ✅ Hardcode the list in code (NOT env) to avoid AWS Lambda 4KB env-var limit issues.
// If you want this configurable later, we can reintroduce a *single* small env var
// (like a base URL) — but for production stabilization, keep it deterministic.
const SHEETS: SheetSpec[] = [
  // Core profile system
  { name: "Profile-Live.csv", url: csvUrls.profileLive },
  { name: "Profile-Media.csv", url: csvUrls.profileMedia },
  { name: "Profile-Changes.csv", url: csvUrls.profileChanges },
  { name: "Profile-Folders.csv", url: csvUrls.profileFolders },
  { name: "Profile-Slugs.csv", url: csvUrls.slugs },

  // Collections + directory/alumni
  { name: "collections.csv", url: csvUrls.collections },
  { name: "alumni.csv", url: csvUrls.alumni },

  // Community / promos
  { name: "alumni-updates.csv", url: csvUrls.alumniUpdates },
  { name: "spotlights-highlights.csv", url: csvUrls.spotlights },
  { name: "promos.csv", url: csvUrls.promos },

  // Journey (you said: no journey updates yet → do NOT include it)
  { name: "journey-albums.csv", url: csvUrls.journeyAlbums },
  // { name: "journey-updates.csv", url: csvUrls.updates }, // intentionally disabled

  // Stories
  { name: "stories.csv", url: csvUrls.stories },

  // Map (you confirmed this is intentionally the same as stories)
  { name: "Clean Map Data.csv", url: csvUrls.cleanMapData },

  // Drama club lead team (only include if you want it cached in blobs)
  // { name: "drama-club-lead-team.csv", url: csvUrls.dramaClubLeadTeam },
].filter((s) => s.name && s.url);

async function refreshAll() {
  const results: Array<{ name: string; ok: boolean; bytes: number; status?: number }> = [];

  for (const s of SHEETS) {
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

// Every 15 minutes (UTC)
export const handler = schedule("*/15 * * * *", baseHandler);