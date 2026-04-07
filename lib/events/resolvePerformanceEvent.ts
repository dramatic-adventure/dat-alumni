// lib/events/resolvePerformanceEvent.ts
// ─────────────────────────────────────────────────────────────────────────────
// Read-time resolver for performance events.
//
// Merges event data (run-specific) with production data (work-level artistic)
// using explicit field-aware rules. Event always wins when defined; production
// fills gaps. Non-performance events are returned unchanged.
//
// Ownership rules:
//   Always event-owned:  dates, times, venue, ticketing, status, all booking /
//                        registration / run-specific URLs, archive identity,
//                        route identity, bilingual toggle state (defaultLang)
//   Usually prod-owned:  themes, causes, resources, long description, partners,
//                        canonical artistic context
//   Override-capable:    title, subtitle, summary, hero text, gallery/media,
//                        language line, credits shown in hero
//
// Language rules:
//   English is the primary/default language for resolved and displayed data.
//   When filling from production (synopsis, subtitle, etc.), the production
//   field value is used as-is — production data is already in English.
//   Event-level bilingual structure (translations, defaultLang) is never mutated.
// ─────────────────────────────────────────────────────────────────────────────

import { productionMap } from "@/lib/productionMap";
import { productionDetailsMap } from "@/lib/productionDetailsMap";
import type { DatEvent } from "@/lib/events";
import type { CauseItem, PartnerLink } from "@/lib/productionDetailsMap";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * A DatEvent enriched with resolved production-level fields.
 * Compatible with DatEvent (extends it), so it can be passed wherever
 * DatEvent is expected. The resolver is the single source of truth for
 * how event and production data are assembled.
 */
export interface ResolvedPerformanceEvent extends DatEvent {
  /** Resolved from productionDetailsMap when not set on the event. */
  themes?: string[];
  /** Resolved from productionDetailsMap when not set on the event. */
  causes?: CauseItem[];
  /** Resolved from productionDetailsMap when not set on the event. */
  partners?: PartnerLink[];
  /** Resolved from productionDetailsMap when not set on the event. */
  resources?: { label: string; href?: string }[];
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function normalizeImagePath(input?: string | null): string | undefined {
  if (!input) return undefined;
  const raw = input.trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("public/")) {
    return `/${raw.slice("public/".length).replace(/^\/+/, "")}`;
  }
  if (raw.startsWith("/")) return raw;
  return `/${raw.replace(/^\/+/, "")}`;
}

function flattenSynopsis(synopsis?: string | string[]): string | undefined {
  if (!synopsis) return undefined;
  if (Array.isArray(synopsis)) {
    const joined = synopsis.filter(Boolean).join("\n\n");
    return joined || undefined;
  }
  const trimmed = synopsis.trim();
  return trimmed || undefined;
}

/**
 * Merge rule helpers.
 * scalar(a, b): returns a if defined, else b
 * array(a, b):  returns a if non-empty, else b
 */
function scalar<T>(event: T | undefined, production: T | undefined): T | undefined {
  return event !== undefined ? event : production;
}

function array<T>(event: T[] | undefined, production: T[] | undefined): T[] | undefined {
  if (event?.length) return event;
  if (production?.length) return production;
  return undefined;
}

// ── Resolver ──────────────────────────────────────────────────────────────────

/**
 * Resolves a performance event by merging production data where the event
 * has gaps. Returns a ResolvedPerformanceEvent with both event-specific and
 * production-level artistic data filled.
 *
 * Non-performance events are returned unchanged (type-cast to
 * ResolvedPerformanceEvent for a uniform return type — the extended fields
 * are simply absent for non-performance events).
 *
 * Auto-archived productions (synthesized from productionMap) resolve exactly
 * like any other performance event.
 */
