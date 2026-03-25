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

import { productionMap } from "@/lib/productionMap";

export type EventCategory = "performance" | "festival" | "fundraiser";
export type EventStatus = "upcoming" | "past" | "cancelled";

export interface DatEvent {
  id: string;
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

  /** Short teaser (1–2 sentences) shown on cards */
  description: string;
  /** Longer detail shown on full-page views */
  longDescription?: string;

  /** Path in /public, e.g. "/images/theatre/agwow-condor.webp" */
  image?: string;

  ticketUrl?: string;
  /** Human-readable price, e.g. "£15 / £10 concessions" or "Free" */
  ticketPrice?: string;
  /** "sliding-scale" | "pay-what-you-can" | "free" | "ticketed" */
  ticketType?: "ticketed" | "free" | "pay-what-you-can" | "sliding-scale";

  /** Pin this event at the top of its category listing */
  featured?: boolean;

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

  /**
   * Subcategory for more specific classification within a category.
   * "community-showcase" — a performance tied to a drama club visit
   * "benefit"           — fundraiser that includes a performance
   * "screening"         — film / documentary screening
   */
  subcategory?: "community-showcase" | "benefit" | "screening";

  /**
   * Medium — for future filtering across theatre / film / workshop.
   * Defaults to "theatre" when omitted.
   */
  medium?: "theatre" | "film" | "workshop" | "installation";

