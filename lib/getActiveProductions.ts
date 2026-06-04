// lib/getActiveProductions.ts
import { productionMap } from "@/lib/productionMap";
import { productionDetailsMap } from "@/lib/productionDetailsMap";
import { PRODUCTION_FUNDRAISING_BY_SLUG } from "@/lib/productionFundraising";
import type { DonationSelectOption } from "@/lib/donations";
import { upcomingEvents, isElapsed, isCommunityShowcase } from "@/lib/events";

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

export function getActiveProductions(): DonationSelectOption[] {
  // Dedupe everything by option id (production slug OR event id).
  const byId = new Map<string, DonationSelectOption>();

  // 1) Upcoming/current productions derived from productionMap.
  for (const p of Object.values(productionMap)) {
    const extra = productionDetailsMap[p.slug];
    const meta = PRODUCTION_FUNDRAISING_BY_SLUG[p.slug];

    if (meta?.is_hidden) continue;

    const include = isUpcomingOrCurrent({
      runStartISO: cleanStr((extra as any)?.runStartISO),
      runEndISO: cleanStr((extra as any)?.runEndISO),
      // Always fold the production's own year into the evidence so a yearless
      // `dates`/`festival` string can't mask a clearly-past production and leak
      // it into the donate selector as a placeholder. ISO run dates still win.
      dates: [cleanStr((extra as any)?.dates), cleanStr(p.festival), String(p.year)]
        .filter(Boolean)
        .join(" "),
    });

    if (!include) continue;

    byId.set(p.slug, {
      id: p.slug,
      label: meta?.label ?? p.title,
      ...(meta?.subline ? { subline: meta.subline } : {}),
    });
  }

  // Track which production slugs are already represented so events that link an
  // existing production don't create a duplicate option.
  const productionSlugs = new Set(byId.keys());

  for (const e of upcomingEvents) {
    if (isElapsed(e)) continue;

    // 2) Upcoming performance events (deduped against productions above).
    if (e.category === "performance" && !isCommunityShowcase(e)) {
      if (e.production && productionSlugs.has(e.production)) continue; // already represented
      if (!byId.has(e.id)) byId.set(e.id, { id: e.id, label: e.title });
      continue;
    }

    // 3) Community showcases fit both modes — include here too.
    if (isCommunityShowcase(e)) {
      if (!byId.has(e.id)) byId.set(e.id, { id: e.id, label: e.title });
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
}