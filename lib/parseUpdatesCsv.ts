// lib/parseUpdatesCsv.ts

import { parse } from "csv-parse/sync";
import { normalizeUpdateRow } from "./normalizeUpdateRow";
import { Update } from "./types";

/**
 * Parses the Journey Updates CSV text into an array of normalized Update objects.
 * Invalid or incomplete rows are skipped.
 */
export function parseUpdatesCsv(csvText: string): Update[] {
  const rawRecords = parse(csvText, {
    columns: true,
    skip_empty_lines: true,
  });

  const updates: Update[] = rawRecords
  .map((row: Record<string, string>) => normalizeUpdateRow(row))
  .filter((u: Update | null): u is Update => u !== null);

updates.sort((a: Update, b: Update) => b.sortDate.localeCompare(a.sortDate));


  return updates;
}
