// lib/events.ts
// ─────────────────────────────────────────────────────────────────────────────
// DAT Events — single source of truth for all upcoming and past events.
//
// HOW TO ADD AN EVENT:
//   1. Copy any existing event block below
//   2. Give it a unique `id` (kebab-case slug)
//   3. Update the fields and save — pages pick it up automatically
//
// DATE FORMAT:   "YYYY-MM-DD"  (e.g. "2026-08-01")
// STATUS:        "upcoming" | "past" | "cancelled"
//                ↳ Set to "past" once the event date has passed
// CATEGORY:      "performance" | "festival" | "fundraiser"
// IMAGES:        Paths relative to /public — e.g. "/images/performing-zanzibar.jpg"
//                Theatre archive images live at  "/images/theatre/[filename]"
// ─────────────────────────────────────────────────────────────────────────────

import { productionMap, type Production, getSortYear } from "@/lib/productionMap";
import { season20Events, season20Hidden } from "@/lib/events/season-20";
import { season21Events, season21Hidden } from "@/lib/events/season-21";

export type EventCategory = "performance" | "festival" | "fundraiser";
export type EventStatus = "upcoming" | "past" | "cancelled";

export interface DatEvent {
  id: string;
  /**
   * Retired slugs that should still resolve to this event.
   * A visit to an old slug is matched by `eventById` and redirected to the
   * current canonical path — so renaming an event's `id` doesn't 404 old links.
   */
  previousIds?: string[];
  title: string;
  subtitle?: string;
  category: EventCategory;
  status: EventStatus;

  /** ISO date string: "2026-08-01" */
  date: string;
  /** ISO date string for the last day of a multi-day event */
  endDate?: string;
  /** Human-readable time, e.g. "7:30 PM" */
  time?: string;
  /** Doors / gates open time */
  doors?: string;

  venue: string;
  address?: string;
  city: string;
  country: string;

  /** e.g. "Approx. 75 min · No interval" */
  runtime?: string;
  /** e.g. "Performed in Spanish & Kichwa" */
  language?: string;
  /** e.g. "Suitable for ages 10+" */
  suitability?: string;

  /** Short teaser (1–2 sentences) shown on cards */
  description: string;
  /** Longer detail shown on full-page views */
  longDescription?: string;

  /** Path in /public, e.g. "/images/theatre/archive/agwow-condor.webp" */
  image?: string;

  /**
   * Nudge the focal point of the event card image.
   * Accepts any CSS background-position value — use compass directions and
   * combinations to shift what part of the image stays in frame.
   *
   * Examples:
   *   imageFocus: "top"          → anchors the top edge (good for tall faces)
   *   imageFocus: "bottom"       → anchors the bottom edge
   *   imageFocus: "left"         → anchors the left side
   *   imageFocus: "right"        → anchors the right side
   *   imageFocus: "top left"     → anchors the top-left corner
   *   imageFocus: "bottom right" → anchors the bottom-right corner
   *   imageFocus: "center"       → default centred crop (same as omitting this)
   *
   * Omit the field (or set to "center") to get the default centred crop.
   */
  imageFocus?: string;

    /**
   * Optional alternate hero image used once the event is archived.
   * Falls back to `image` when not set.
   */
  archiveHeroImage?: string;

  /**
   * Optional calmer one-line summary for archived pages.
   * If omitted, the archive page can simply skip a hero blurb.
   */
  archiveSummary?: string;

  /**
   * Optional hero byline / credit line for theatre pages.
   * Use this when you want playwright / devised-by / created-by
   * control at the event level.
   */
  heroCreditPrefix?: string;
  heroCreditPeople?: { name: string; href?: string }[];

  ticketUrl?: string;
  /** URL for the venue's own website (used for the venue pill link in the hero) */
  venueUrl?: string;
  /** Human-readable price, e.g. "£15 / £10 concessions" or "Free" */
  ticketPrice?: string;
  /** "sliding-scale" | "pay-what-you-can" | "free" | "ticketed" */
  ticketType?: "ticketed" | "free" | "pay-what-you-can" | "sliding-scale";

  /** Pin this event at the top of its category listing */
  featured?: boolean;

