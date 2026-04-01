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

  ticketUrl?: string;
  /** URL for the venue's own website (used for the venue pill link in the hero) */
  venueUrl?: string;
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
  pressQuotes?: { text: string; attribution: string }[];

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
      pressQuotes?: { text: string; attribution: string }[];
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

  // ── DEMO EVENT: everything activated — Una Niña Sin Alas, Quito co-production ─
  // Full showcase of every optional field on the event detail page.
  // Spanish + Kichwa language co-production with Malayerba Teatro, Quito.
  // Uses actual DAT alumni with real headshot URLs and /alumni/ profile links.

  {
    id: "agwow-malayerba-quito-2026",
    title: "Una Niña Sin Alas",
    subtitle: "Co-producción DAT × Malayerba Teatro",
    category: "performance",
    status: "upcoming",
    date: "2026-09-24",
    endDate: "2026-10-11",
    time: "20:00",
    doors: "Puertas a las 19:30",
    venue: "Teatro Malayerba",
    address: "Lizardo García N4-30 y Reina Victoria, La Floresta",
    city: "Quito",
    country: "Ecuador",
    description:
      "En español y kichwa. DAT y Malayerba Teatro traen de vuelta la historia de amor más premiada de la compañía — un cóndor solitario y la pastora sin alas que robó su corazón.",
    longDescription:
      "Un cóndor solitario y la hermosa Chaska se enamoran perdidamente. Pero la fortuna no sonríe a estos amantes: Chaska no es un pájaro más, sino una pastora sin alas, atada a la tierra.\n\nEn los despiadados y bellos Andes, el amor y el dolor entre un semidiós que anhela compañía y una muchacha que debe dejar su familia para ascender al cielo toman vida en un mundo de títeres y leyenda kichwa.\n\nUna Niña Sin Alas sumerge al público en un universo donde un cuento del altiplano andino renace entre picaflores traviesos, hilos de oración de colores y una tormenta de zapatos que llueve del cielo.\n\nCelebrada por The New York Times en su estreno en inglés, esta co-producción con Malayerba Teatro la presenta por primera vez en español y kichwa. Una historia nacida en las montañas que regresa a ellas.",
    image: "/posters/a-girl-without-wings-landscape.jpg",
    imageFocus: "center 35%",
    ticketUrl: "https://www.ticketshow.com.ec",
    venueUrl: "https://www.teatromalayerba.com",
    ticketPrice: "$15 / $8 estudiantes",
    runtime: "Approx. 80 min · No interval",
    language: "Spanish & Kichwa",
    suitability: "Ages 10+",
    ticketType: "ticketed",
    featured: true,
    tags: ["New York Times Critics Pick", "kichwa", "español", "Quito", "Andes", "Malayerba", "títeres", "co-producción"],
    production: "a-girl-without-wings-revival-2027",
    dramaClub: "quito-collective",
    contactEmail: "hello@dramaticadventure.com",
    donateLink: "/donate?mode=new-work&production=agwow-quito-2026",
    impactBlurb: "Esta co-producción sustenta la red de Drama Clubs de DAT en el Ecuador — formando nuevas generaciones de artistas comunitarios en Quito y más allá. Tu apoyo hace posible el teatro que nace de la comunidad.",

    // ── Rich content: every section fully populated ───────────────────────────

    photoGallery: [
      {
        src: "/images/Andean_Mask_Work.jpg",
        alt: "Trabajo de máscaras con el elenco — residencia de creación en Quito",
      },
      {
        src: "/images/theatre/archive/agwow-condor.webp",
        alt: "El Cóndor — imagen de archivo de la producción original",
      },
      {
        src: "/images/teaching-andes.jpg",
        alt: "Artistas de DAT en los Andes durante la investigación comunitaria",
      },
      {
        src: "/images/teaching-amazon.jpg",
        alt: "Taller de narración con jóvenes en la Amazonía ecuatoriana",
      },
      {
        src: "/images/performing-zanzibar.jpg",
        alt: "Momento de actuación en gira internacional",
      },
    ],
    photoCredit: "Archivo DAT / Malayerba Teatro",
    photographerHref: "https://www.teatromalayerba.com",
    albumHref: "https://photos.dramaticadventure.com/agwow-quito-2026",

    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoTitle: "Mira: Tráiler — Una Niña Sin Alas",

    artistNote:
      "Esta pieza nació en los Andes, viajó por tres continentes y fue reconstruida desde cero para cada comunidad que la recibió. Lo que ven esta noche no es un simple revival — es un re-enraizamiento. El cóndor todavía vuela. La niña todavía es valiente. Eso nunca cambia.",
    artistNoteBy: "Kathleen Amshoff, Directora",

    // Cast & creative team — actual DAT alumni with headshots and profile links.
    // group: "creative" → Creative Team section; group: "cast" → Cast section (with photos)
    credits: [
      // Creative Team
      { group: "creative", role: "Dirección",            name: "Kathleen Amshoff",       href: "/alumni/kathleen-amshoff" },
      { group: "creative", role: "Dirección Artística",  name: "Jesse Baxter",            href: "/alumni/jesse-baxter" },
      { group: "creative", role: "Dramaturgia",          name: "Jason Williamson",         href: "/alumni/jason-williamson" },
      { group: "creative", role: "Traducción al Español",name: "Karina Vélez",             href: "/alumni/karina-velez" },
      { group: "creative", role: "Traducción al Kichwa", name: "Edward Serrate Yujo",      href: "/alumni/edward-serrate-yujo" },
      { group: "creative", role: "Diseño de Títeres",    name: "Maria-Isabel Rojas",       href: "/alumni/maria-isabel-rojas" },
      { group: "creative", role: "Producción",           name: 'Juliana "Juice" Franco',   href: "/alumni/juliana-franco" },
      // Cast (with real alumni headshots)
      {
        group: "cast",
        role: "Chaska",
        name: "Isabel Martínez",
        href: "/alumni/isa-martinez",
        photo: "https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1688754593745-N9E8YZU0VE49QMQIOG4J/Marisa+Puller+007.jpg",
      },
      {
        group: "cast",
        role: "El Cóndor",
        name: "Javier Spivey",
        href: "/alumni/javier-spivey",
        photo: "http://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1613937012050-7HWDMXIJ72U50MKM7JSQ/javier.PNG",
      },
      {
        group: "cast",
        role: "La Madre",
        name: "Ana Arellano",
        href: "/alumni/ana-arellano",
        photo: "http://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1616727468148-OBFR2IM4WPQ43JVPXH13/21728911_10156595589829056_8394607501235178776_o.jpg",
      },
      {
        group: "cast",
        role: "Picaflor",
        name: "Yan Rey",
        href: "/alumni/yan-rey",
        photo: "http://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1688752206990-AL7Y5GAW3AMGR71JYRJD/Yan_foto-perfil.jpg",
      },
      {
        group: "cast",
        role: "Narradora",
        name: "Daniela Garzón-Silva",
        href: "/alumni/daniela-garzon-silva",
        photo: "http://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1688755665448-6R1OMNYCMKOS8G1CZMPH/IMG_2761.jpg",
      },
      {
        group: "cast",
        role: "Músico Principal",
        name: "Thomas Burns Scully",
        href: "/alumni/thomas-burns-scully",
        photo: "http://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1613454794191-W20YLPVCQ2ZLXOAR79HU/thomas.jpg",
      },
    ],

    pressQuotes: [
      {
        text: "Not much is typical about 'A Girl without Wings.' Poignant. Sensitively directed. Magical.",
        attribution: "Laurel Graeber, The New York Times",
      },
      {
        text: "Una historia de amor que pertenece al cielo y a la tierra. Teatro en su estado más vivo.",
        attribution: "El Comercio, Quito",
      },
      {
        text: "Imaginación teatral pura. Lloré dos veces. Y no soy de las que lloran.",
        attribution: "Espectadora, Teatro Malayerba",
      },
    ],

    accessibility:
      "Acceso sin escalones por entrada principal · Función audiodescrita: 3 oct · Función con interpretación LSEC: 10 oct · Subtítulos en inglés disponibles",

    groupBookingEmail: "produccion@malayerba.org",

    defaultLang: "es",
    translations: {
      en: {
        title: "A Girl Without Wings",
        subtitle: "DAT × Malayerba Teatro Co-production",
        description:
          "In Spanish & Kichwa. DAT and Malayerba Teatro revive the company's most celebrated love story — a solitary condor and the wingless shepherdess who stole his heart.",
        longDescription:
          "A solitary condor and the beautiful Chaska fall desperately in love. But fortune does not smile on these lovers: Chaska is no ordinary bird — she is a wingless shepherdess, bound to the earth.\n\nIn the merciless and beautiful Andes, the love and sorrow between a demigod who longs for companionship and a girl who must leave her family to ascend to the sky take life in a world of puppets and Kichwa legend.\n\nA Girl Without Wings immerses audiences in a universe where a tale from the Andean highlands is reborn among mischievous hummingbirds, coloured prayer threads, and a storm of shoes raining from the sky.\n\nCelebrated by The New York Times at its English-language premiere, this co-production with Malayerba Teatro presents the work for the first time in Spanish and Kichwa — a story born in the mountains that returns to them.",
        artistNote:
          "This piece was born in the Andes, travelled across three continents, and was rebuilt from scratch for every community that received it. What you see tonight is not a simple revival — it is a re-rooting. The condor still flies. The girl is still brave. That never changes.",
        artistNoteBy: "Kathleen Amshoff, Director",
        impactBlurb:
          "This co-production sustains DAT's network of Drama Clubs in Ecuador — forming new generations of community artists in Quito and beyond. Your support makes theatre that is born from community possible.",
        videoTitle: "Watch: Trailer — A Girl Without Wings",
        pressQuotes: [
          {
            text: "Not much is typical about 'A Girl without Wings.' Poignant. Sensitively directed. Magical.",
            attribution: "Laurel Graeber, The New York Times",
          },
          {
            text: "A love story that belongs to the sky and the earth. Theatre at its most alive.",
            attribution: "El Comercio, Quito (translated)",
          },
          {
            text: "Pure theatrical imagination. I cried twice. And I am not one who cries.",
            attribution: "Audience member, Teatro Malayerba (translated)",
          },
        ],
      },
    },
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
    subtitle: "Projects, Artists, and How to Get Involved",
    category: "fundraiser",
    status: "upcoming",
    date: "2026-04-30",
    time: "7:00 PM ET",
    venue: "Online — YouTube Live + Zoom",
    city: "Worldwide",
    country: "Online",
    description:
      "Join DAT live for a look at this summer’s projects, with artist introductions, program highlights, and a chance to learn how to be part of the journeys, communities, and creative work ahead.",
    longDescription:
      "DAT Summer 2026 Launch is an online community gathering designed to introduce this summer’s projects and invite audiences, artists, and supporters into what comes next. Join us for artist introductions, program highlights, stories behind the work, and a look at the places, partnerships, and creative adventures shaping DAT’s summer season. Whether you are hoping to participate, collaborate, follow along, or support the work, this is a chance to connect early and learn how to be part of the journey ahead.",
    image: "/images/theatre/archive/blackfish_mommy.webp",
    imageFocus: "center 25%",
    ticketUrl: "https://dramaticadventure.com/summer-2026",
    ticketPrice: "Free — registration encouraged",
    ticketType: "free",
    featured: true,
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
    featured: false,
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
    id: "joint-drama-club-showcase-slovakia-2026",
    title: "Joint Community Showcase",
    subtitle: "Zemplínska Teplica Youth Ensemble + Luník IX Collective",
    category: "performance",
    subcategory: "community-showcase",
    status: "upcoming",
    date: "2026-07-24",
    time: "Afternoon",
    venue: "TBD",
    city: "Slovakia",
    country: "Slovakia",
    dramaClubs: ["zemplinska-teplica-youth-ensemble", "lunik-ix-collective"],
    description:
      "A special daytime community showcase featuring the Zemplínska Teplica Youth Ensemble and the Luník IX Collective in an afternoon of performance, storytelling, and celebration.",
    longDescription:
      "This joint community showcase brings together young artists from DAT’s Zemplínska Teplica Youth Ensemble and Luník IX Collective for a shared afternoon of performance, storytelling, and connection. Created through workshops, collaboration, and community-based theatre-making, the event celebrates the creativity, courage, and collective spirit of these young artists while honoring the relationships built across both communities. Join us for a joyful daytime gathering that highlights the power of young people finding their voice through theatre.",
    image: "/images/theatre/archive/tembo.webp",
    ticketUrl: "https://dramaticadventure.com",
    ticketPrice: "Free — donations welcome",
    ticketType: "free",
    featured: false,
    tags: [
      "community showcase",
      "drama clubs",
      "Slovakia",
      "youth theatre",
      "Luník IX",
      "Zemplínska Teplica",
    ],
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

export function eventById(id: string): DatEvent | undefined {
  return events.find((e) => e.id === id);
}

export function allEventIds(): string[] {
  return events.map((e) => e.id);
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
