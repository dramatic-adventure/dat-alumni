// lib/productionDetailsMap.ts
import type {
  PersonRole,
  GalleryImage,
} from "@/components/productions/ProductionPageTemplate";

import type {
  DramaClubCauseCategory,
  DramaClubCauseSubcategory,
} from "@/lib/causes";

/** Link + optional logo for partners */
export type PartnerLink = {
  name: string;
  href?: string; // ✅ optional
  /** page.tsx will normalize to the template’s union */
  type: "community" | "artistic" | "impact" | "primary";
  logoSrc?: string;
  logoAlt?: string;
};

/** Generic causes the production supports (with optional icon + link) */
export type CauseItem = {
  /** Human-facing label (can stay poetic / funder friendly) */
  label: string; // e.g., "Indigenous Rights", "Environmental Conservation"

  /** Canonical taxonomy hooks (for /cause/[slug] pages & filters) */
  category?: DramaClubCauseCategory;
  subcategory?: DramaClubCauseSubcategory;

  /** Optional icon + alt (UI sugar only) */
  iconSrc?: string; // optional icon path under /public
  iconAlt?: string;

  /**
   * Optional override; if omitted, UI will:
   * - prefer `subcategory` slug (canonical)
   * - otherwise slugify(label) → /cause/[slug]
   */
  href?: string;
};

/** Per-show extras that keep the page generic and data-driven */
export interface ProductionExtra {
  /** Optional override for the hero/banner image in the theatre page */
  heroImageUrl?: string;

  /** Tagline that appears in the white card (Row 2) */
  subtitle?: string;
    
  /** Optional original title (for international shows, etc.) */
  originalTitle?: string;

  /** Legacy single-playwright fields (still supported) */
  playwright?: string;
  playwrightHref?: string;

  /** Flexible credit line (preferred) */
  creditPrefix?: string; // e.g., "BY", "A NEW PLAY BY", "AN ADAPTATION BY"
  creditPeople?: { name: string; href?: string }[]; // supports multiple names

  /** Meta (all optional; page assembles what's provided) */
  dates?: string; // freeform range, e.g., "Sept 14 – Oct 8, 2013"
  festival?: string; // e.g., "Edinburgh Fringe"
  festivalHref?: string; // link if available
  venue?: string; // e.g., "IATI Theater"
  venueHref?: string; // link if available
  city?: string; // e.g., "NYC" or "Quito, Ecuador"
  runtime?: string; // e.g., "95 minutes"
  ageRecommendation?: string; // e.g., "Ages 12+"

  /** About */
  synopsis?: string | string[]; // allow multi-paragraph content
  themes?: string[];
  pullQuote?: {
    quote: string;
    attribution?: string;
    attributionHref?: string;
  };
  /** Optional photo to pair with the pull quote for an editorial moment */
  quoteImageUrl?: string;

  /** Community / cause block */
  /** Slug for shared dramaClubs map (used to auto-wire name/location/link) */
  dramaClubSlug?: string;
  dramaClubName?: string;
  dramaClubLocation?: string;
  dramaClubLink?: string;

  /** Generic causes this production champions */
  causes?: CauseItem[];

  /** Partners for this production (community, artistic, impact, primary) */
  partners?: PartnerLink[];

  /** CTAs */
  getInvolvedLink?: string;
  donateLink?: string;
  ticketsLink?: string;

  /** Overrides (if you want to fully control roster for a show) */
  creativeTeamOverride?: PersonRole[];
  castOverride?: PersonRole[];

  /** Media shown in Production Gallery */
  galleryImages?: GalleryImage[];

  /** Optional second gallery for BTS / From the Field images */
  fieldGalleryImages?: GalleryImage[];
  fieldGalleryTitle?: string;
  /** Full album link for the Field / BTS album */
  fieldAlbumHref?: string | null;
  /** Optional custom copy for the field album tile */
  fieldAlbumLabel?: string | null;

  /** Production Gallery credit + “Go to album” tile */
  productionPhotographer?: string; // e.g., "María López"
  productionAlbumHref?: string; // e.g., Flickr album URL
  productionAlbumLabel?: string; // e.g., "Full photo album"

  /** Links section (replaces 'pressQuotes' with a general-purpose list) */
  resources?: Array<{
    label: string; // text shown in the RESOURCES list
    href?: string; // ✅ optional // absolute or relative URL
  }>;

