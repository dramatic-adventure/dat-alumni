// lib/events/eventsForTaxonomy.ts
// ─────────────────────────────────────────────────────────────────────────────
// Fail-safe reverse lookup for the cause and theme archive pages.
//
// Those pages build their poster grids from productionMap. A theatre event that
// declares `causes` or `themes` but has no productionMap entry yet would link
// out to the cause/theme page without ever being listed on it. This fills that
// gap so nothing goes missing while the production record is still pending.
//
// It is deliberately a backstop, not a parallel system. An event is skipped when
// the production record exists — either because the event points at one via
// `production`, or because a production shares its slug — so a card never
// appears twice and productionMap always wins once it's updated.
//
// Theatre only: festivals and gatherings are not productions and don't belong
// in a productions grid.
// ─────────────────────────────────────────────────────────────────────────────

import {
  events,
  getEventImage,
  canonicalEventPath,
  type DatEvent,
} from "@/lib/events";
import { productionMap } from "@/lib/productionMap";

/** Shaped to drop straight into the same PosterCard grid productions use. */
export type TaxonomyEventCard = {
  slug: string;
  title: string;
  subtitle?: string;
  href: string;
  imageSrc: string;
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
 * True when this event should stand in for a missing production.
 * Theatre only, and only while productionMap has nothing for it.
 */
function isStandIn(event: DatEvent): boolean {
  if (event.category !== "performance") return false;
  if (event.production) return false;
  if (productionMap[event.id]) return false;
  return true;
}

/**
 * Portrait-first, matching how the productions grid picks its poster:
 * `-landscape` paths swap to `-portrait`, anything else is used as-is.
 */
function posterSrcFor(event: DatEvent): string {
  const raw = getEventImage(event);
  if (!raw) return "/posters/fallback-16x9.jpg";
  if (raw.includes("-portrait")) return raw;
  if (raw.includes("-landscape")) return raw.replace("-landscape", "-portrait");
  return raw;
}

function toCard(event: DatEvent): TaxonomyEventCard {
  return {
    slug: event.id,
    title: event.title,
    // Location, matching what production cards actually show. (The grid's
    // first choice is `tagline`, but no production defines one, so every
    // production card falls back to productionMap `location` — "NYC",
    // "Gualaquiza, Ecuador". The event tagline would read nothing like it.)
    subtitle:
      [event.city, event.country].filter(Boolean).join(", ") ||
      event.venue ||
      undefined,
    href: canonicalEventPath(event),
    imageSrc: posterSrcFor(event),
    date: event.date,
  };
}

function standIns(): DatEvent[] {
  return events.filter(isStandIn);
}

/** Theatre events whose `causes` include the given slug (subcategory, category, or label). */
export function eventsForCause(causeSlug: string): TaxonomyEventCard[] {
  const target = slugifyLabel(causeSlug);
  return standIns()
    .filter((event) =>
      (event.causes ?? []).some(
        (cause) =>
          cause?.subcategory === target ||
          cause?.category === target ||
          (!!cause?.label && slugifyLabel(cause.label) === target),
      ),
    )
    .map(toCard)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Theatre events whose `themes` include the given slug. */
export function eventsForTheme(themeSlug: string): TaxonomyEventCard[] {
  const target = slugifyLabel(themeSlug);
  return standIns()
    .filter((event) =>
      (event.themes ?? []).some((theme) => slugifyLabel(theme) === target),
    )
    .map(toCard)
    .sort((a, b) => b.date.localeCompare(a.date));
}

/** Every theme declared by a stand-in event — for "explore more" chip lists. */
export function allEventThemes(): string[] {
  const seen = new Set<string>();
  for (const event of standIns()) {
    for (const theme of event.themes ?? []) seen.add(theme);
  }
  return [...seen];
}
