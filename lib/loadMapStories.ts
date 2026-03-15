// lib/loadMapStories.ts
import "server-only";

import { serverDebug, serverWarn, serverError } from "@/lib/serverDebug";
import { csvUrls } from "@/lib/csvUrls";
import { loadCsv } from "./loadCsv";
import { parseMapCsv } from "./parseMapCsv";

const FALLBACK_NAME = "Clean Map Data.csv";
const FALLBACK_PATH = "/fallback/Clean%20Map%20Data.csv";

export async function loadMapStories() {
  const liveUrl = csvUrls.cleanMapData;

  // 1) Try LIVE first (published CSV)
  try {
    if (!liveUrl) throw new Error("csvUrls.cleanMapData is missing");
    const liveText = await loadCsv(liveUrl, FALLBACK_NAME);
    const livePoints = parseMapCsv(liveText);

    if (livePoints?.length > 0) {
      serverDebug(`[loadMapStories] ✅ LIVE CSV → ${livePoints.length} points`);
      return livePoints;
    } else {
      serverWarn(`[loadMapStories] ⚠️ LIVE parsed but 0 points → falling back to ${FALLBACK_PATH}`);
    }
  } catch (err: any) {
    serverWarn("[loadMapStories] ⚠️ LIVE fetch failed → fallback:", err?.message || err);
  }

  // 2) Fallback to a local CSV served from /public
  try {
    const fbText = await loadCsv(FALLBACK_PATH, FALLBACK_NAME);
    const fbPoints = parseMapCsv(fbText);
    serverDebug(`[loadMapStories] ✅ FALLBACK CSV → ${fbPoints.length} points`);
    return fbPoints;
  } catch (err: any) {
    serverError("[loadMapStories] ❌ Fallback CSV failed:", err?.message || err);
    return [];
  }
}