  /**
   * Hide this event everywhere until it's ready to go live.
   * When `true`, the event is excluded from every listing AND no detail page is
   * generated for it (a direct visit 404s) — it's as if it didn't exist yet.
   * Delete the field or set it to `false` to publish.
   */
  hidden?: boolean;

  /** Loose tags for filtering or display */
  tags?: string[];

  /** Slug of a related production in productionMap */
  production?: string;

  /**
   * Slug of a related drama club in dramaClubMap.
   * Set this for community showcases that are part of a drama club visit —
   * the drama club page will list the event, and the Theatre Archive will
   * show a "Community Showcase" badge.
   */
  dramaClub?: string;
  dramaClubs?: string[];

  /**
   * Subcategory for more specific classification within a category.
   * "community-showcase" — a public sharing tied to a drama club
   * "commission"         — a piece commissioned from an external artist or company
   * "benefit"            — fundraiser that includes a performance
   * "screening"          — film / documentary screening
   *
   * In the Theatre & Project archives:
   *   community-showcase → green "Community Showcase" badge, links to drama club
   *   commission         → teal "Commission" badge, links to production or drama club
   */
  subcategory?: "community-showcase" | "commission" | "benefit" | "screening";

  /**
   * Medium — for future filtering across theatre / film / workshop.
   * Defaults to "theatre" when omitted.
   */
  medium?: "theatre" | "film" | "workshop" | "installation";

  /** Email for questions/bookings (falls back to hello@dramaticadventure.com) */
  contactEmail?: string;

  /**
   * Override the auto-calculated DAT season number for archive placement.
   * By default the season is derived from the event date (Sept–Aug cutoff,
   * Season 1 = Sept 2006). Set this only if the automatic calculation would
   * place the event in the wrong season — e.g. a showcase that was planned
   * for one season but actually performed in another.
   *
   * Example: seasonOverride: 19  → forces archive placement in Season 19
   */
  seasonOverride?: number;

  // ─────────────────────────────────────────────────────────────────────────
  // RICH CONTENT  (all optional — sections are hidden when not set)
  // Falls back to the linked production's data where noted.
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Production photo gallery.
   * Falls back to the linked production's galleryImages if not set.
   *
   * Example:
   *   photoGallery: [
   *     { src: "/images/theatre/show-name/rehearsal-1.jpg", alt: "The cast in act one" },
   *     { src: "/images/theatre/show-name/performance-2.jpg" },
   *   ]
   */
  photoGallery?: { src: string; alt?: string }[];

  /**
   * Optional credit line for the photo gallery.
   * Falls back to the linked production's productionPhotographer.
   */
  photoCredit?: string;

  /** Optional URL linking the photo credit name to a photographer profile. */
  photographerHref?: string;

  /** Optional URL to a full external photo album (shown in gallery footer). */
  albumHref?: string;

  /**
   * Optional donate URL for the Community Impact section CTA.
   * Falls back to "/donate" when not set.
   */
  donateLink?: string;

  /**
   * Optional one-paragraph community impact blurb shown in the
   * Community Impact section of the event detail page.
   */
  impactBlurb?: string;

  /**
   * YouTube or Vimeo URL for an embedded video section.
   * Falls back to the first videoUrl found in the production's processSections.
   *
   * Examples:
   *   videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   *   videoUrl: "https://vimeo.com/123456789"
   */
  videoUrl?: string;

  /** Optional title shown above the video embed (e.g., "Watch the Trailer"). */
  videoTitle?: string;

  /**
   * Director / creator note shown as an editorial pull-quote section.
   * Falls back to the linked production's pullQuote.quote if not set.
   *
   * Example:
   *   artistNote: "This piece was born in the jungle. It still smells like it.",
   *   artistNoteBy: "Jesse Baxter, Director",
   */
  artistNote?: string;

  /** Attribution for the artist note (e.g., "Jesse Baxter, Director"). */
  artistNoteBy?: string;

  /**
   * Cast and creative team for the Credits section.
   * Falls back to the linked production's creativeTeamOverride + castOverride.
   *
   * Example:
   *   credits: [
   *     { role: "Director", name: "Jesse Baxter" },
   *     { role: "Playwright", name: "Jane Smith", href: "/alumni/jane-smith" },
   *     { role: "Actor", name: "Maria García" },
   *   ]
   */
  credits?: { role: string; name: string; href?: string; group?: "creative" | "cast"; photo?: string }[];

