// /lib/loadSlugMap.ts
import { loadCsv } from "@/lib/loadCsv";

export type SlugMapRule = { fromSlug: string; toSlug: string; createdAt?: string };

function parseCsv(text: string): SlugMapRule[] {
  const [headerLine, ...lines] = text.split(/\r?\n/).filter(Boolean);
  if (!headerLine) return [];
  const headers = headerLine.split(",").map(h =>
    h.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-")
  );

  const idx = (name: string) => headers.indexOf(name);
  const iFrom = idx("fromslug");
  const iTo = idx("toslug");
  const iAt = idx("createdat");

  const out: SlugMapRule[] = [];
  for (const line of lines) {
    const cells = line.split(",");
    const fromSlug = (cells[iFrom] || "").trim().toLowerCase();
    const toSlug = (cells[iTo] || "").trim().toLowerCase();
    if (!fromSlug || !toSlug) continue;
    out.push({ fromSlug, toSlug, createdAt: cells[iAt]?.trim() });
  }
  return out;
}

export async function loadSlugMap(): Promise<Map<string, string>> {
  const url =
    process.env.SLUGS_CSV_URL ||
    (process.env.ALUMNI_SHEET_ID &&
      `https://docs.google.com/spreadsheets/d/${process.env.ALUMNI_SHEET_ID}/export?format=csv&sheet=${encodeURIComponent(process.env.SLUGS_TAB || "Profile-Slugs")}`) ||
    "";

  if (!url) throw new Error("SLUGS_CSV_URL not configured");

  const csv = await loadCsv(url, "slug-map.csv", { noStore: true });
  const rules = parseCsv(csv);

  const map = new Map<string, string>();
  for (const r of rules) map.set(r.fromSlug, r.toSlug);
  return map;
}