  /**
   * Behind-the-scenes PROCESS sections (photos or video + copy)
   * Matches the simplified ProcessBand: image OR video per slide (page.tsx maps to the template).
   */
  processSections?: Array<{
    heading?: string;
    body?: string | string[];
    image?: { src: string; alt?: string };
    /** If provided, video takes precedence over image (YouTube or MP4) */
    videoUrl?: string;
    videoTitle?: string;
    videoPoster?: string;
    quote?: { text: string; attribution?: string };
  }>;

  /** Rich About layout toggle (kept for future layout switches) */
  useCustomAboutLayout?: boolean;

  /** Optional upcoming ticketed performances for this production */
  upcomingShows?: {
    datetimeISO: string; // e.g. "2026-07-12T19:30:00-05:00"
    venue?: string; // e.g. "Teatro Bolívar"
    city?: string; // e.g. "Quito"
    note?: string; // e.g. "ASL-interpreted performance"
    ticketsUrl?: string; // purchase link
    status?: "on-sale" | "sold-out" | "limited";
  }[];

  // -------------------------------
  // BOX OFFICE / RUN STATE
  // -------------------------------

  /** Manual override for past run summary */
  pastRunOverride?: {
    dateRange?: string; // "Sept 14–Oct 8, 2019"
    city?: string; // "Quito, Ecuador"
    venue?: string; // "Teatro Nacional Sucre"
    festival?: string; // "Manta Festival"
  };

  /** Optional richer history for mini timelines or archives */
  historyRuns?: Array<{
    dateRange: string;
    city?: string;
    venue?: string;
    festival?: string;
  }>;

  /** “Get Updates” CTA when not on sale */
  notifyMeUrl?: string;

  /** “Now Playing” pointer for promoting a different live show */
  nowPlaying?: {
    title: string;
    slug: string; // link target: /theatre/[slug]
    dateRange?: string;
    city?: string;
  };

  // -------------------------------
  // RELATED PLAYS / PROJECTS
  // -------------------------------

  /** Optional override for the Related header (default: "Related Plays & Projects") */
  relatedTitle?: string;

  /**
   * Optional base title used by buildRelated (e.g. "A Girl Without Wings")
   * when you want to group variants like
   * "A Girl Without Wings — Workshop Production", etc.
   */
  relatedBaseTitle?: string;

  /**
   * Forces the production page to display as "ARCHIVE" status regardless of
   * linked events. Use on original/archive productions when a revival has its
   * own page — the revival event will still be shown in the events section,
   * but the hero badge stays "ARCHIVE".
   */
  forceArchive?: boolean;

  /**
   * ID of an upcoming event (from lib/events.ts) that is a revival or
   * continuation of this production but lives on a different production page.
   * Surfacing it here lets the archive page show "see the revival" without
   * linking the event to this production slug.
   */
  relatedUpcomingEventId?: string;
}

/** Per-slug details. Keep show-specific content here—page remains generic. */