  /**
   * Press or audience quotes shown in the Quotes section.
   *
   * Example:
   *   pressQuotes: [
   *     { text: "Genuinely moving.", attribution: "The Guardian" },
   *     { text: "Theatre at its most alive.", attribution: "Time Out London" },
   *   ]
   */
  pressQuotes?: { text: string; attribution: string; href?: string }[];

  /**
   * Accessibility details shown in the meta band.
   * Keep concise — one line is ideal.
   *
   * Example:
   *   accessibility: "Step-free access · BSL-interpreted performance on 14 Aug · Age guidance: 12+"
   */
  accessibility?: string;

  /**
   * If set, shows a "Bring a Group" CTA in the actions row.
   * The mailto opens pre-filled with the event name.
   * Defaults to hello@dramaticadventure.com if set to true (or provide a specific address).
   *
   * Example:
   *   groupBookingEmail: "groups@summerhall.co.uk"
   */
  groupBookingEmail?: string;

  /**
   * Translations for the hero text (title, subtitle, standfirst).
   * When set, a language toggle (e.g. ES | EN) appears in the hero.
   * Keys are ISO 639-1 language codes. The base event text is treated
   * as the "default" language — add keys for every alternate.
   *
   * Example:
   *   translations: {
   *     en: {
   *       title: "A Girl Without Wings",
   *       subtitle: "DAT × Malayerba Teatro Co-production — Quito, Ecuador",
   *       description: "In Spanish & Kichwa. DAT and Malayerba Teatro revive the company's most celebrated love story.",
   *     },
   *   }
   */
  translations?: Record<
    string,
    {
      title?: string;
      subtitle?: string;
      description?: string;
      /** Translated long-form body copy (shown in About section) */
      longDescription?: string;
      /** Translated director / creator note */
      artistNote?: string;
      artistNoteBy?: string;
      /** Translated community impact blurb */
      impactBlurb?: string;
      /** Translated video section title */
      videoTitle?: string;
      /** Translated press / audience quotes */
      pressQuotes?: { text: string; attribution: string; href?: string }[];
      /**
       * Translated credits (cast + creative team) for the language.
       * Roles are translated; names and hrefs/photos stay the same.
       * Order should match the base credits array.
       */
      credits?: { role: string; name: string; href?: string; group?: "creative" | "cast"; photo?: string }[];
      /** Translated accessibility note */
      accessibility?: string;
      /** Translated runtime string (e.g. "Approx. 80 min · No interval") */
      runtime?: string;
      /** Translated language string (e.g. "Spanish & Kichwa") */
      language?: string;
      /** Translated suitability string (e.g. "Ages 10+") */
      suitability?: string;
      /** Translated ticket price string (e.g. "$15 / $8 students") */
      ticketPrice?: string;
    }
  >;

