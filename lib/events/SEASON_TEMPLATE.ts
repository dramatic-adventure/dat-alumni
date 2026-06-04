// lib/events/SEASON_TEMPLATE.ts
// ─────────────────────────────────────────────────────────────────────────────
// SEASON EVENTS — TEMPLATE
// ─────────────────────────────────────────────────────────────────────────────
//
// This is the proposed model for breaking the giant lib/events.ts into one small,
// manageable file per DAT season. COPY THIS FILE to create a new season.
//
// HOW THE SPLIT WORKS (proposed):
//   • lib/events.ts  keeps the DatEvent *type* and all the helper/derivation
//     logic (sortedEvents, upcomingEvents, canonicalEventPath, etc.).
//   • lib/events/2026.ts, 2025.ts, …  each export ONE array of that season's
//     events. Nothing else lives in them — just the records.
//   • lib/events.ts imports every season file and concatenates them into the
//     single `events` array it already exposes, so the rest of the app is
//     unchanged. (Files named with a leading "_" or this TEMPLATE are ignored.)
//
// SEASONS run September → August. Season 1 = Sept 2006. So:
//   Sept 2025 – Aug 2026  =  Season 20   → put those events in this file's array.
//
// TO ADD AN EVENT:
//   1. Copy one of the example blocks below.
//   2. Give it a unique `id` (kebab-case — this becomes its URL slug).
//   3. Fill in the fields and save. TypeScript will flag any missing required
//      field or typo *before* the site builds — that's the safety net that keeps
//      this approach from breaking in production.
//
// REQUIRED fields (everything else is optional):
//   id · title · category · status · date · venue · city · country · description
//
// CATEGORY:  "performance" | "festival" | "fundraiser"
//            ↳ "fundraiser" is the internal key for what the site shows as
//              "Community." (We keep the internal name to avoid a risky rename.)
// STATUS:    "upcoming" | "past" | "cancelled"
//            ↳ Events also auto-drop from "upcoming" lists once their date passes,
//              so you usually don't need to flip this by hand.
// DATES:     "YYYY-MM-DD". Add `endDate` for multi-day runs.
// IMAGES:    paths under /public, e.g. "/posters/show-landscape.jpg".
// ─────────────────────────────────────────────────────────────────────────────

import type { DatEvent } from "@/lib/events";

/**
 * HIDE THE WHOLE SEASON until it's ready to go live.
 * Set to `true` and every event in this file disappears from the site — no
 * listings, no detail pages — no matter what each event's own `hidden` flag says.
 * Set back to `false` (or leave as-is) to publish the season.
 *
 * To hide just ONE event instead, set `hidden: true` on that event (see below).
 */
export const season20Hidden = false;

export const season20Events: DatEvent[] = [
  // ── 1) MINIMAL EXAMPLE — only the required fields ──────────────────────────
  {
    id: "example-community-night-2026",
    title: "An Example Community Night",
    category: "fundraiser", // shows publicly as "Community"
    status: "upcoming",
    date: "2026-07-24",
    venue: "The Tank",
    city: "New York",
    country: "USA",
    description:
      "A one-line teaser shown on the event card and listings. Keep it to a sentence or two.",
  },

  // ── HIDDEN EXAMPLE — set up now, invisible until you're ready ───────────────
  {
    id: "example-hidden-event-2026",
    title: "An Event That Isn't Live Yet",
    category: "performance",
    status: "upcoming",
    date: "2026-08-15",
    venue: "TBD",
    city: "Somewhere",
    country: "USA",
    description: "Fully prepared in the file, but not shown on the site yet.",
    hidden: true, // ← remove this line (or set false) to publish it
  },

  // ── 2) FULLY-LOADED EXAMPLE — the fields you'll reach for most often ───────
  {
    id: "example-festival-presentation-2026",
    title: "An Example Festival Presentation",
    subtitle: "A short standfirst under the title",
    category: "festival",
    status: "upcoming",

    date: "2026-09-12",
    endDate: "2026-09-22", // multi-day run; omit for single-day events
    time: "7:30 PM",
    doors: "Doors at 7:00 PM",

    venue: "Teatro Colón",
    address: "Calle 10 #5-32, Bogotá",
    city: "Bogotá",
    country: "Colombia",

    description:
      "Short teaser for cards and listings (1–2 sentences).",
    longDescription:
      "Longer body copy shown on the full event page. A paragraph or two is plenty.",

    image: "/posters/example-landscape.jpg",
    imageFocus: "top", // nudge the crop: "top" | "bottom" | "left" | "top right" | …

    ticketUrl: "https://example.com/tickets",
    ticketPrice: "$15 / $8 students",
    ticketType: "ticketed", // "ticketed" | "free" | "pay-what-you-can" | "sliding-scale"

    featured: false, // true = pin to the top of its listing
    // hidden: true,  // uncomment to keep this event off the site until it's ready
    tags: ["festival", "Colombia", "original production"],

    // ── Crossover links (this is how an event lives in BOTH archives) ─────────
    // `production` ties this event to a productionMap entry. When the event is
    // archived, the /theatre production page is its CANONICAL home, and the
    // /projects archive cross-links to it.
    production: "the-rainbow-of-san-luis",
    // NOTE: a `project` link field (to programMap, for the /projects archive) is
    // planned but not on the DatEvent type yet — leave it out until it's added,
    // or `npm run check` will fail.

    // Optional fine-tuning:
    // dramaClub: "quito-collective",       // links a community showcase to its club
    // subcategory: "community-showcase",   // "commission" | "benefit" | "screening"
    // seasonOverride: 20,                  // force archive placement if the date math is wrong
    // contactEmail: "groups@example.com",
  },
];
