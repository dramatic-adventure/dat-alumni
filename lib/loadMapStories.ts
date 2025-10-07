import { serverDebug, serverInfo, serverWarn, serverError } from "@/lib/serverDebug";
// lib/loaders/loadMapStories.ts
import { loadCsv } from "./loadCsv";
import { parseMapCsv } from "./parseMapCsv"; // ✅ keep your parser

export async function loadMapStories() {
  const liveUrl = process.env.NEXT_PUBLIC_MAP_CSV_URL;

  // 1) Try LIVE first
  try {
    if (!liveUrl) throw new Error("NEXT_PUBLIC_MAP_CSV_URL is missing");
    const liveText = await loadCsv(liveUrl, "map.csv"); // your existing helper
    const livePoints = parseMapCsv(liveText);

    if (livePoints?.length > 0) {
      serverDebug(`[loadMapStories] ✅ LIVE CSV → ${livePoints.length} points`);
      return livePoints;
    } else {
      serverWarn("[loadMapStories] ⚠️ LIVE parsed but 0 points → falling back to /fallback/story-map.csv");
    }
  } catch (err: any) {
    serverWarn("[loadMapStories] ⚠️ LIVE fetch failed → fallback:", err?.message || err);
  }

  // 2) Fallback to a local CSV served from /public
  try {
    const fbText = await loadCsv("/fallback/story-map.csv", "map.csv");
    const fbPoints = parseMapCsv(fbText);
    serverDebug(`[loadMapStories] ✅ FALLBACK CSV → ${fbPoints.length} points`);
    return fbPoints;
  } catch (err: any) {
    serverError("[loadMapStories] ❌ Fallback CSV failed:", err?.message || err);
    return [];
  }
}