  /** Email for questions/bookings (falls back to hello@dramaticadventure.com) */
  contactEmail?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// EVENT DATA
// ─────────────────────────────────────────────────────────────────────────────

export const events: DatEvent[] = [

  // ── PERFORMANCES ────────────────────────────────────────────────────────────

  {
    id: "rainbow-san-luis-edinburgh-2026",
    title: "The Rainbow of San Luis",
    subtitle: "A DAT Original Production",
    category: "performance",
    status: "upcoming",
    date: "2026-08-01",
    endDate: "2026-08-23",
    time: "6:30 PM",
    doors: "Doors at 6:00 PM",
    venue: "Summerhall",
    address: "1 Summerhall, Edinburgh EH9 1PL",
    city: "Edinburgh",
    country: "UK",
    description:
      "An original DAT production born in the Ecuadorian Amazon — performed live at the Edinburgh Festival Fringe. Puppetry, music, and community storytelling cross borders and languages.",
    longDescription:
      "Created with and for the communities of Gualaquiza, Ecuador, The Rainbow of San Luis is DAT's award-winning production making its UK debut at the world's largest arts festival. Expect live music, extraordinary puppetry, and a story about what happens when a community decides to tell its own truth.",
    image: "/posters/the-rainbow-of-san-luis-landscape.jpg",
    ticketUrl: "https://tickets.summerhall.co.uk",
    ticketPrice: "£14 / £10 concessions",
    ticketType: "ticketed",
    featured: true,
    tags: ["Edinburgh Fringe", "original production", "Ecuador", "puppetry"],
    production: "the-rainbow-of-san-luis",
    contactEmail: "hello@dramaticadventure.com",
  },

  {
    id: "masks-arcola-london-2026",
    title: "Masks from the Mountains",
    subtitle: "A Benefit Performance",
    category: "performance",
    status: "upcoming",
    date: "2026-10-17",
    time: "7:30 PM",
    doors: "Doors at 7:00 PM",
    venue: "The Arcola Theatre",
    address: "24 Ashwin St, London E8 3DL",
    city: "London",
    country: "UK",
    description:
      "A one-night performance drawn from DAT's Andean work — mask-making traditions, physical theatre, and the voices of artists from Ecuador, Peru, and Bolivia.",
    longDescription:
      "A curated evening of performance and live music exploring the mask-making traditions of the high Andes. Featuring DAT alumni artists from Ecuador, Peru, and Bolivia alongside UK-based theatremakers, this benefit performance raises funds for DAT's 2027 field season.",
    image: "/images/Andean_Mask_Work.jpg",
    ticketUrl: "https://www.arcolatheatre.com",
    ticketPrice: "£18 / £12 concessions",
    ticketType: "ticketed",
    featured: false,
    tags: ["Andes", "mask work", "benefit", "alumni artists"],
    contactEmail: "hello@dramaticadventure.com",
  },

  {
    id: "dat-north-america-showcase-nyc-2026",
    title: "DAT North America Showcase",
    subtitle: "Stories from Four Continents",
    category: "performance",
    status: "upcoming",
    date: "2026-11-07",
    time: "7:00 PM",
    doors: "Doors at 6:30 PM",
    venue: "La MaMa Experimental Theatre Club",
    address: "74A E 4th St, New York, NY 10003",
    city: "New York City",
    country: "USA",
    description:
      "A single night. Seven DAT alumni artists. Stories gathered across four continents and sixteen seasons of field work.",
    longDescription:
      "La MaMa hosts DAT for a landmark evening of new work — short performance pieces developed by DAT alumni from six countries, sharing the stage for the first time in North America. Expect the unexpected: documentary theatre, physical storytelling, live original score.",
    image: "/images/performing-zanzibar.jpg",
    ticketUrl: "https://lamama.org",
    ticketPrice: "$22 / $15 students",
    ticketType: "ticketed",
    featured: false,
    tags: ["North America", "alumni showcase", "new work", "La MaMa"],
    contactEmail: "hello@dramaticadventure.com",
  },

  // ── FESTIVALS & SHOWCASES ────────────────────────────────────────────────────

  {
    id: "assitej-reykjavik-2026",
    title: "ASSITEJ World Congress & Festival",
    subtitle: "DAT Presenting",
    category: "festival",
    status: "upcoming",
    date: "2026-06-04",
    endDate: "2026-06-14",
    venue: "National Theatre of Iceland",
    address: "Hverfisgata 19, 101 Reykjavík",
    city: "Reykjavík",
    country: "Iceland",
    description:
      "DAT presents at the world's premier international performing arts festival for young audiences — joining theatre-makers from 90+ countries.",
    longDescription:
      "ASSITEJ (International Association of Theatre for Children and Young People) gathers the global field in Reykjavík. DAT will present a work-in-progress showing of its newest production and lead a workshop on cross-cultural devising methodologies.",
    image: "/images/theatre/flakes.webp",
    ticketUrl: "https://www.assitej-international.org",
    ticketPrice: "Festival pass / delegate registration",
    ticketType: "ticketed",
    featured: true,
    tags: ["ASSITEJ", "international", "young audiences", "devising"],
    contactEmail: "hello@dramaticadventure.com",
  },

  {
    id: "edinburgh-fringe-2026",
    title: "Edinburgh Festival Fringe",
    subtitle: "DAT in Residence — Summerhall",
    category: "festival",
    status: "upcoming",
    date: "2026-08-01",
    endDate: "2026-08-23",
    venue: "Summerhall",
    city: "Edinburgh",
    country: "UK",
    description:
      "Three weeks. The world's biggest arts festival. DAT returns to Summerhall with The Rainbow of San Luis and a programme of community events, workshops, and late-night conversations.",
    longDescription:
      "DAT's Edinburgh residency at Summerhall spans three weeks of the Fringe. Beyond the main production, we're hosting an open studio, a post-show Q&A series, and a free community workshop for Edinburgh-based young artists.",
    image: "/images/theatre/esmeraldas_dumbshow.webp",
    ticketUrl: "https://www.edfringe.com",
    ticketPrice: "Varies by event — from Free",
    ticketType: "ticketed",
    featured: false,
    tags: ["Edinburgh Fringe", "festival", "residency", "community"],
    contactEmail: "hello@dramaticadventure.com",
  },

  {
    id: "iberoamerican-theatre-bogota-2026",
    title: "Festival Iberoamericano de Teatro",
    subtitle: "DAT in Bogotá",
    category: "festival",
    status: "upcoming",
    date: "2026-09-12",
    endDate: "2026-09-22",
    venue: "Various Venues",
    city: "Bogotá",
    country: "Colombia",
    description:
      "DAT joins one of Latin America's most celebrated theatre festivals — performing, collaborating, and connecting with the broader community of Ibero-American theatremakers.",
    longDescription:
      "The Iberoamerican Theatre Festival of Bogotá is one of the largest performing arts events in Latin America. DAT has deep roots in the region — in Ecuador, Colombia, and Peru — and returns to Colombia to perform, participate in symposia, and reconnect with our South American community.",
    image: "/images/theatre/agwow-condor.webp",
    ticketUrl: "https://festivaldeteatro.com.co",
    ticketPrice: "Most events free or low cost",
    ticketType: "free",
    featured: false,
    tags: ["Latin America", "Colombia", "Iberoamerican", "international"],
    contactEmail: "hello@dramaticadventure.com",
  },

  // ── FUNDRAISERS & COMMUNITY NIGHTS ─────────────────────────────────────────

  {
    id: "spring-benefit-gala-london-2026",
    title: "Act III: Spring Benefit Gala",
    subtitle: "An Evening for DAT",
    category: "fundraiser",
    status: "upcoming",
    date: "2026-05-08",
    time: "7:00 PM",
    doors: "Doors & drinks reception at 6:30 PM",
    venue: "Shoreditch Town Hall",
    address: "380 Old St, London EC1V 9LT",
    city: "London",
    country: "UK",
    description:
      "An evening of performance, live music, and community — raising funds for DAT's next field season. Drinks. Stories. Dancing. The people who make this work matter.",
    longDescription:
      "Act III is DAT's annual Spring Benefit — a night to celebrate another season of field work and raise funds for the next. Expect: short performances by DAT alumni artists, a live auction, catered dinner, and a late-night dance floor. Proceeds fund artist stipends, drama club materials, and community partnerships for DAT Season 17.",
    image: "/images/theatre/hotel_millionaire.webp",
    ticketUrl: "https://dramaticadventure.com/gala",
    ticketPrice: "£75 full / £45 supporters / Pay what you can",
    ticketType: "sliding-scale",
    featured: true,
    tags: ["gala", "benefit", "live performance", "London", "fundraiser"],
    contactEmail: "gala@dramaticadventure.com",
  },

  {
    id: "stories-from-field-brooklyn-2026",
    title: "Stories from the Field",
    subtitle: "A Community Screening Night",
    category: "fundraiser",
    status: "upcoming",
    date: "2026-06-19",
    time: "7:00 PM",
    doors: "Doors at 6:30 PM",
    venue: "Pioneer Works",
    address: "159 Pioneer St, Brooklyn, NY 11231",
    city: "Brooklyn, NY",
    country: "USA",
    description:
      "Documentary footage, live storytelling, and conversation from DAT's most recent field seasons — followed by a community reception and live music.",
    longDescription:
      "An intimate evening at Brooklyn's beloved Pioneer Works: documentary films from four DAT field seasons, live storytelling by returning artists, and a catered reception to follow. Pay what you can. All proceeds support drama club operations in Tanzania and Ecuador.",
    image: "/images/theatre/tembo.webp",
    ticketUrl: "https://pioneerworks.org",
    ticketPrice: "Pay what you can — suggested $25",
    ticketType: "pay-what-you-can",
    featured: false,
    tags: ["Brooklyn", "screening", "documentary", "community", "pay what you can"],
    contactEmail: "hello@dramaticadventure.com",
  },

  {
    id: "season17-launch-online-2026",
    title: "Season 17 Launch: Live Stream",
    subtitle: "Announcement + Community Celebration",
    category: "fundraiser",
    status: "upcoming",
    date: "2026-12-04",
    time: "7:00 PM GMT",
    venue: "Online — YouTube Live + Zoom",
    city: "Worldwide",
    country: "Online",
    description:
      "DAT announces Season 17 live — with a performance excerpt, artist introductions, and a community conversation open to everyone, everywhere.",
    longDescription:
      "We're announcing DAT Season 17 live — streaming globally. Join us to hear where we're going, who's going, and how you can be part of it. Expect: a live performance excerpt, artist introductions, Q&A, and a year-end giving campaign with matching gifts. Free to attend. Donations warmly welcomed.",
    image: "/images/theatre/blackfish_mommy.webp",
    ticketUrl: "https://dramaticadventure.com/season17",
    ticketPrice: "Free — donations welcome",
    ticketType: "free",
    featured: false,
    tags: ["online", "live stream", "Season 17", "global", "free"],
    contactEmail: "hello@dramaticadventure.com",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** All events sorted ascending by date (soonest first) */
export const sortedEvents = [...events].sort(
  (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
);

/** Filter helpers */
export const upcomingEvents = sortedEvents.filter((e) => e.status === "upcoming");
export const pastEvents = sortedEvents.filter((e) => e.status === "past");

export const eventsByCategory = (category: EventCategory): DatEvent[] =>
  sortedEvents.filter((e) => e.category === category);

export const upcomingByCategory = (category: EventCategory): DatEvent[] =>
  upcomingEvents.filter((e) => e.category === category);

/** Next single event (soonest upcoming across all categories) */
export const nextEvent: DatEvent | undefined = upcomingEvents[0];

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
    href: "/events/fundraisers",
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
  return sortedEvents.filter((e) => e.production === productionSlug);
}

/**
 * Return all events linked to a given drama club slug.
 * Sorted ascending by date. Use this on drama club pages to list
 * community showcases and other events tied to that club.
 */
export function eventsByDramaClub(dramaClubSlug: string): DatEvent[] {
  return sortedEvents.filter((e) => e.dramaClub === dramaClubSlug);
}

/** Whether an event is a community showcase */
export function isCommunityShowcase(event: DatEvent): boolean {
  return event.subcategory === "community-showcase";
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
