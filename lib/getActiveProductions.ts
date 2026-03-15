// lib/getActiveProductions.ts
import { productionMap } from "@/lib/productionMap";
import { productionDetailsMap } from "@/lib/productionDetailsMap";
import { PRODUCTION_FUNDRAISING_BY_SLUG } from "@/lib/productionFundraising";

function toDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function cleanStr(value?: string | null) {
  const t = (value ?? "").trim();
  return t.length ? t : undefined;
}

function inferIsPastRun(dates?: string): boolean {
  const d = cleanStr(dates);
  if (!d) return false;

  const lower = d.toLowerCase();
  if (lower.includes("original production")) return true;

  const yearMatches = d.match(/\b(19|20)\d{2}\b/g);
  if (!yearMatches) return false;

  const years = yearMatches.map((y) => parseInt(y, 10));
  const latestYear = Math.max(...years);
  const currentYear = new Date().getFullYear();

  return latestYear < currentYear;
}

function isUpcomingOrCurrent(args: {
  runStartISO?: string;
  runEndISO?: string;
  dates?: string;
}) {
  const now = new Date();

  const end = toDate(args.runEndISO);
  const start = toDate(args.runStartISO);

  if (end) return end >= now;
  if (start) return start >= now;

  // Fall back to the same text/year heuristic used on production pages.
  if (inferIsPastRun(args.dates)) return false;

  // No usable dates and no evidence it is past → assume upcoming/current.
  return true;
}

export function getActiveProductions() {
  return Object.values(productionMap)
    .flatMap((p) => {
      const extra = productionDetailsMap[p.slug];
      const meta = PRODUCTION_FUNDRAISING_BY_SLUG[p.slug];

      if (meta?.is_hidden) return [];

      const include = isUpcomingOrCurrent({
        runStartISO: cleanStr((extra as any)?.runStartISO),
        runEndISO: cleanStr((extra as any)?.runEndISO),
        dates: cleanStr((extra as any)?.dates) ?? cleanStr(p.festival) ?? String(p.year),
      });

      if (!include) return [];

      return [
        {
          id: p.slug,
          label: meta?.label ?? p.title,
          ...(meta?.subline ? { subline: meta.subline } : {}),
        },
      ];
    })
    .sort((a, b) => a.label.localeCompare(b.label));
}