  /**
   * ISO 639-1 code for the primary language of the event page text.
   * Defaults to "es" if translations are present and field is omitted.
   * Used by the language toggle to label the default language.
   *
   * Example: defaultLang: "es"
   */
  defaultLang?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT DATA
// ─────────────────────────────────────────────────────────────────────────────

// Single source of truth. Two levels of "hide until ready":
//   • Whole season  → set `seasonXXHidden = true` in that season's file.
//   • Single event  → set `hidden: true` on the event.
// Both are stripped here, so hidden items appear in NO listing and get NO detail
// page anywhere on the site until the flag is removed.
const allDefinedEvents: DatEvent[] = [
  // ── Upcoming events live in per-season files (lib/events/season-*.ts) ─────────
  ...(season20Hidden ? [] : season20Events),
  ...(season21Hidden ? [] : season21Events),

  // ── Past / archived explicit events (kept inline) ────────────────────────────
  // Community showcases and other past events that override the synthesised
  // derivation. Once a season fully passes, its season-*.ts file can be pruned
  // and any events worth keeping moved here (or left to the archive derivation).

  {
    id: "quito-collective-community-showcase-2025",
    title: "Quito Collective Community Showcase",
    subtitle: "Season Closing Showcase",
    category: "performance",
    subcategory: "community-showcase",
    status: "past",
    date: "2025-03-08",
    venue: "Casa de la Cultura Ecuatoriana",
    city: "Quito",
    country: "Ecuador",
    dramaClub: "quito-collective",
    description:
      "The Quito Collective's closing showcase of the season — an evening of six original short works devised by their youth ensemble, rooted in Andean myth and contemporary Quito life.",
    image: "/images/Andean_Mask_Work.jpg",
    ticketPrice: "Free — donations welcome",
    ticketType: "free",
    tags: ["community showcase", "youth", "Quito", "Ecuador", "Andean", "original work", "quito-collective"],
    contactEmail: "hello@dramaticadventure.com",
  },

  {
    id: "a-girl-without-wings",
    title: "A Girl Without Wings",
    category: "performance",
    status: "past",
    date: "2013-06-01",
    venue: "Teatro IATI",
    venueUrl: "https://iatitheater.org",
    city: "NYC",
    country: "USA",
    archiveSummary: "World premiere · Off-Off-Broadway",
    description: "Off-Off-Broadway world premiere. A solitary condor and the wingless shepherdess who stole his heart — a love story told through puppets, Andean myth, and original music.",
    image: "/posters/a-girl-without-wings-landscape.jpg",
    runtime: "80 min · No interval",
    suitability: "Ages 10+",
    ticketType: "ticketed",
    production: "a-girl-without-wings",
    tags: ["Off-Off-Broadway", "New York Times Critics Pick", "puppetry", "original music", "world premiere"],
  },
];

// Live events = everything not individually hidden (whole-season hides were already
// applied above). Hidden items appear in no listing and get no detail page.
export const events: DatEvent[] = allDefinedEvents.filter((e) => !e.hidden);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** All events sorted ascending by date (soonest first) */
export const sortedEvents = [...events].sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
);

/** Filter helpers */
export const upcomingEvents = sortedEvents.filter((e) => e.status === "upcoming");

// ─────────────────────────────────────────────────────────────────────────────
// DERIVED ARCHIVED EVENTS
// Synthesized from productionMap for past productions lacking an explicit event.
// Explicit events always win. Duplicate prevention:
//   1. Skip if an explicit event already has this production slug as its id.
//   2. Skip if an explicit past event already references this production slug.
// ─────────────────────────────────────────────────────────────────────────────

function synthesizeFromProduction(slug: string, prod: Production): DatEvent {
  const year = getSortYear(prod);
  const date = `${year}-06-01`;
  const festival =
    typeof prod.festival === "string" && prod.festival.trim()
      ? prod.festival.trim()
      : undefined;
  return {
    id: slug,
    title: prod.title,
    category: "performance",
    status: "past",
    date,
    venue: prod.venue ?? "",
    city: prod.location,
    country: "",
    description: festival ?? `${prod.location} · ${year}`,
    ...(prod.posterUrl ? { image: prod.posterUrl } : {}),
    production: slug,
    ...(typeof prod.season === "number" && prod.season > 0
      ? { seasonOverride: prod.season }
      : {}),
  };
}

/**
 * Derived archived DatEvent objects synthesized from productionMap entries
 * that have no matching explicit event. Use for archive listings and routing.
 */
export const derivedArchivedPerformances: DatEvent[] = (() => {
  const explicitIds = new Set(events.map((e) => e.id));
  const explicitPastProds = new Set(
    events
      .filter((e) => e.status === "past" && e.production)
      .map((e) => e.production!),
  );
  const derived: DatEvent[] = [];
  for (const [slug, prod] of Object.entries(productionMap)) {
    if (explicitIds.has(slug)) continue;
    if (explicitPastProds.has(slug)) continue;
    derived.push(synthesizeFromProduction(slug, prod));
  }
  return derived;
})();

export const pastEvents: DatEvent[] = [
  ...sortedEvents.filter((e) => e.status === "past"),
  ...derivedArchivedPerformances,
].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

export const eventsByCategory = (category: EventCategory): DatEvent[] =>
  sortedEvents.filter((e) => e.category === category);

export const upcomingByCategory = (category: EventCategory): DatEvent[] =>
  upcomingEvents.filter((e) => e.category === category);

/** Next single event (soonest upcoming across all categories) */
export const nextEvent: DatEvent | undefined = upcomingEvents[0];