export function resolvePerformanceEvent(event: DatEvent): ResolvedPerformanceEvent {
  // Non-performance events pass through unchanged
  if (event.category !== "performance") return event as ResolvedPerformanceEvent;

  const productionSlug = event.production;
  if (!productionSlug) return event as ResolvedPerformanceEvent;

  const base = productionMap[productionSlug];
  const extra = productionDetailsMap[productionSlug];

  if (!base) return event as ResolvedPerformanceEvent;

  // ── Production image base ──────────────────────────────────────────────────
  // Prefer productionDetailsMap heroImageUrl (intended display image) over
  // productionMap posterUrl (raw asset path). Normalize to root-relative.
  const productionImage = normalizeImagePath(
    extra?.heroImageUrl ?? base.posterUrl,
  );

  // ── Scalars: event wins if defined ────────────────────────────────────────
  const image = scalar(event.image, productionImage);
  // archiveHeroImage: event wins if set; productionImage is a better archive
  // hero than a raw posterUrl (which synthesized events may already carry)
  const archiveHeroImage = scalar(event.archiveHeroImage, productionImage);
  const subtitle = scalar(event.subtitle, extra?.subtitle);
  const longDescription = scalar(
    event.longDescription,
    flattenSynopsis(extra?.synopsis),
  );

  // Override-capable credits (event-level fields take priority over
  // productionExtra, which the template currently reads directly).
  const heroCreditPrefix = scalar(event.heroCreditPrefix, extra?.creditPrefix);
  const heroCreditPeople = array(
    event.heroCreditPeople,
    extra?.creditPeople,
  );

  // ── Arrays: event wins if non-empty, otherwise production ─────────────────
  const photoGallery = array(
    event.photoGallery,
    extra?.galleryImages as { src: string; alt?: string }[] | undefined,
  );

  // ── Production-owned fields ────────────────────────────────────────────────
  // These come exclusively from production data; events do not override them
  // (no corresponding field exists on DatEvent for these).
  const themes = extra?.themes;
  const causes = extra?.causes;
  const partners = extra?.partners;
  const resources = extra?.resources;

  // ── Credits: event wins if non-empty, otherwise production cast+team ───────
  // Maps production PersonRole arrays (creativeTeamOverride / castOverride) to
  // DatEvent credit items so the template's resolveCredits helper picks them up
  // from event.credits without needing to read productionDetailsMap directly.
  const credits = (() => {
    if (event.credits?.length) return undefined; // event already has credits
    const team = (extra?.creativeTeamOverride ?? []).map((p) => ({
      group: "creative" as const,
      role: p.role,
      name: p.name,
      href: p.href,
      photo: undefined as string | undefined,
    }));
    const castItems = (extra?.castOverride ?? []).map((p) => ({
      group: "cast" as const,
      role: p.role,
      name: p.name,
      href: p.href,
      photo: undefined as string | undefined,
    }));
    const combined = [...team, ...castItems];
    return combined.length ? combined : undefined;
  })();

  // ── Artist note: event wins, then production pullQuote ────────────────────
  const artistNote = scalar(
    event.artistNote,
    extra?.pullQuote?.quote || undefined,
  );
  const artistNoteBy = scalar(
    event.artistNoteBy,
    extra?.pullQuote?.attribution || undefined,
  );

  // ── Assemble resolved event ────────────────────────────────────────────────
  // Spread base event first, then apply resolved overrides.
  // Only include a key if the resolved value is defined, so we never
  // accidentally clobber an existing field with undefined.
  const resolved: ResolvedPerformanceEvent = { ...event };

  if (image !== undefined) resolved.image = image;
  if (archiveHeroImage !== undefined) resolved.archiveHeroImage = archiveHeroImage;
  if (subtitle !== undefined) resolved.subtitle = subtitle;
  if (longDescription !== undefined) resolved.longDescription = longDescription;
  if (heroCreditPrefix !== undefined) resolved.heroCreditPrefix = heroCreditPrefix;
  if (heroCreditPeople !== undefined) resolved.heroCreditPeople = heroCreditPeople;
  if (photoGallery !== undefined) resolved.photoGallery = photoGallery;
  if (themes !== undefined) resolved.themes = themes;
  if (causes !== undefined) resolved.causes = causes;
  if (partners !== undefined) resolved.partners = partners;
  if (resources !== undefined) resolved.resources = resources;
  if (credits !== undefined) resolved.credits = credits;
  if (artistNote !== undefined) resolved.artistNote = artistNote;
  if (artistNoteBy !== undefined) resolved.artistNoteBy = artistNoteBy;

  return resolved;
}
