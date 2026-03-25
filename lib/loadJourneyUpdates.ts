// lib/loaders/loadJourneyUpdates.ts
import { loadCsv } from "./loadCsv";
import { parseUpdatesCsv } from "@/lib/parseUpdatesCsv";

export async function loadJourneyUpdates() {
  const csvText = await loadCsv(
    process.env.NEXT_PUBLIC_UPDATES_CSV_URL,
    "journey-updates.csv" // fallback file name (used for local cache)
  );
  return parseUpdatesCsv(csvText);
}