export function eventById(id: string): DatEvent | undefined {
  return (
    events.find((e) => e.id === id || e.previousIds?.includes(id)) ??
    derivedArchivedPerformances.find(
      (e) => e.id === id || e.previousIds?.includes(id),
    )
  );
}

export function allEventIds(): string[] {
  return [...events, ...derivedArchivedPerformances].map((e) => e.id);
}

/** Category display metadata */
export const categoryMeta: Record<
  EventCategory,
  { label: string; plural: string; color: string; href: string; eyebrow: string }
> = {
  performance: {
    label: "Performance",
    plural: "Upcoming Performances",
    color: "#F23359",
    href: "/events/performances",
    eyebrow: "Live Theatre",
  },
  festival: {
    label: "Festival",
    plural: "Festivals & Showcases",
    color: "#2493A9",
    href: "/events/festivals",
    eyebrow: "Festival Circuit",
  },
  fundraiser: {
    label: "Fundraiser",
    plural: "Fundraisers & Community Nights",
    color: "#D9A919",
    href: "/events/community",
    eyebrow: "Community & Giving",
  },
};

/**
 * Format a date range for display.
 * Single day:  "August 1, 2026"
 * Multi-day:   "August 1–23, 2026"
 * Cross-month: "June 4–14, 2026"
 */
export function formatDateRange(date: string, endDate?: string): string {
  const start = new Date(date + "T12:00:00Z");
  if (!endDate) {
    return start.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  }
  const end = new Date(endDate + "T12:00:00Z");
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) {
    const month = start.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" });
    const year = start.getFullYear();
    return `${month} ${start.getUTCDate()}–${end.getUTCDate()}, ${year}`;
  }
  const s = start.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
  const e = end.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  return `${s} – ${e}`;
}

/** Short month label: "AUG" */
export function shortMonth(date: string): string {
  return new Date(date + "T12:00:00Z").toLocaleDateString("en-GB", {
    month: "short",
    timeZone: "UTC",
  }).toUpperCase();
}

/** Day of month: "1" */
export function dayOfMonth(date: string): string {
  return String(new Date(date + "T12:00:00Z").getUTCDate());
}

/** Year: "2026" */
export function eventYear(date: string): string {
  return String(new Date(date + "T12:00:00Z").getUTCFullYear());
}

/**
 * Resolve the best available image for an event.
 * Prefers the event's own `image` field; falls back to the linked production's
 * `posterUrl` when `event.production` is set and no image is specified.
 */
export function getEventImage(event: DatEvent): string | undefined {
  if (event.image) return event.image;
  if (event.production) {
    const poster = productionMap[event.production]?.posterUrl;
    if (poster) return poster;
  }
  return undefined;
}

/**
 * Return all events linked to a given production slug.
 * Sorted ascending by date (soonest first).
 */
