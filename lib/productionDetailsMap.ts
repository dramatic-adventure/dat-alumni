// lib/productionDetailsMap.ts
import type {
  PersonRole,
  GalleryImage,
} from "@/components/productions/ProductionPageTemplate";

/** Link + optional logo for partners */
export type PartnerLink = {
  name: string;
  href: string;
  /** page.tsx will normalize to the template’s union */
  type: "community" | "artistic" | "impact" | "primary";
  logoSrc?: string;
  logoAlt?: string;
};

/** Generic causes the production supports (with optional icon + link) */
export type CauseItem = {
  label: string;    // e.g., "Indigenous Rights", "Environmental Conservation"
  iconSrc?: string; // optional icon path under /public
  iconAlt?: string;
  href?: string;    // optional link to DAT cause page
};

/** Per-show extras that keep the page generic and data-driven */
export interface ProductionExtra {
  /** Optional override for the hero/banner image in the theatre page */
  heroImageUrl?: string;

  /** Tagline that appears in the white card (Row 2) */
  subtitle?: string;

  /** Legacy single-playwright fields (still supported) */
  playwright?: string;
  playwrightHref?: string;

  /** Flexible credit line (preferred) */
  creditPrefix?: string; // e.g., "BY", "A NEW PLAY BY", "AN ADAPTATION BY"
  creditPeople?: { name: string; href?: string }[]; // supports multiple names

  /** Meta (all optional; page assembles what's provided) */
  dates?: string;               // freeform range, e.g., "Sept 14 – Oct 8, 2013"
  festival?: string;            // e.g., "Edinburgh Fringe"
  festivalHref?: string;        // link if available
  venue?: string;               // e.g., "IATI Theater"
  venueHref?: string;           // link if available
  city?: string;                // e.g., "NYC" or "Quito, Ecuador"
  runtime?: string;             // e.g., "95 minutes"
  ageRecommendation?: string;   // e.g., "Ages 12+"

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
  productionPhotographer?: string;   // e.g., "María López"
  productionAlbumHref?: string;      // e.g., Flickr album URL
  productionAlbumLabel?: string;     // e.g., "Full photo album"

  /** Links section (replaces 'pressQuotes' with a general-purpose list) */
  resources?: Array<{
    label: string;   // text shown in the RESOURCES list
    href: string;    // absolute or relative URL
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
    datetimeISO: string;                 // e.g. "2026-07-12T19:30:00-05:00"
    venue?: string;                      // e.g. "Teatro Bolívar"
    city?: string;                       // e.g. "Quito"
    note?: string;                       // e.g. "ASL-interpreted performance"
    ticketsUrl?: string;                 // purchase link
    status?: "on-sale" | "sold-out" | "limited";
  }[];

  // -------------------------------
  // BOX OFFICE / RUN STATE
  // -------------------------------

  /** Manual override for past run summary */
  pastRunOverride?: {
    dateRange?: string;   // "Sept 14–Oct 8, 2019"
    city?: string;        // "Quito, Ecuador"
    venue?: string;       // "Teatro Nacional Sucre"
    festival?: string;    // "Manta Festival"
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
    slug: string;         // link target: /theatre/[slug]
    dateRange?: string;
    city?: string;
  };
}

/** Per-slug details. Keep show-specific content here—page remains generic. */
export const productionDetailsMap: Record<string, ProductionExtra> = {
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
      "Connection",
      "Coming of age",
      "Community resilience",
      "Myth & folklore",
    ],
    pullQuote: {
      quote:
        "Not much is typical about ‘A Girl without Wings.’ Poignant. Sensitively directed. Magical.",
      attribution: "Laurel Graeber, The New York Times",
      attributionHref: "https://www.nytimes.com/...", // example
    },
    quoteImageUrl: "/images/Andean_Mask_Work.jpg",

    /** Community / causes / partners */
    // you can optionally add dramaClubSlug here if you create one in dramaClubs
    dramaClubName: "The Pachaysana Drama Club",
    dramaClubLocation: "Quilotoa, Ecuador",
    dramaClubLink:
      "https://dramaticadventuretheatre.org/drama-clubs/pachaysana",

    causes: [
      {
        label: "Environmental Conservation",
        iconSrc: "/icons/cause-environment.svg",
        iconAlt: "Environmental Conservation",
        href: "/impact/environmental-conservation",
      },
      {
        label: "Indigenous Rights",
        iconSrc: "/icons/cause-indigenous.svg",
        iconAlt: "Indigenous Rights",
        href: "/impact/indigenous-rights",
      },
      {
        // Tests a cause with no icon
        label: "Arts Education Access",
        href: "/impact/arts-education",
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
    donateLink: "https://dramaticadventuretheatre.org/donate",
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
  },

  // ...add other productions here
};
