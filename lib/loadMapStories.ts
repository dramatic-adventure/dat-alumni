// lib/loaders/loadMapStories.ts
import { loadCsv } from "./loadCsv";
import { parseMapCsv } from "./parseMapCsv"; // ✅ RELATIVE import


export async function loadMapStories() {
  const csvText = await loadCsv(
    process.env.NEXT_PUBLIC_MAP_CSV_URL,
    "map.csv"
  );
  return parseMapCsv(csvText);
}
