// lib/loadUpdates.ts
import { parse } from "csv-parse/sync";
import fetch from "node-fetch";
import type { Update } from "./types";

/**
 * Loads all journey updates from the public CSV.
 */
export async function loadAllUpdates(): Promise<Update[]> {
  const CSV_URL =
    "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzkIPStlL2TU7AHySD3Kw9CqBFTi1q6QW7N99ivE3FpofNhHlwWejU0LXeMOmnTawtmLCT71KWMU-F/pub?gid=1903489342&single=true&output=csv";

  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error("Failed to fetch updates CSV");

  const text = await res.text();
  const rows: Update[] = parse(text, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });

  return rows;
}
