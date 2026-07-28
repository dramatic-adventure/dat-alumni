// lib/events/eventsForTaxonomy.ts
// ─────────────────────────────────────────────────────────────────────────────
// Reverse lookup for the cause and theme archive pages.
//
// /theatre/[slug] serves both productions (productionMap) and performance
// events (lib/events), but /cause/[slug] and /theme/[slug] historically only
// scanned productionMap — so an event that declared `causes` or `themes` linked
// out to those pages without ever being listed on them. This closes that loop.
//
// Events carrying a `production` are skipped: the production itself already
// appears in the productions grid, so listing the event too would double it up.
// ─────────────────────────────────────────────────────────────────────────────

import {
  events,
  getEventImage,
  canonicalEventPath,
  type DatEvent,
} from "@/lib/events";

export type TaxonomyEventCard = {
  slug: string;
  title: string;
  subtitle: string;
  href: string;
  imageSrc: string;
  /** True for events that have not happened yet — lets callers label them. */
  upcoming: boolean;
  date: string;
};

/** Mirrors the slugify used by the cause + theme pages. */
function slugifyLabel(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Prefer a portrait poster when the event image follows the
 * `-landscape` / `-portrait` naming convention, since these render in the
 * same poster grid as productions. Non-conforming paths are used as-is.
 */
function posterSrcFor(event: DatEvent): string {
  const raw = getEventImage(event);
  if (!raw) return "/posters/fallback-16x9.jpg";
  if (raw.includes("-portrait")) return raw;
  if (raw.includes("-landscape")) return raw.replace("-landscape", "-portrait");
  return raw;
}

function toCard(event: DatEvent): TaxonomyEventCard {
  const when = new Date(event.date);
  const upcoming = !Number.isNaN(when.getTime()) && when.getTime() >= Date.now();
  return {
    slug: event.id,
    title: event.title,
    subtitle:
      event.subtitle ??
      [event.city, event.country].filter(Boolean).join(", ") ??
      "",
    href: canonicalEventPath(event),
    imageSrc: posterSrcFor(event),
    upcoming,
    date: event.date,
  };
}

/** Events whose `causes` include the given cause slug (subcategory, category, or label). */
export function eventsForCause(causeSlug: string): TaxonomyEventCard[] {
  const target = slugifyLabel(causeSlug);
  return events
    .filter((event) => {
      if (event.production) return false;
      return (event.causes ?? []).some(
        (cause) =>
          cause?.subcategory === target ||
          cause?.category === target ||
          (!!cause?.label && slugifyLabel(cause.label) === target),
      );
    })
    .map(toCard)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Events whose `themes` include the given theme slug. */
export function eventsForTheme(themeSlug: string): TaxonomyEventCard[] {
  const target = slugifyLabel(themeSlug);
  return events
    .filter((event) => {
      if (event.production) return false;
      return (event.themes ?? []).some((theme) => slugifyLabel(theme) === target);
    })
    .map(toCard)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Every theme string declared by an event — for "explore more" chip lists. */
export function allEventThemes(): string[] {
  const seen = new Set<string>();
  for (const event of events) {
    if (event.production) continue;
    for (const theme of event.themes ?? []) seen.add(theme);
  }
  return [...seen];
}
