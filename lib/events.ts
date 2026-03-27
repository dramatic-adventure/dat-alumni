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

  /** Path in /public, e.g. "/images/theatre/archive/agwow-condor.webp" */
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
    image: "/images/theatre/archive/flakes.webp",
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
    image: "/images/theatre/archive/esmeraldas_dumbshow.webp",
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
    image: "/images/theatre/archive/agwow-condor.webp",
    ticketUrl: "https://festivaldeteatro.com.co",
    ticketPrice: "Most events free or low cost",
    ticketType: "free",
    featured: false,
    tags: ["Latin America", "Colombia", "Iberoamerican", "international"],
    contactEmail: "hello@dramaticadventure.com",
  },

  // ── FUNDRAISERS & COMMUNITY NIGHTS ─────────────────────────────────────────

  {
    id: "dat-summer-launch-2026",
    title: "DAT Summer 2026 Launch",
    subtitle: "Projects, Artists, and the Road Ahead",
    category: "fundraiser",
    status: "upcoming",
    date: "2026-06-04",
    time: "7:00 PM ET",
    venue: "Online — YouTube Live + Zoom",
    city: "Worldwide",
    country: "Online",
    description:
      "Join DAT live as we launch this summer’s projects with artist introductions, program highlights, and a first look at the journeys, communities, and creative work ahead.",
    longDescription:
      "DAT Summer 2026 Launch is an online community gathering to kick off this summer’s projects and share what lies ahead. Join us for artist introductions, program highlights, stories behind the work, and a look at the places, partnerships, and creative adventures shaping DAT’s summer season. Whether you are an alum, supporter, artist, or new friend, this is a chance to connect with the journey at its beginning and learn how to follow, support, and be part of what comes next.",
    image: "/images/theatre/archive/blackfish_mommy.webp",
    ticketUrl: "https://dramaticadventure.com/summer-2026",
    ticketPrice: "Free — registration encouraged",
    ticketType: "free",
    featured: false,
    tags: ["summer launch", "online", "artists", "community", "field season", "DAT"],
    contactEmail: "hello@dramaticadventure.com",
  },

  {
    id: "dat-20th-anniversary-benefit-2026",
    title: "DAT at 20",
    subtitle: "An Anniversary Gathering",
    category: "fundraiser",
    status: "upcoming",
    date: "2026-10-23",
    time: "7:00 PM",
    doors: "Doors, drinks, and gathering at 6:30 PM",
    venue: "TBD",
    address: "Brooklyn, NY",
    city: "Brooklyn, NY",
    country: "USA",
    description:
      "A joyful evening of live performance, music, shared stories, and reunion — celebrating 20 years of Dramatic Adventure Theatre with the artists, alumni, and supporters who have shaped its journey.",
    longDescription:
      "DAT at 20 is a 20th anniversary celebration and benefit honoring the artists, alumni, collaborators, and friends who have shaped Dramatic Adventure Theatre since 2006. Join us for an intimate evening of live performance, music, stories from across DAT’s journey, archival footage, and a festive community reception. Together, we’ll celebrate two decades of adventure, artistry, and human connection, help fund the next chapter of DAT’s work, and get a first look at Season 21.",
    image: "/images/theatre/archive/tembo.webp",
    ticketUrl: "https://dramaticadventure.com/dat-at-20",
    ticketPrice: "Suggested donation $35",
    ticketType: "pay-what-you-can",
    featured: true,
    tags: ["anniversary", "alumni", "performance", "music", "community", "fundraiser"],
    contactEmail: "hello@dramaticadventure.com",
  },
  
  {
    id: "travelogue-stories-from-passage-2026",
    title: "Travelogue: Stories from PASSAGE",
    subtitle: "An Interactive Online Storytelling Cabaret",
    category: "fundraiser",
    status: "upcoming",
    date: "2026-11-15",
    time: "1:00 PM ET",
    venue: "Online — Zoom",
    city: "Worldwide",
    country: "Online",
    description:
      "A special edition of DAT’s Travelogue series featuring live storytelling, music, and conversation inspired by PASSAGE, global journeys, and the adventures that shape us.",
    longDescription:
      "Travelogue is Dramatic Adventure Theatre’s interactive travel-storytelling series, where artists, travelers, and special guests share stories, songs, poems, and reflections shaped by meaningful journeys. This special edition, Stories from PASSAGE, features PASSAGE artists alongside invited guests from across the DAT community for an evening of live storytelling, music, and conversation. Rooted in the spirit of adventure, artistic exchange, and human connection, the event invites audiences to listen, reflect, and even share an adventure of their own.",
    image: "/images/theatre/archive/tembo.webp",
    ticketUrl: "https://dramaticadventure.com/travelogue",
    ticketPrice: "Free — registration required",
    ticketType: "free",
    featured: false,
    tags: ["Travelogue", "storytelling", "cabaret", "music", "online", "PASSAGE"],
    contactEmail: "hello@dramaticadventure.com",
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
    image: "/images/theatre/archive/tembo.webp",
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
    image: "/images/theatre/archive/blackfish_mommy.webp",
    ticketUrl: "https://dramaticadventure.com/season17",
    ticketPrice: "Free — donations welcome",
    ticketType: "free",
    featured: false,
    tags: ["online", "live stream", "Season 17", "global", "free"],
    contactEmail: "hello@dramaticadventure.com",
  },

  // ── COMMUNITY SHOWCASES ──────────────────────────────────────────────────────
  //
  // Add a new block here for each community showcase. The event will:
  //   • Appear on the drama club page while upcoming (disappears once date passes)
  //   • Auto-flow into the Theatre Archive and Project Archive under the correct
  //     DAT season (Sept–Aug) once the date has passed or status is set to "past"
  //   • Show on the Performances page and home page as a performance event
  //
  // To override the auto-calculated season, add:  seasonOverride: <number>
  //
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
    id: "quito-collective-community-showcase-2026",
    title: "Quito Collective Community Showcase",
    category: "performance",
    subcategory: "community-showcase",
    status: "upcoming",
    date: "2026-05-15",
    venue: "Casa de la Cultura Ecuatoriana",
    city: "Quito",
    country: "Ecuador",
    dramaClub: "quito-collective",
    description:
      "The Quito Collective presents an evening of original short works created by their youth ensemble — stories rooted in Andean myth, contemporary Quito, and the drama club's own two-year journey.",
    longDescription:
      "After two years of developing original stories through DAT's drama club program, the Quito Collective takes the stage at the Casa de la Cultura Ecuatoriana for their first full community showcase. The evening features six short original works — devised collaboratively by young artists aged 14–22 — exploring themes of identity, heritage, and belonging in contemporary Ecuador. Performed in Spanish with some Kichwa. All ages welcome. Tickets are free; donations support the club's ongoing work.",
    image: "/images/Andean_Mask_Work.jpg",
    ticketPrice: "Free — donations welcome",
    ticketType: "free",
    featured: true,
    tags: ["community showcase", "youth", "Quito", "Ecuador", "Andean", "original work", "quito-collective"],
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