export const productionDetailsMap: Record<string, ProductionExtra> = {
  "the-rainbow-of-san-luis": {
    heroImageUrl: "posters/the-rainbow-of-san-luis-landscape.jpg",

    subtitle:
      "A stone remembers what people forget.",

    originalTitle: "El Arcoiris de San Luis",

    creditPrefix: "CO-CREATED WITH",
    creditPeople: [
      { name: "The Shuar Children of San Luis" },
      { name: "Community Elders of San Luis" },
      { name: "Dramatic Adventure Theatre Artists" },
    ],

    useCustomAboutLayout: true,

    // Meta
    dates: "Community Street Performance • Gualaquiza, Ecuador",
    festival: "SITE-LINES Community Performance",
    venue: "Public Street Performance",
    city: "Gualaquiza, Ecuador",
    runtime: "Approx. 30–40 minutes",
    ageRecommendation: "All ages",

    synopsis: [
      "The Rainbow of San Luis (El Arcoiris de San Luis) is a community-created street performance devised with Shuar children and shaped in collaboration with elders from the San Luis community in the Ecuadorian Amazon.",
      "The story centers on a couple who have forgotten their culture. In a moment of sadness and confusion, they fall into a dream where they encounter Natam — a rock who guides them on a journey of remembrance.",
      "A stone remembers what people forget.",
      "What follows is a theatrical journey of rediscovery, as Natam guides the couple back toward forgotten language, ancestral stories, and the cultural values that still live within their people.",
      "Performed in the streets of nearby Gualaquiza, the piece became both celebration and declaration — a proud public sharing of culture, memory, and identity by the young actors of San Luis.",
    ],

    themes: [
      "Memory",
      "Belonging",
      "Cultural Identity",
      "Quest",
      "Coming Home",
      "Myth & Folklore",
    ],

    pullQuote: {
      quote:
        "The children took the stage with powerful energy, sharing their cultural values and stories with their neighbors.",
      attribution: "Dramatic Adventure Theatre",
    },

    quoteImageUrl: "/images/site-lines-shuar-performance.jpg",

    /** Community / causes */
    dramaClubSlug: "ayumpum-jintia-colectivo",

    causes: [
      {
        label: "Indigenous Rights",
        category: "indigenous-sovereignty-rights",
        subcategory: "indigenous-cultural-preservation-traditional-knowledge",
        iconSrc: "/icons/cause-indigenous.svg",
        iconAlt: "Indigenous Rights",
      },
      {
        label: "Arts Education Access",
        category: "education-access-equity-opportunity",
        subcategory: "arts-education-access",
      },
      {
        label: "Cultural Preservation",
        category: "indigenous-sovereignty-rights",
        subcategory: "indigenous-cultural-preservation-traditional-knowledge",
      },
    ],

    partners: [
      {
        name: "Shuar Community of San Luis",
        type: "community",
      },
      {
        name: "Dramatic Adventure Theatre",
        href: "https://dramaticadventure.com",
        type: "artistic",
      },
    ],

    /** CTAs */
    getInvolvedLink: "https://dramaticadventuretheatre.org/get-involved",
    donateLink: "/donate",

    /** Roster */
    castOverride: [
      {
        role: "Ensemble",
        name: "The Ayumpum Jintia Colectivo",
        dramaClubSlug: "ayumpum-jintia-colectivo",
      },
    ] as PersonRole[],

    /** Production Gallery */
    galleryImages: [
      {
        src: "/images/site-lines-shuar-performance.jpg",
        alt: "Shuar youth performing El Arcoiris de San Luis in Gualaquiza",
      },
      {
        src: "/images/site-lines-rehearsal.jpg",
        alt: "Shuar children rehearsing scenes during the collaborative process",
      },
      {
        src: "/images/site-lines-community.jpg",
        alt: "Community members gathering for the street performance",
      },
    ],

    /** Field Gallery */
    fieldGalleryImages: [
      {
        src: "/images/site-lines-rehearsal.jpg",
        alt: "Creative workshop with Shuar youth",
      },
      {
        src: "/images/site-lines-story-circle.jpg",
        alt: "Elders sharing stories during the development process",
      },
    ],

    fieldGalleryTitle: "El Arcoiris de San Luis — From the Field",

    /** Process */
    processSections: [
      {
        heading: "Stories from the Community",
        body: [
          "The project began through conversations with elders of the San Luis community, who shared stories, language, and cultural teachings with the young participants.",
          "These stories formed the foundation for the play's dream journey and the character of Natam, the guiding rock spirit.",
        ],
      },
      {
        heading: "Creating with the Children",
        body:
          "Through improvisation, storytelling, and physical theatre exercises, the children developed scenes that reflected both their cultural pride and the challenges facing their community.",
        image: {
          src: "/images/site-lines-rehearsal.jpg",
          alt: "Shuar youth creating scenes during rehearsal",
        },
      },
      {
        heading: "A Street Performance for the City",
        body:
          "The final performance took place in the nearby city of Gualaquiza. Performing in the street allowed the children to share their culture directly with their neighbors, transforming the public space into a stage for ancestral memory and community pride.",
      },
    ],

    /** History */
    historyRuns: [
      {
        dateRange: "Community Performance",
        city: "Gualaquiza, Ecuador",
        venue: "Public Street Performance",
        festival: "SITE-LINES",
      },
    ],
  },

  "a-girl-without-wings": {
    /** Hero image for the theatre page (adjust the path if needed) */
    heroImageUrl: "posters/a-girl-without-wings-landscape.jpg",

    subtitle:
      "Andean myth meets an indie love story in this girl meets bird play.",

    // Flexible credit line (preferred)
    creditPrefix: "A NEW PLAY BY",
    creditPeople: [
      { name: "Jason Williamson", href: "/alumni/jason-williamson" },
    ],

    // Legacy playwright fields (kept to ensure both paths still behave)
    playwright: "Jason Williamson",
    playwrightHref: "/alumni/jason-williamson",

    useCustomAboutLayout: true,

    // Meta
    dates: "Original Production • September 14 – October 8, 2013",
    festival: "Off-Off Broadway",
    festivalHref: "https://www.fringenyc.org/",
    venue: "IATI Theater",
    venueHref: "https://www.iatitheater.org/",
    city: "NYC",
    runtime: "Approx. 2 hours with intermission",
    ageRecommendation: "Best for ages 12+",

    // About (multi-paragraph supported)
    synopsis: [
      "Taken by the post-colonial issues of alienation, cultural isolation, and poverty faced by our partner Quechuan communities high in the Andes of Ecuador and inspired by their spirit, stories and paintings (see dramaturgical note), this reimagined Andean myth was born as Jason Williamson's first commission in Dramatic Adventure Theatre's Global Play Initiative.",
      "Andean myth meets an indie love story in this girl meets bird play.",
      "A lonely Condor and the beautiful Chaska fall hopelessly in love. Fortune, however, is not these lovers' friend because Chaska is not another bird but a wingless shepherd girl. In the merciless but beautiful Andes, the joy and pain of first love between a demigod who yearns for companionship and a girl who must leave her poverty-stricken family to ascend to the skies unfolds.",
      "A Girl without Wings immerses spectators in a whimsical puppet world where a Native-Andean folktale is reborn amidst wicked hummingbirds darting through the air, brightly colored threads of prayer that reach for the gods and a storm of shoes that rains from the sky. In this new play for all audiences, a contemporary riff of a timeless tale comes to life and we witness the painful steps that only brave ones take to pursue their happiness.",
      "#girlmeetsbird",
    ],
    themes: [
      "Courage",
      "Coming of age",
      "Belonging",
      "Love",
      "Myth & folklore",
    ],
    pullQuote: {
      quote:
        "Not much is typical about ‘A Girl without Wings.’ Poignant. Sensitively directed. Magical.",
      attribution: "Laurel Graeber, The New York Times",
      attributionHref: "https://www.nytimes.com/...", // example
    },
    quoteImageUrl: "/images/Andean_Mask_Work.jpg",

    /** Community / causes */
    dramaClubSlug: "quilotoa-collective",

    causes: [
      {
        label: "Environmental Conservation",
        // Climate Justice, Biodiversity & Environmental Protection
        category: "climate-justice-biodiversity-environmental-protection",
        subcategory: undefined,
        iconSrc: "/icons/cause-environment.svg",
        iconAlt: "Environmental Conservation",
        // no href → slugify(label) → /cause/environmental-conservation
      },
      {
        label: "Indigenous Rights",
        // Indigenous Sovereignty & Rights
        category: "indigenous-sovereignty-rights",
        subcategory: "indigenous-cultural-preservation-traditional-knowledge",
        iconSrc: "/icons/cause-indigenous.svg",
        iconAlt: "Indigenous Rights",
        // no href → /cause/indigenous-cultural-preservation-traditional-knowledge
      },
      {
        label: "Arts Education Access",
        // Education Access, Equity & Opportunity
        category: "education-access-equity-opportunity",
        subcategory: "arts-education-access",
        // no icon / href → tests text-only cause chip + taxonomy slug
      },
    ],

    partners: [
      {
        name: "Cedenma (Environmental Coalition of Ecuador)",
        href: "https://www.cedenma.org/",
        type: "impact",
        logoSrc: "/images/partners/cedenma.jpg",
        logoAlt: "Cedenma",
      },
      {
        name: "Pachaysana Institute",
        href: "https://www.pachaysana.org/",
        type: "community",
        logoSrc: "/logos/pachaysana.svg",
        logoAlt: "Pachaysana Institute",
      },
      {
        // Tests a partner *without* logoSrc so we can confirm no broken image
        name: "Local Quechuan Artists Collective",
        href: "https://example.org/quechuan-artists",
        type: "artistic",
      },
    ],

    /** CTAs */
    getInvolvedLink: "https://dramaticadventuretheatre.org/get-involved",
    donateLink: "/donate",
    ticketsLink: "https://dramaticadventuretheatre.org/tickets",

    /** Overrides for roster (to test NameCell + autoLinkPeopleBase) */
    creativeTeamOverride: [
      { role: "Director", name: "Jesse Baxter", href: "/alumni/jesse-baxter" },
      { role: "Playwright", name: "Jason Williamson" },
      { role: "Composer", name: "Ana María Torres" },
    ] as PersonRole[],
    castOverride: [
      { role: "Chaska", name: "Lucille Baxter" },
      { role: "Condor", name: "Seamus Baxter" },
      { role: "Mother", name: "Mary Baxter" },
    ] as PersonRole[],

    /** Media — Production Gallery (main) */
    galleryImages: [
      {
        src: "/images/Andean_Mask_Work.jpg",
        alt: "Actors exploring Andean mask work in rehearsal",
      },
      {
        src: "/images/teaching-andes.jpg",
        alt: "DAT artists leading a workshop in the Andes",
      },
      {
        src: "/images/teaching-amazon.jpg",
        alt: "Sharing a story circle with youth in the Amazon",
      },
    ],

    /** SECOND GALLERY — BTS / From the Field */
    fieldGalleryImages: [
      {
        src: "/images/Andean_Mask_Work.jpg",
        alt: "Actors exploring Andean mask work in rehearsal",
      },
      {
        src: "/images/teaching-andes.jpg",
        alt: "DAT artists leading a workshop in the Andes",
      },
      {
        src: "/images/teaching-amazon.jpg",
        alt: "Sharing a story circle with youth in the Amazon",
      },
    ],
    fieldGalleryTitle: "A Girl Without Wings — From the Field",
    // fieldAlbumHref / fieldAlbumLabel are optional; can be added later per show

    /** Production Gallery credit + album tile */
    productionPhotographer: "María López",
    productionAlbumHref:
      "https://www.flickr.com/photos/dat/albums/72177720399999999",
    productionAlbumLabel: "See full photo album",

    /** Resources (links-only list; quotes may be used as labels) */
    resources: [
      {
        label: "“A heartfelt, breathtaking story.” — The New York Times",
        href: "https://nytimes.com/…",
      },
      {
        label: "Village Voice feature",
        href: "https://villagevoice.com/…",
      },
      {
        label: "Behind the scenes: movement lab notes (PDF)",
        href: "/notes/agww-movement-lab.pdf",
      },
      {
        label: "DAT Global Play Initiative overview",
        href: "/programs/global-play-initiative",
      },
    ],

    /** Process (community-focused; image OR video supported) */
    processSections: [
      {
        heading: "Community Stories — Quito",
        body: [
          "We began with oral histories gathered across El Centro and the Valle.",
          "Trust first, scenes second.",
        ],
        // Example using YouTube (page.tsx can map this to the ProcessBand video prop)
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoTitle: "Community workshop reel",
        videoPoster: "/images/teaching-andes.jpg",
        quote: {
          text: "We found our voice together.",
          attribution: "María, participant",
        },
      },
      {
        heading: "Mask & Music Labs",
        body:
          "We prototyped masks with recycled materials and built a percussive score that later anchored key transitions.",
        image: {
          src: "/images/Andean_Mask_Work.jpg",
          alt: "Mask and movement development in Ecuador",
        },
      },
    ],

    /** Optional upcoming ticketed performances (tests all statuses) */
    upcomingShows: [
      {
        datetimeISO: "2026-07-12T19:30:00-05:00",
        venue: "Teatro Bolívar",
        city: "Quito, Ecuador",
        note: "Spanish/English supertitles",
        ticketsUrl: "https://tickets.example.com/agww-quito",
        status: "on-sale",
      },
      {
        datetimeISO: "2026-07-13T14:00:00-05:00",
        venue: "Teatro Bolívar",
        city: "Quito, Ecuador",
        note: "Student matinee",
        ticketsUrl: "https://tickets.example.com/agww-quito-matinee",
        status: "limited",
      },
      {
        datetimeISO: "2026-07-14T19:30:00-05:00",
        venue: "Teatro Bolívar",
        city: "Quito, Ecuador",
        note: "Final performance",
        ticketsUrl: "https://tickets.example.com/agww-quito-final",
        status: "sold-out",
      },
    ],

    // Optional “Get Updates” CTA when not on sale
    notifyMeUrl: "https://dramaticadventuretheatre.org/subscribe",

    /** Past run override + history timeline */
    pastRunOverride: {
      dateRange: "Sept 14 – Oct 8, 2013",
      city: "New York City",
      venue: "IATI Theater",
      festival: "Off-Off Broadway run",
    },
    historyRuns: [
      {
        dateRange: "Sept 14 – Oct 8, 2013",
        city: "NYC",
        venue: "IATI Theater",
        festival: "Off-Off Broadway",
      },
      {
        dateRange: "Jan 5 – Jan 20, 2015",
        city: "Quito, Ecuador",
        venue: "Casa de la Cultura",
      },
    ],

    /** “Now Playing” pointer to a different live show */
    nowPlaying: {
      title: "Blackfish",
      slug: "blackfish",
      dateRange: "July 2026",
      city: "Quito & NYC",
    },

    /** Related config (optional – used by buildRelated/page.tsx) */
    relatedBaseTitle: "A Girl Without Wings",
    // relatedTitle: "More from the Girl Without Wings cycle",

    /**
     * Archive mode: this is the original 2013 production — keep the ARCHIVE
     * status badge even though we're surfacing the 2027 revival below.
     */
    forceArchive: true,

    /**
     * The revival event (linked to a different production page) should still
     * appear in the events section of this archive so visitors can find it.
     */
    relatedUpcomingEventId: "agwow-iati-revival-2027",
  },

  
  // ── Revival production page ──────────────────────────────────────────────────
  "a-girl-without-wings-revival-2027": {
    heroImageUrl: "posters/a-girl-without-wings-landscape.jpg",

    subtitle: "The Revival — IATI Theater, NYC",

    creditPrefix: "DIRECTED BY",
    creditPeople: [
      { name: "Kathleen Amshoff", href: "/alumni/kathleen-amshoff" },
    ],

    dates: "14 March – 6 April 2027",
    festival: "Off-Off-Broadway Revival",
    venue: "IATI Theater",
    city: "New York City",
    runtime: "Approx. 2 hours with interval",
    ageRecommendation: "12+",

    synopsis: [
      "A lonely Condor and the beautiful Chaska fall hopelessly in love. Fortune, however, is not these lovers' friend — because Chaska is not another bird but a wingless shepherd girl.",
      "Fourteen years on from the original New York Times Critics' Pick, DAT's landmark Andean love story returns to IATI for a three-week run. The original creative team is joined by new voices from DAT's global network.",
      "A world of wicked hummingbirds, brightly colored threads of prayer reaching for the gods, and a storm of shoes that rains from the sky.",
    ],

    ticketsLink: "https://www.iatitheater.org/tickets",

    creativeTeamOverride: [
      { role: "Director", name: "Kathleen Amshoff", href: "/alumni/kathleen-amshoff" },
      { role: "Playwright", name: "Jason Williamson" },
      { role: "Artistic Director", name: "Jesse Baxter", href: "/alumni/jesse-baxter" },
      { role: "Composer", name: "Ana María Torres" },
      { role: "Set Design", name: "Brittany Vasta" },
      { role: "Lighting Design", name: "Carl Wiemann" },
      { role: "Costume Design", name: "Angela Harner" },
      { role: "Stage Manager", name: "Maxwell Waters" },
    ],

    castOverride: [
      { role: "Chaska", name: "Lucille Baxter" },
      { role: "Condor", name: "Seamus Baxter" },
      { role: "Mother", name: "Christen Madrazo" },
      { role: "Musician", name: "Thomas Burns Scully", href: "/alumni/thomas-burns-scully" },
    ],

    pullQuote: {
      quote:
        "This piece was born in the Andes, carried across the Atlantic, and rebuilt from scratch for every community it visited. The condor still flies. The girl is still brave. That never changes.",
      attribution: "Kathleen Amshoff, Director",
    },

    relatedBaseTitle: "A Girl Without Wings",
    relatedTitle: "The Full Production Cycle",
  },

  "voices-from-zimbabwe": {
    /** Hero image for the theatre page (adjust the path if needed) */
    heroImageUrl: "posters/voices-from-zimbabwe-landscape.jpg",

    subtitle:
      "",

    // Flexible credit line (preferred)
    creditPrefix: "CONCEIVED & DEVISED BY",
creditPeople: [
  { name: "Kathleen Amshoff", href: "/alumni/kathleen-amshoff" },
  { name: "Lisa Bearpark", href: "/alumni/lisa-bearpark" },
  { name: "Jesse Baxter", href: "/alumni/jesse-baxter" },
  { name: "Mary K. Baxter", href: "/alumni/mary-k-baxter" },
  { name: "Oscar Manzini", href: "/alumni/oscar-manzini" },
],

    useCustomAboutLayout: true,

    // Meta
    dates: "Original Production • 2007",
    festival: "North East US Tour",
    venue: "Load of Fun, Bricolage Production Co., and more",
    venueHref: "https://www.bricolagepgh.org/",
    city: "Baltimore, Pittsburg, and Rochester",
    runtime: "",
    ageRecommendation: "",

    // About (multi-paragraph supported)
    synopsis: [
      "",
      "",
    ],
    themes: [
      "",
      "",
    ],
    pullQuote: {
      quote:
        "",
      attribution: "",
      attributionHref: "", // example
    },
    quoteImageUrl: "",

    /** Community / causes */
    dramaClubSlug: "bulawayo-young-company",

    causes: [
      {
        label: "Arts Education Access",
        // Education Access, Equity & Opportunity
        category: "education-access-equity-opportunity",
        subcategory: "arts-education-access",
        // no icon / href → tests text-only cause chip + taxonomy slug
      },
    ],

    partners: [
      {
        name: "Amakhosi Cultural Centre",
        href: "https://www.facebook.com/profile.php?id=61566556743917",
        type: "community",
        logoSrc: "/images/partners/amakhosi.jpg",
        logoAlt: "Amakhosi Cultural Centre",
      },
      {
        name: "Forgotten Voices International",
        href: "https://www.forgottenvoices.org/",
        type: "impact",
        logoSrc: "/partners/forgotten-voices.png",
        logoAlt: "Forgotten Voices International",
      },
    ],

    /** CTAs */
    getInvolvedLink: "https://dramaticadventure.com/get-involved",
    donateLink: "/donate",
    ticketsLink: "https://dramaticadventure.com/tickets",

    /** Media — Production Gallery (main) */
    galleryImages: [
      {
        src: "",
        alt: "",
      },
      {
        src: "",
        alt: "",
      },
      {
        src: "",
        alt: "",
      },
    ],

    /** SECOND GALLERY — BTS / From the Field */
    fieldGalleryImages: [
      {
        src: "",
        alt: "",
      },
      {
        src: "",
        alt: "",
      },
      {
        src: "",
        alt: "",
      },
    ],
    fieldGalleryTitle: "Voices from Zimbabwe — From the Field",
    // fieldAlbumHref / fieldAlbumLabel are optional; can be added later per show

    /** Production Gallery credit + album tile */
    productionPhotographer: "",
    productionAlbumHref:
      "",
    productionAlbumLabel: "See full photo album",

    /** Resources (links-only list; quotes may be used as labels) */
    resources: [
      {
        label: "",
        href: "",
      },
      {
        label: "",
        href: "",
      },
      {
        label: "",
        href: "",
      },
      {
        label: "",
        href: "",
      },
    ],

    /** Process (community-focused; image OR video supported) */
    // processSections: [
//   {
//     heading: "",
//     body: [
//       "",
//       "",
//     ],
//     videoUrl: "",
//     videoTitle: "",
//     videoPoster: "",
//     quote: {
//       text: "",
//       attribution: "",
//     },
//   },
//   {
//     heading: "",
//     body: "",
//     image: {
//       src: "",
//       alt: "",
//     },
//   },
// ],


    
    // Optional “Get Updates” CTA when not on sale
    notifyMeUrl: "https://dramaticadventuretheatre.org/subscribe",

    /** Past run override + history timeline */
    pastRunOverride: {
      dateRange: "",
      city: "",
      venue: "",
      festival: "",
    },
    historyRuns: [
      {
        dateRange: "2007",
        city: "Baltimore, MD",
        venue: "Load of Fun Theatre",
        festival: "",
      },
      {
        dateRange: "2007",
        city: "Pittsburgh, PA",
        venue: "Bricolage Production Co.",
      },
    ],

    /** “Now Playing” pointer to a different live show */
    nowPlaying: {
      title: "",
      slug: "",
      dateRange: "",
      city: "",
    },

  },

  // ...add other productions here
};