export function eventsByProduction(productionSlug: string): DatEvent[] {
  return [...sortedEvents, ...derivedArchivedPerformances]
    .filter((e) => e.production === productionSlug)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

/**
 * Return all events linked to a given drama club slug.
 * Sorted ascending by date. Use this on drama club pages to list
 * community showcases and other events tied to that club.
 */
export function eventsByDramaClub(dramaClubSlug: string): DatEvent[] {
  return sortedEvents.filter(
    (e) =>
      e.dramaClub === dramaClubSlug ||
      e.dramaClubs?.includes(dramaClubSlug)
  );
}

/** Whether an event is a community showcase */
export function isCommunityShowcase(event: DatEvent): boolean {
  return event.subcategory === "community-showcase";
}

export type EventRouteKind = "theatre" | "festivals" | "gatherings";

export function eventRouteKind(event: DatEvent): EventRouteKind {
  switch (event.category) {
    case "performance":
      return "theatre";
    case "festival":
      return "festivals";
    case "fundraiser":
      return "gatherings";
  }
}

export function canonicalEventPath(event: DatEvent): string {
  return `/${eventRouteKind(event)}/${event.id}`;
}

export function seasonNumberForEvent(event: DatEvent): number {
  return event.seasonOverride ?? seasonNumberFor(event.date);
}

export function isArchivedEvent(event: DatEvent): boolean {
  return event.status === "past";
}

/**
 * Derive a human-readable status label for a production, given its linked events.
 * Returns: "NOW PLAYING" | "UPCOMING" | "ARCHIVE" | null
 */
export function productionEventStatus(
  events: DatEvent[],
): "NOW PLAYING" | "UPCOMING" | "ARCHIVE" | null {
  if (events.length === 0) return null;
  const now = new Date();
  const isNowPlaying = events.some((e) => {
    if (e.status !== "upcoming") return false;
    const start = new Date(e.date + "T00:00:00Z");
    const end = e.endDate ? new Date(e.endDate + "T23:59:59Z") : start;
    return now >= start && now <= end;
  });
  if (isNowPlaying) return "NOW PLAYING";
  if (events.some((e) => e.status === "upcoming")) return "UPCOMING";
  return "ARCHIVE";
}

// ─────────────────────────────────────────────────────────────────────────────
// SEASON HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Map a calendar date to a DAT season number.
 *
 * DAT seasons run September → August.  Season 1 started in September 2006.
 *   Sept 2006 – Aug 2007  =  Season 1
 *   Sept 2007 – Aug 2008  =  Season 2
 *   …
 *   Sept 2025 – Aug 2026  =  Season 20
 *
 * If `seasonOverride` is set on the event, that value is returned directly
 * without any date arithmetic.
 */
export function seasonNumberFor(dateStr: string): number {
  const d = new Date(dateStr + "T12:00:00Z"); // noon UTC avoids timezone edge cases
  const year  = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1; // 1–12
  const seasonStartYear = month >= 9 ? year : year - 1;
  return seasonStartYear - 2005; // Season 1 anchor: 2006 - 2005 = 1
}

/**
 * Whether an event's date has elapsed (regardless of `status`).
 * Uses today's date at midnight local time so an event on today's date
 * is still considered live.
 */
export function isElapsed(event: DatEvent): boolean {
  if (event.status === "past") return true;
  const dateStr = event.endDate ?? event.date;
  const evDate  = new Date(dateStr + "T23:59:59");
  const today   = new Date();
  return evDate < today;
}

/**
 * All community showcase events that have elapsed (date passed or status="past"),
 * sorted chronologically (oldest first) so archives read like a timeline.
 */
export const archivedShowcases: DatEvent[] = sortedEvents.filter(
  (e) => isCommunityShowcase(e) && isElapsed(e)
);

/**
 * Community showcases grouped by DAT season number.
 * Uses `event.seasonOverride` when present, otherwise derives from the date.
 * Returns a Map keyed by season number; values are arrays sorted oldest→newest.
 */
export function showcasesBySeason(): Map<number, DatEvent[]> {
  const map = new Map<number, DatEvent[]>();
  for (const ev of archivedShowcases) {
    const sn = ev.seasonOverride ?? seasonNumberFor(ev.date);
    if (!map.has(sn)) map.set(sn, []);
    map.get(sn)!.push(ev);
  }
  return map;
}

/**
 * Elapsed events that belong in the PROJECT archive.
 *
 * Every event whose date has passed (date-based via `isElapsed`, so it happens
 * automatically — no need to flip `status` to "past") EXCEPT:
 *   • events tied to a production (`production` set) — those live in the Theatre
 *     archive instead, and
 *   • community showcases — those have their own archive rows (showcasesBySeason).
 *
 * So festivals, community nights, fundraisers, online events, and any performance
 * without a production all flow here automatically once their date passes.
 * Sorted oldest→newest so each season reads like a timeline.
 */
export const archivedProjectEvents: DatEvent[] = sortedEvents.filter(
  (e) => isElapsed(e) && !e.production && !isCommunityShowcase(e)
);

/**
 * archivedProjectEvents grouped by DAT season number.
 * Uses `seasonOverride` when present, otherwise derives the season from the date.
 */
export function archivedProjectEventsBySeason(): Map<number, DatEvent[]> {
  const map = new Map<number, DatEvent[]>();
  for (const ev of archivedProjectEvents) {
    const sn = ev.seasonOverride ?? seasonNumberFor(ev.date);
    if (!map.has(sn)) map.set(sn, []);
    map.get(sn)!.push(ev);
  }
  return map;
}
