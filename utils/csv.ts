// utils/csv.ts
export async function fetchCSV(url: string): Promise<string[][]> {
  const res = await fetch(url, { next: { revalidate: 60 } }); // cache 60s
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status} @ ${url}`);
  const text = await res.text();
  // Lightweight CSV splitter (ok for your sheets—no embedded quotes)
  return text
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(",").map((c) => c.trim()));
}

export function rowsToObjects<T extends Record<string, string>>(rows: string[][]): T[] {
  const [header, ...body] = rows;
  if (!header) return [];
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])) as T);
}
