import { parse } from "csv-parse/sync";
import { loadCsv } from "./loadCsv";
import type { Update } from "./types";

export async function loadAlumniUpdates(): Promise<Update[]> {
  const sourceUrl = process.env.ALUMNI_UPDATES_CSV_URL;
  const csvText = await loadCsv(sourceUrl, "alumni-updates.csv");

  const updates: Update[] = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return updates;
}
