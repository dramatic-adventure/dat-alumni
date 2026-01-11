// lib/dramaClubMap.ts

import type { DramaClubCause } from "@/lib/causes";
import type { PersonRef } from "@/lib/buildDramaClubLeadTeam";

export type { PersonRef } from "@/lib/buildDramaClubLeadTeam";

export type DramaClubStatus = "ongoing" | "new" | "legacy";

// ---------- v2+ helper types (used by DRAMA_CLUB_TEMPLATE_FULL) ----------

export type EmbeddableVideo = {
  /** A share URL (YouTube/Vimeo/etc) */
  url: string;
  provider?: "youtube" | "vimeo" | "loom" | "direct" | "other";
  title?: string;
  embedUrl?: string;
  thumbnailSrc?: string;
};

export type DramaClubWorkingLanguages = {
  /** Primary working language in the room */
  primary: string;
  /** Other languages commonly used */
  secondary?: string[];
  /** Optional short label override for UI */
  labelOverride?: string;
};

export type DramaClubImpactStat = {
  label: string;
  value: number | string;
  unit?: string;
  note?: string;
};

export type DramaClubDraft = {
  // Identity
  slug: string;
  name: string;

  // Geography
  country: string;
  region?: string;
  city?: string;

  heroTextureTagline?: string;
  heroTextureSrc?: string;
  regionTextureSrc?: string;

  // Display helpers
  location?: string;
  shortBlurb?: string;
  cardImage?: string;

  // Branding
  logoSrc?: string;
  logoAlt?: string;

  // Images / Media
  heroImage?: string;
  gallery: { src: string; alt: string }[];
  video?: EmbeddableVideo;
  videoThumbnail?: string;
  videoTitle?: string;

  // Narrative / Story
  description: string;
  whatHappens?: string;
  originStory?: string;

  language?: string | string[];
  workingLanguages?: DramaClubWorkingLanguages;

  ageRange?: string;
  whoWeServe?: string;

  localLanguageName?: string;
  localLanguageLabel?: string;

  coreFocus?: string;
  localChallenge?: string;

  roomFeelsLike?: string;
  roomFeelsLikeOverride?: string;

  elderQuote?: {
    text: string;
    name?: string;
    role?: string;
    avatarSrc?: string;
  };

  alumniQuote?: {
    text: string;
    name?: string;
    role?: string;
  };

  culturalExchangeLearn?: string;
  culturalExchangeShare?: string;

  // Status & activity timeline
  status?: DramaClubStatus;
  foundedYear?: number;
  yearsActive?: number;

  firstYearActive?: number;
  lastYearActive?: number | "present";
  statusOverride?: DramaClubStatus;

  // Impact / activity
  youthArtistsServed?: number;
  approxYouthServed?: number;
  youthReached?: number;

  showcasesCount?: number;
  communityShowcases?: number;
  approxCommunityAudience?: number;

  currentImpactStats: DramaClubImpactStat[];
  sponsorshipUnlockStats: DramaClubImpactStat[];

  currentWeeksPerYear?: number;
  targetWeeksPerYear?: number;
  currentLocalFacilitators?: number;
  targetLocalFacilitators?: number;

  // Community / relationships
  meetingPlace?: string;
  communityAnchor?: string;
  leadPartner?: string;

  partners: string[];
  communityPartners: NonNullable<DramaClub["communityPartners"]>;
  communityNeeds: string[];
  localContext?: string;

  leadArtist?: PersonRef;
  leadArtists: string[];
  currentProjects: string[];

  // Artist / AIR pathways
  artistPathwaysBlurb?: string;
  visitingArtists: PersonRef[];

  // Causes / focus areas
  causes: DramaClubCause[];
  primaryCause?: DramaClubCause;
  primaryCauseSlug?: string;
  causeSlugs: string[];

  // Map + cross-links
  lat?: number;
  lng?: number;
  storyMapHref?: string;

  relatedProgramSlugs: string[];
};

export type DramaClub = {
  // ========================
  // Identity
  // ========================
  slug: string; // used for routes, links, and lookups
  name: string;

  // Geography / region
  country: string;
  region?: string; // e.g. "Amazon", "Andes", "Galápagos", "Central Europe"
  city?: string;

  /**
   * Optional short hero tagline used in the page hero
   * for texture/landscape context, e.g. "the Amazon • Shuar Territory".
   */
  heroTextureTagline?: string;

  // Display helpers for cards / index views
  location?: string; // "Community center & jungle clearing", etc.
  shortBlurb?: string; // tighter version of description for mini cards
  cardImage?: string; // dedicated image for mini cards (can differ from heroImage)

  // Branding hooks (optional – can wire up to logos / badges later)
  logoSrc?: string;
  logoAlt?: string;

  // ========================
  // Images / Media
  // ========================
  heroImage?: string;
  gallery?: { src: string; alt: string }[];

  // Optional media for Documentation section
  video?: EmbeddableVideo;

  videoThumbnail?: string;
  videoTitle?: string;

  // ========================
  // Narrative / Story
  // ========================
  /**
   * Core description used across the site (index, cards, etc.).
   * For the slug page, this can back “What happens in this Club”
   * if a more specific `whatHappens` field is not provided.
   */
  description: string;

  /**
   * Optional more focused copy specifically for the
   * “What happens in this Club” block.
   */
  whatHappens?: string;

  originStory?: string;
  language?: string | string[]; // local language label, e.g. "Shuar"

  /**
   * Club name in the local language (e.g. Shuar name).
   * Paired with `localLanguageLabel` like "In Shuar".
   */
  localLanguageName?: string;
  localLanguageLabel?: string;

  // Elder / local hero micro-quote
  elderQuote?: {
    text: string;
    name?: string;
    avatarSrc?: string;
  };

  // Alumni / participant quote snippet
  alumniQuote?: {
    text: string;
    name?: string;
    role?: string;
  };

  // Cultural exchange snippet fields:
  // "What we learn / What we share"
  culturalExchangeLearn?: string;
  culturalExchangeShare?: string;

  // ========================
  // Status & activity timeline
  // ========================
  /**
   * Legacy/manual status field used by some older UI.
   * Prefer `statusOverride` + `computeDramaClubStatus` going forward.
   */
  status?: DramaClubStatus;

  /**
   * Optional original year metadata for copy (e.g. "founded in 2019",
   * "active for 4 seasons"). These may not match a simple last-first+1.
   */
  foundedYear?: number;
  yearsActive?: number;

  /**
   * Dynamic status hooks:
   * - firstYearActive: when the club started
   * - lastYearActive: most recent year with activity OR "present" while active
   *   e.g. firstYearActive: 2019, lastYearActive: "present" → 2019–Present
   */
  firstYearActive?: number;
  lastYearActive?: number | "present";
  statusOverride?: DramaClubStatus;

  // ========================
  // Impact / activity
  // ========================
  /**
   * Approximate youth served total. For the slug page, you can either
   * use this directly, or mirror it into `youthReached`.
   */
  approxYouthServed?: number;

  /**
   * Semantic alias for impact UI. When undefined, the UI can fall back
   * to `approxYouthServed`.
   */
  youthReached?: number;

  /**
   * Approximate number of showcases / public sharings.
   */
  showcasesCount?: number;

  /**
   * Semantic alias for impact UI – code can treat this as
   * `communityShowcases ?? showcasesCount`.
   */
  communityShowcases?: number;

  /**
   * Cumulative audience members across showcases / share-backs.
   */
  approxCommunityAudience?: number;

  // ========================
  // Community / relationships
  // ========================
  /**
   * Short label for "Gathering place" in the Club snapshot,
   * e.g. "Community center & jungle clearing".
   * (More precise than `location` when needed.)
   */
  meetingPlace?: string;

  /**
   * Simple list of partner names (backwards-compatible).
   */
  partners?: string[]; // ETP Slovensko, Roma Museum, etc.

  /**
   * Richer partner objects for the Community section.
   */
  communityPartners?: {
    name: string;
    logoSrc?: string;
  }[];

  /**
   * Short list of specific community needs (3-ish bullets).
   */
  communityNeeds?: string[];

  /**
   * One short paragraph giving local context for funders / partners.
   */
  localContext?: string;

  /**
   * Lead artists (names or future alumni slugs – hook into profiles later).
   */
  leadArtists?: string[];

  currentProjects?: string[];

  // ========================
  // Artist / AIR pathways
  // ========================
  /**
   * Short blurb for “How we make theatre here.”
   */
  artistPathwaysBlurb?: string;

  /**
   * Visiting artist avatars row.
   */
  visitingArtists?: {
    name: string;
    avatarSrc?: string;
  }[];

  /**
   * Alumni micro-cards for Artist Pathways, linking to /alumni/[slug].
   */
  alumniPathways?: {
    name: string;
    role: string;
    slug: string;
  }[];

  // ========================
  // Causes / focus areas
  // ========================
  causes?: DramaClubCause[];
  causeSlugs?: string[];

  // ========================
  // Map hooks
  // ========================
  lat?: number;
  lng?: number;

  // ========================
  // Optional cross-links to programs that are tightly related to this club, e.g. ACTion, RAW, CASTAWAY, etc.
  // ========================
  relatedProgramSlugs?: string[];
};

// Image helpers (all live under /public)
const FALLBACK_IMAGE = "/images/drama-clubs/club-fallback.jpg";
const SAMPLE_IMAGE = "/images/drama-clubs/club-sample.jpg";
const IMG_MASKED = "/images/masked-adjustment.png";
const IMG_ZANZIBAR = "/images/performing-zanzibar.jpg";
const IMG_NITRA = "/images/rehearsing-nitra.jpg";
const IMG_AMAZON = "/images/teaching-amazon.jpg";
const IMG_ANDES = "/images/teaching-andes.jpg";
const IMG_ANDEAN_MASK = "/images/Andean_Mask_Work.jpg";

/**
 * ✅ Full template with EVERY field present.
 * Optional fields default to `undefined` (not "" or []) so UI can truly skip.
 *
 * Exported so you can import it anywhere as a “blank club” reference.
 */
export const DRAMA_CLUB_TEMPLATE: DramaClub = {
  // required
  slug: "",
  name: "",
  country: "",
  description: "",

  // optional
  region: undefined,
  city: undefined,
  heroTextureTagline: undefined,

  location: undefined,
  shortBlurb: undefined,
  cardImage: undefined,

  logoSrc: undefined,
  logoAlt: undefined,

  heroImage: undefined,
  gallery: undefined,

  video: undefined,

  videoThumbnail: undefined,
  videoTitle: undefined,

  whatHappens: undefined,
  originStory: undefined,
  language: undefined,
  localLanguageName: undefined,
  localLanguageLabel: undefined,

  elderQuote: undefined,
  alumniQuote: undefined,
  culturalExchangeLearn: undefined,
  culturalExchangeShare: undefined,

  status: undefined,
  foundedYear: undefined,
  yearsActive: undefined,
  firstYearActive: undefined,
  lastYearActive: undefined,
  statusOverride: undefined,

  approxYouthServed: undefined,
  youthReached: undefined,
  showcasesCount: undefined,
  communityShowcases: undefined,
  approxCommunityAudience: undefined,

  meetingPlace: undefined,
  partners: undefined,
  communityPartners: undefined,
  communityNeeds: undefined,
  localContext: undefined,

  leadArtists: undefined,
  currentProjects: undefined,

  artistPathwaysBlurb: undefined,
  visitingArtists: undefined,
  alumniPathways: undefined,

  causes: undefined,
  causeSlugs: undefined,

  lat: undefined,
  lng: undefined,
  relatedProgramSlugs: undefined,
};

export const dramaClubMap: Record<string, DramaClub> = {
  /* ============================
     ECUADOR – ANDES
     ============================ */

  "quito-collective": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "quito-collective",
    name: "Quito Collective",
    country: "Ecuador",
    region: "Andes Mountains",
    city: "Quito",

    heroTextureTagline: "Andes • Hilltop Capital",
    location: "Downtown cultural centers & university spaces",
    meetingPlace: "Borrowed rehearsal rooms & university studios",
    shortBlurb:
      "A city-center lab where Quito’s young artists devise new work that speaks to a changing capital.",
    cardImage: IMG_ANDES,

    heroImage: IMG_ANDES,
    gallery: [
      { src: IMG_ANDES, alt: "Quito Youth Drama Lab ensemble in rehearsal" },
      { src: FALLBACK_IMAGE, alt: "Warm-up circle in a Quito studio" },
    ],

    video: {
      url: "https://youtu.be/jhdkvuWrWh4?si=WBNbv-l6Erq4iTs8",
      provider: "youtube",
      title: "Video example (placeholder)",
    },

    description:
      "A city-center drama lab in Quito where young artists devise new work inspired by life in Ecuador’s bustling capital.",
    whatHappens:
      "Each cycle, young artists gather in borrowed rehearsal rooms and university studios to improvise, write, and stage original pieces about life in Quito’s hills and streets.",
    originStory:
      "Developed around DAT visits and culminating performances in Quito, the lab became a way to keep local youth connected to artists and each other between larger projects.",
    language: "Spanish",

    culturalExchangeLearn:
      "We learn how urban youth read the city’s contradictions—tradition, tourism, protest, ambition—and turn that pressure into story.",
    culturalExchangeShare:
      "We share devising tools that help artists shape personal experiences into theatre that can travel to other DAT hubs.",

    statusOverride: "ongoing",

    approxYouthServed: 60,
    youthReached: 60,
    showcasesCount: 8,
    communityShowcases: 8,
    approxCommunityAudience: 800,

    communityPartners: [
      { name: "Local cultural centers", logoSrc: SAMPLE_IMAGE },
      { name: "Quito-based universities", logoSrc: SAMPLE_IMAGE },
    ],
    partners: ["Local cultural centers", "Quito-based universities"],
    communityNeeds: [
      "Consistent rehearsal space in the city center",
      "Stipends for youth leaders and coordinators",
      "Production support for public sharings",
    ],
    localContext:
      "Quito’s young artists live between Andean traditions, tourism, and rapid urban change. The lab offers a rare, low-cost creative home in a city where rehearsal space is scarce.",

    leadArtists: ["jesse-baxter"],
    currentProjects: [
      "City Stories: Quito monologues & movement",
      "Neighborhood myths (site-responsive mini-scenes)",
    ],

    artistPathwaysBlurb:
      "Quito is where visiting DAT artists and local youth test new ideas between journeys—experimenting with forms that can later travel to other hubs.",

    visitingArtists: [
      { name: "DAT Visiting Artist 1", avatarSrc: IMG_ANDEAN_MASK },
      { name: "DAT Visiting Artist 2", avatarSrc: SAMPLE_IMAGE },
    ],
    alumniPathways: [
      { name: "Local Alum – Ana", role: "Performer & peer mentor", slug: "ana-quito-alum" },
    ],

    causes: [
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
      { category: "education-access-equity-opportunity", subcategory: "arts-education-access" },
      { category: "youth-empowerment-mental-health-wellbeing", subcategory: "youth-leadership" },
      { category: "education-access-equity-opportunity", subcategory: "global-learning-cultural-literacy" },
    ],

    // Quito city center
    lat: -0.180653,
    lng: -78.467838,
  },

  "cuenca-creative-lab": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "cuenca-creative-lab",
    name: "Cuenca Creative Lab",
    country: "Ecuador",
    region: "Andes Mountains",
    city: "Cuenca",

    heroTextureTagline: "Andes • Historic River City",
    location: "Historic center & riverside parks",
    meetingPlace: "Historic plazas & riverside rehearsal spots",
    shortBlurb:
      "An upcoming lab in Cuenca where young artists explore story, place, and identity through devised theatre.",
    cardImage: IMG_ANDEAN_MASK,

    heroImage: IMG_ANDEAN_MASK,
    gallery: [
      { src: IMG_ANDEAN_MASK, alt: "Andean mask work (placeholder for Cuenca lab)" },
      { src: FALLBACK_IMAGE, alt: "Placeholder image for Cuenca Creative Drama Lab" },
    ],

    description:
      "An upcoming drama lab in Cuenca, designed as a space for local youth to explore story, place, and identity through devised theatre.",
    whatHappens:
      "Youth build scenes and movement scores that respond to the city’s plazas, bridges, and riverfront walkways—turning everyday routes into performance.",
    originStory:
      "Planned as a future hub for ACTion and RAW artists, the lab connects Cuenca’s historic center with site-responsive performance and youth-led storytelling.",
    language: "Spanish",

    culturalExchangeLearn:
      "We learn how a historic city holds living memory—how tradition shapes the present and how youth remix it.",
    culturalExchangeShare:
      "We share tools for site-work: how to make theatre that listens to streets, steps, rivers, and public squares.",

    statusOverride: "new",

    communityPartners: [{ name: "Cuenca cultural offices", logoSrc: SAMPLE_IMAGE }],
    partners: ["Cuenca cultural offices"],
    communityNeeds: [
      "Seed funding to launch the first season",
      "Local coordinators to maintain the club year-round",
      "Travel support for visiting teaching artists",
    ],
    localContext:
      "Cuenca’s historic center is both a tourist hub and a lived-in neighborhood. The lab aims to foreground youth voices within that tension.",

    leadArtists: ["jesse-baxter"],
    currentProjects: ["Riverwalk scenes", "Plaza chorus experiments"],

    artistPathwaysBlurb:
      "Cuenca can become a slow-cook hub—long-form collaboration, deep craft, and a base for new work that feeds RAW, ACTion, and CASTAWAY.",

    causes: [
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
      { category: "education-access-equity-opportunity", subcategory: "literacy-learning-access" },
      { category: "community-wellbeing-safety-resilience", subcategory: "local-leadership-capacity-building" },
    ],

    // Cuenca city center
    lat: -2.90055,
    lng: -79.00453,
  },

  "quilotoa-collective": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "quilotoa-collective",
    name: "Quilotoa Collective",
    country: "Ecuador",
    region: "Andes Mountains",
    city: "Quilotoa",

    heroTextureTagline: "Andes • Crater-Lake Village",
    location: "Community center & local school",
    meetingPlace: "Village school & community hall near the crater rim",
    shortBlurb:
      "A crater-lake collective where Kichwa youth turn legends, tourism stories, and guardianship of the lake into performance.",
    cardImage: IMG_ANDEAN_MASK,

    heroImage: IMG_ANDEAN_MASK,
    gallery: [
      { src: IMG_ANDEAN_MASK, alt: "Andean mask work (placeholder for Quilotoa)" },
      { src: FALLBACK_IMAGE, alt: "Youth rehearsing near Quilotoa crater lake" },
    ],

    description:
      "A crater-lake drama collective in Quilotoa, where Kichwa youth transform local legends, daily life, and the arrival of visitors into original theatrical events.",
    whatHappens:
      "Kichwa youth rehearse in the school and community center, crafting scenes that move between traditional legends, family stories, and the reality of tourism at the crater lake.",
    originStory:
      "Sparked by DAT residencies bringing devised theatre to a small Andean village, the Collective grew from pop-up workshops into a standing group of young storytellers, dancers, and musicians.",
    language: "Kichwa / Spanish",

    culturalExchangeLearn:
      "We learn how youth negotiate tourism—how to welcome visitors without surrendering identity or story.",
    culturalExchangeShare:
      "We share ensemble methods that honor oral tradition while building new work for contemporary audiences.",

    firstYearActive: 2016,
    lastYearActive: "present",
    statusOverride: "ongoing",

    approxYouthServed: 45,
    youthReached: 45,
    showcasesCount: 10,
    communityShowcases: 10,
    approxCommunityAudience: 900,

    communityPartners: [
      { name: "Local Kichwa leadership", logoSrc: SAMPLE_IMAGE },
      { name: "Village cultural committee", logoSrc: SAMPLE_IMAGE },
    ],
    partners: ["Local Kichwa leadership", "Village cultural committee"],
    communityNeeds: [
      "Travel support for youth to attend regional festivals",
      "Simple technical equipment for outdoor performances",
      "Long-term accompaniment to sustain youth leadership",
    ],
    localContext:
      "Quilotoa’s economy relies heavily on tourism. The collective helps young people claim their own narrative amidst bus tours, vendors, and constant outside gaze.",

    leadArtists: ["jesse-baxter"],
    currentProjects: ["Lake Legends cycle", "Tourism & identity scenes", "Village chorus songs"],

    artistPathwaysBlurb:
      "Quilotoa gives artists the chance to build work where landscape, economy, and tradition collide—then translate that complexity into performance.",

    causes: [
      { category: "indigenous-sovereignty-rights", subcategory: "indigenous-cultural-preservation-traditional-knowledge" },
      { category: "indigenous-sovereignty-rights", subcategory: "ancestral-territory-protection" },
      { category: "climate-justice-biodiversity-environmental-protection", subcategory: "island-ecosystem-protection" },
      { category: "arts-culture-storytelling-representation", subcategory: "intergenerational-storytelling" },
    ],

    // Quilotoa crater-lake village anchor
    lat: -0.85922,
    lng: -78.90435,
  },

  /* ============================
     ECUADOR – AMAZON
     ============================ */

  "shuar-story-circle": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "shuar-story-circle",
    name: "Shuar Story Circle",
    country: "Ecuador",
    region: "Amazon",
    city: "Gualaquiza",

    heroTextureTagline: "the Amazon • Shuar Territory",
    location: "Community center & jungle clearing",
    meetingPlace: "Shuar community center beside the jungle clearing",
    shortBlurb:
      "A youth-driven ensemble rooted in Shuar storytelling, environmental guardianship, and the sounds of the Amazon.",
    cardImage: IMG_AMAZON,
    logoSrc: IMG_MASKED,
    logoAlt: "Shuar Drama Club emblem",

    heroImage: IMG_AMAZON,
    gallery: [
      { src: IMG_AMAZON, alt: "Shuar youth performing in a jungle clearing" },
      { src: SAMPLE_IMAGE, alt: "Warm-up circle at the Shuar community center" },
      { src: FALLBACK_IMAGE, alt: "Rehearsal with forest backdrop" },
    ],

    video: {
      url: "https://youtu.be/jhdkvuWrWh4?si=WBNbv-l6Erq4iTs8",
      provider: "youtube",
      title: "Video example (placeholder)",
    },

    description:
      "A youth-driven ensemble rooted in Shuar storytelling, environmental guardianship, and the sounds of the Amazon.",
    whatHappens:
      "On rehearsal days, the community center fills with drums, laughter, and Shuar language. Youth devise scenes that move between ancestral stories, forest protection, and the everyday humor of life in the jungle.",
    originStory:
      "Born from a series of residencies, this club grew out of workshops in a jungle community center and has become a gathering place for young storytellers, dancers, and musicians.",
    language: "Shuar / Spanish",
    localLanguageName: "Ayumpum Jintia Nunink",
    localLanguageLabel: "In Shuar",

    elderQuote: {
      text: "When the youth perform, the forest listens — and so do we.",
      name: "Don Aurelio, community elder",
      avatarSrc: SAMPLE_IMAGE,
    },
    alumniQuote: {
      text: "This club gave me a reason to stay, to study, and to fight for our territory.",
      name: "María",
      role: "Shuar Drama Club alum",
    },

    culturalExchangeLearn:
      "We learn how visiting artists see the forest with new eyes—and how that reframes what we already know.",
    culturalExchangeShare:
      "We share Shuar language, songs, and the responsibilities of being guardians of this land.",

    status: "ongoing",
    statusOverride: "ongoing",
    foundedYear: 2019,
    yearsActive: 4,
    firstYearActive: 2019,
    lastYearActive: "present",

    approxYouthServed: 80,
    youthReached: 80,
    showcasesCount: 12,
    communityShowcases: 12,
    approxCommunityAudience: 1200,

    partners: ["Local Shuar leadership", "Community cultural council"],
    communityPartners: [
      { name: "Local Shuar leadership", logoSrc: SAMPLE_IMAGE },
      { name: "Community cultural council", logoSrc: SAMPLE_IMAGE },
    ],
    communityNeeds: [
      "Consistent transportation for youth from neighboring communities",
      "Stipends for youth facilitators and translators",
      "Funds to document and archive Shuar-language plays and songs",
    ],
    localContext:
      "This club sits in Amazonian territory where outside pressures and economic instability are part of daily life. The club offers a steady, joyful space rooted in culture and collective resistance.",

    leadArtists: ["jesse-baxter"],
    currentProjects: [
      "Forest Guardians play cycle",
      "Story-song circles",
      "Ritual movement pieces for river ceremonies",
    ],

    artistPathwaysBlurb:
      "Here, theatre is inseparable from land. Artists who come to work with this club enter a long conversation about territory, ritual, and responsibility.",

    visitingArtists: [
      { name: "DAT Artist – Alexis", avatarSrc: SAMPLE_IMAGE },
      { name: "Local Artist – Wolframio", avatarSrc: IMG_AMAZON },
    ],
    alumniPathways: [
      { name: "María", role: "Youth leader & facilitator", slug: "maria-shuar-alum" },
      { name: "José", role: "Performer & forest guide", slug: "jose-shuar-alum" },
      { name: "Lucía", role: "Singer & story-keeper", slug: "lucia-shuar-alum" },
    ],

    videoThumbnail: IMG_AMAZON,
    videoTitle: "Shuar Drama Club – Forest Guardians",

    causes: [
      { category: "indigenous-sovereignty-rights", subcategory: "indigenous-cultural-preservation-traditional-knowledge" },
      { category: "indigenous-sovereignty-rights", subcategory: "indigenous-ecological-knowledge" },
      { category: "climate-justice-biodiversity-environmental-protection", subcategory: "rainforest-protection" },
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
    ],
    causeSlugs: [
      "indigenous-cultural-preservation-traditional-knowledge",
      "indigenous-ecological-knowledge",
      "rainforest-protection",
      "community-creative-expression",
    ],

    // Gualaquiza city anchor (Shuar territory work is in/around this area)
    lat: -3.38,
    lng: -78.58,
  },

  "la-selva-lab": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "la-selva-lab",
    name: "La Selva Lab",
    country: "Ecuador",
    region: "Amazon",
    city: "La Selva Jungle Lodge",

    heroTextureTagline: "the Amazon • Napo Riverbanks",
    location: "Community maloca & riverside clearings",
    meetingPlace: "Maloca near the river & open sandbars",
    shortBlurb:
      "A Kichwa-led circle where river stories, animal spirits, and daily life are shaped into theatre.",
    cardImage: IMG_AMAZON,

    heroImage: IMG_AMAZON,
    gallery: [
      { src: IMG_AMAZON, alt: "Amazon teaching moment (placeholder for La Selva area)" },
      { src: FALLBACK_IMAGE, alt: "Kichwa youth sharing stories by the riverside" },
    ],

    description:
      "A Kichwa-led drama circle near La Selva Jungle Lodge where youth transform river stories, animal spirits, and daily life in the rainforest into performance.",
    whatHappens:
      "Youth gather in the maloca and on the riverbank to improvise scenes about fishing, school, family routines, and the animal spirits that guide community life.",
    originStory:
      "Formed after residencies with local Kichwa communities, the circle offered a way for young people to keep gathering and storytelling between visiting artist trips.",
    language: "Kichwa / Spanish",

    culturalExchangeLearn:
      "We learn what the river teaches—rhythm, patience, listening—and how daily life becomes myth when told together.",
    culturalExchangeShare:
      "We share simple ensemble structures that keep story-making alive even when resources are minimal.",

    statusOverride: "legacy",

    communityPartners: [{ name: "Local Kichwa community association", logoSrc: SAMPLE_IMAGE }],
    partners: ["Local Kichwa community association"],
    communityNeeds: [
      "Support for regular local facilitators",
      "Travel funds for youth to attend joint sharings upriver",
      "Basic sound/light support for evening performances",
    ],
    localContext:
      "The circle sits between eco-tourism and traditional livelihoods. Theatre becomes a private community practice—made first for each other, not for strangers.",

    currentProjects: ["River Stories series", "Animal-spirit movement scores"],

    artistPathwaysBlurb:
      "Artists who visit learn to create with the environment as collaborator—humidity, insects, river sound, and night as staging partners.",

    causes: [
      { category: "indigenous-sovereignty-rights", subcategory: "indigenous-cultural-preservation-traditional-knowledge" },
      { category: "climate-justice-biodiversity-environmental-protection", subcategory: "biodiversity-wildlife-protection" },
      { category: "arts-culture-storytelling-representation", subcategory: "intergenerational-storytelling" },
    ],

    // Location is intentionally “La Selva Jungle Lodge” (non-specific). Leave coords undefined until you pick the exact pin.
    lat: undefined,
    lng: undefined,
  },

  /* ============================
     ECUADOR – GALÁPAGOS
     ============================ */

  "floreana-youth-ensemble": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "floreana-youth-ensemble",
    name: "Floreana Youth Ensemble",
    country: "Ecuador",
    region: "Galápagos",
    city: "Floreana Island",

    heroTextureTagline: "Galápagos • Tiny Island Community",
    location: "Local school & harborfront",
    meetingPlace: "Floreana school & harborfront plaza",
    shortBlurb:
      "An island-scale drama lab where nearly every young person becomes part of the story on Floreana.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [
      { src: FALLBACK_IMAGE, alt: "Floreana youth performing near the harbor" },
      { src: FALLBACK_IMAGE, alt: "Drama games in the Floreana schoolyard" },
    ],

    description:
      "An island-scale drama club where nearly every young person becomes part of the story, weaving together local legends, conservation, and daily life on Floreana.",
    whatHappens:
      "Rehearsals happen in the school and spill out onto the harborfront. Kids play sea lions, tourists, fishermen, and the island itself.",
    originStory:
      "What began as a single workshop during a Creative Treks visit grew into a standing drama club, supported by local educators and visiting DAT artists.",
    language: "Spanish",

    culturalExchangeLearn:
      "We learn how a tiny island holds a huge web of relationships—people, animals, policy, and the sea.",
    culturalExchangeShare:
      "We share playful devising methods that let kids make big ecological questions feel personal and immediate.",

    status: "new",
    statusOverride: "new",
    foundedYear: 2023,
    firstYearActive: 2023,
    lastYearActive: "present",

    approxYouthServed: 25,
    youthReached: 25,
    showcasesCount: 3,
    communityShowcases: 3,
    approxCommunityAudience: 300,

    partners: ["Local school on Floreana", "Galápagos-based educators"],
    communityPartners: [
      { name: "Local school on Floreana", logoSrc: SAMPLE_IMAGE },
      { name: "Galápagos-based educators", logoSrc: SAMPLE_IMAGE },
    ],
    currentProjects: ["Sea Stories: Galápagos Myths", "Harbor-front pop-up performances"],
    communityNeeds: [
      "Materials and costumes that can handle sea spray and sun",
      "Occasional travel support for visiting teaching artists",
      "Documentation tools so kids can see their growth over time",
    ],
    localContext:
      "On a small island where everyone knows everyone, the club becomes a shared ritual: nearly every child in the community has stepped onstage at some point.",

    artistPathwaysBlurb:
      "Floreana offers artists a rare chance to build a show with an entire island’s youth population as collaborators.",

    causes: [
      { category: "climate-justice-biodiversity-environmental-protection", subcategory: "island-ecosystem-protection" },
      { category: "climate-justice-biodiversity-environmental-protection", subcategory: "coastal-ocean-conservation" },
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
    ],

    // Floreana Island anchor
    lat: -1.3,
    lng: -90.4333,
  },

  "san-cristobal-collective": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "san-cristobal-collective",
    name: "San Cristóbal Collective",
    country: "Ecuador",
    region: "Galápagos",
    city: "San Cristóbal Island",

    heroTextureTagline: "Galápagos • Harbor & Hills",
    location: "Local school & malecón",
    meetingPlace: "School courtyard overlooking the malecón",
    shortBlurb:
      "A Galápagos youth circle where sea lions, fishermen, and island legends find their way onstage.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [
      { src: FALLBACK_IMAGE, alt: "San Cristóbal students rehearsing by the water" },
    ],

    description:
      "A youth drama circle on San Cristóbal Island where students devise pieces that braid together sea life, fishing culture, and island legends.",
    whatHappens:
      "Youth rehearse with waves in the background, creating scenes that move from classroom to malecón without missing a beat.",
    originStory:
      "First sparked during Creative Treks visits, the circle emerged when local educators invited DAT artists to return and build out a regular devising space for youth.",
    language: "Spanish",

    culturalExchangeLearn:
      "We learn the island’s daily ethics—how conservation policy becomes family decisions, work, and identity.",
    culturalExchangeShare:
      "We share structures for outdoor theatre that can live on a shoreline—portable, flexible, and community-facing.",

    statusOverride: "legacy",

    communityPartners: [{ name: "San Cristóbal school partners", logoSrc: SAMPLE_IMAGE }],
    partners: ["San Cristóbal school partners"],
    communityNeeds: [
      "Sustainable funding for regular facilitators",
      "Cross-island exchanges with other youth theatre groups",
      "Basic gear for outdoor evening sharings",
    ],
    localContext:
      "San Cristóbal sits at the crossroad of conservation policy and lived island life. The circle helps youth voice how big decisions land in their homes.",

    artistPathwaysBlurb:
      "Artists learn how to build theatre in public, in daylight, with weather and waves as the clock.",

    causes: [
      { category: "climate-justice-biodiversity-environmental-protection", subcategory: "coastal-ocean-conservation" },
      { category: "climate-justice-biodiversity-environmental-protection", subcategory: "biodiversity-wildlife-protection" },
      { category: "arts-culture-storytelling-representation", subcategory: "intergenerational-storytelling" },
    ],

    // San Cristóbal Island (Puerto Baquerizo Moreno area)
    lat: -0.9017,
    lng: -89.6167,
  },

  /* ============================
     ECUADOR – PACIFIC COAST
     ============================ */

  "esmeraldas-youth-ensemble": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "esmeraldas-youth-ensemble",
    name: "Esmeraldas Youth Ensemble",
    country: "Ecuador",
    region: "Pacific Coast",
    city: "Esmeraldas",

    heroTextureTagline: "Pacific Coast • Afro-Ecuadorian Port City",
    location: "Community arts center & waterfront courtyards",
    meetingPlace: "Neighborhood arts center near the waterfront",
    shortBlurb:
      "An Afro-Ecuadorian youth ensemble where music, movement, and storytelling meet the Pacific tide.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [
      { src: FALLBACK_IMAGE, alt: "Esmeraldas youth performing in a courtyard" },
    ],

    description:
      "An Afro-Ecuadorian youth ensemble in Esmeraldas where young artists blend music, movement, and storytelling to reflect daily life on the Pacific coast.",
    whatHappens:
      "The ensemble mixes traditional rhythms with devised scenes, turning courtyards into pop-up stages that draw in neighbors and passersby.",
    originStory:
      "Growing out of workshops with local arts leaders, the ensemble formed as a way for young people to respond to their city’s challenges and joys through original performance.",
    language: "Spanish",

    culturalExchangeLearn:
      "We learn how rhythm carries history—and how movement can be both celebration and protest.",
    culturalExchangeShare:
      "We share ensemble-making practices that amplify youth voice while honoring local music and dance vocabularies.",

    statusOverride: "ongoing",

    communityPartners: [{ name: "Esmeraldas community arts center", logoSrc: SAMPLE_IMAGE }],
    partners: ["Esmeraldas community arts center"],
    communityNeeds: [
      "Safe rehearsal spaces amid shifting neighborhood dynamics",
      "Sound equipment that can travel between outdoor sites",
      "Opportunities to tour work to nearby cities",
    ],
    localContext:
      "Esmeraldas faces economic precarity and systemic racism. The ensemble is a joyful counter-space where youth can speak on their own terms.",

    currentProjects: ["Courtyard concerts + scenes", "Movement-and-drum storytelling"],

    artistPathwaysBlurb:
      "Artists learn how to build theatre with music as engine—where story is danced as much as spoken.",

    causes: [
      { category: "social-justice-human-rights-equity", subcategory: "anti-racism" },
      { category: "social-justice-human-rights-equity", subcategory: "poverty-reduction-social-inclusion" },
      { category: "arts-culture-storytelling-representation", subcategory: "representation-in-the-arts" },
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
    ],

    // Esmeraldas city anchor
    lat: 0.9592,
    lng: -79.654,
  },

  /* ============================
     SLOVAKIA – EASTERN
     ============================ */

  "slum-dog-theatre": {
  ...DRAMA_CLUB_TEMPLATE,
  slug: "slum-dog-theatre",
  name: "Slum Dog Theatre",
  country: "Slovakia",
  region: "Eastern Slovakia",
  city: "Moldava nad Bodvou",

  heroTextureTagline: "Eastern Slovakia • Moldava nad Bodvou • Housing Estate Courtyards",
  location: "Housing estate courtyards • partner rehearsal rooms • occasional regional stages",
  meetingPlace: "Estate courtyards & partner studio/community spaces",

  shortBlurb:
    "A Roma-led youth ensemble based in Moldava nad Bodvou—making courtyard-rooted theatre that speaks back with humor, pride, and precision.",

  cardImage: FALLBACK_IMAGE,

  // Keep your current asset for now if that's what you have;
  // swap later when you have Moldava-specific media.
  heroImage: "/images/drama-clubs/kosice/hero.jpg",
  gallery: [{ src: FALLBACK_IMAGE, alt: "Slum Dog Theatre performing in Moldava nad Bodvou" }],

  video: {
    url: "https://youtu.be/jhdkvuWrWh4?si=WBNbv-l6Erq4iTs8",
    provider: "youtube",
    title: "Video example (placeholder)",
  },

  description:
    "A Roma-led youth ensemble based in Moldava nad Bodvou where artists turn everyday life in the housing estate into community-first theatre—built locally, shared locally, and carried outward when invited.",
  whatHappens:
    "Youth gather in courtyards and borrowed rooms, transforming stereotypes, headlines, and lived experience into scenes that reverse the gaze—then sharing the work first with neighbors, elders, and peers.",
  originStory:
    "Developed through DAT’s partnership with ETP Slovensko and long-term work in Eastern Slovakia. As youth leaders grew into confident makers, a core group emerged as Slum Dog Theatre—an ensemble identity for remounts, street pieces, and regional performances.",
  language: "Romani / Slovak",

  culturalExchangeLearn:
    "We learn how stigma shapes a neighborhood’s public life—and how performance can restore dignity and agency in the open air.",
  culturalExchangeShare:
    "We share theatre tools that turn lived experience into craft: ensemble play, structure, rhythm, and testimony without spectacle.",

  status: "legacy",
  statusOverride: "legacy",
  foundedYear: 2015,
  yearsActive: 6,
  firstYearActive: 2015,
  lastYearActive: 2020,

  approxYouthServed: 120,
  youthReached: 120,
  showcasesCount: 20,
  communityShowcases: 20,
  approxCommunityAudience: 2500,

  partners: ["ETP Slovensko"],
  communityPartners: [{ name: "ETP Slovensko", logoSrc: SAMPLE_IMAGE }],
  communityNeeds: [
    "Transportation support so youth can safely gather across neighborhoods",
    "Sustained support for Roma-led teaching artists and mentors",
    "Resources to remount legacy pieces for new generations",
  ],
  localContext:
    "Moldava nad Bodvou has been widely stigmatized—often reduced to conflict narratives. This work helped youth author a different public story: presence, pride, craft, and community leadership.",

  currentProjects: [
    "Remounting legacy courtyard pieces with alumni mentors",
    "A new short-form repertoire built for courtyards and community gatherings",
  ],

  artistPathwaysBlurb:
    "Artists learn to build theatre where trust is everything—starting in the courtyard, not the black box. The ensemble model also creates a path for youth to become mentors, facilitators, and visiting artists.",

  causes: [
    { category: "social-justice-human-rights-equity", subcategory: "anti-racism" },
    { category: "social-justice-human-rights-equity", subcategory: "poverty-reduction-social-inclusion" },
    { category: "education-access-equity-opportunity", subcategory: "reducing-barriers-to-education" },
    { category: "arts-culture-storytelling-representation", subcategory: "narrative-justice" },
  ],

  // ✅ Moldava nad Bodvou anchor
  lat: 48.6169,
  lng: 21.0,
},

  "sunflower-youth-ensemble": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "sunflower-youth-ensemble",
    name: "Sunflower Youth Ensemble",
    country: "Slovakia",
    region: "Eastern Slovakia",
    city: "Sunflower Town",

    heroTextureTagline: "Eastern Slovakia • Nicknamed Estate",
    location: "Housing estate courtyards & classroom spaces",
    meetingPlace: "Courtyard outside the central housing block",
    shortBlurb:
      "A nickname-town club where kids turned the blocks and courtyards of their estate into a stage.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [{ src: FALLBACK_IMAGE, alt: "Sunflower Town youth performing in a courtyard" }],

    description:
      "A drama club in a nicknamed Roma settlement known as “Sunflower Town,” where children used theatre to reinterpret life in the housing estate.",
    whatHappens:
      "Children take familiar stairwells, balconies, and parking lots and transform them into playing spaces for stories about family, friendship, and survival.",
    originStory:
      "Born from repeated street-theatre style workshops, the club slowly formalized as kids kept returning and inviting siblings and neighbors to join.",
    language: "Romani / Slovak",

    culturalExchangeLearn:
      "We learn what children notice first—and how play becomes a form of analysis and care.",
    culturalExchangeShare:
      "We share low-resource theatre formats that can thrive outdoors with almost nothing but bodies and imagination.",

    statusOverride: "legacy",

    communityPartners: [{ name: "Local community center", logoSrc: SAMPLE_IMAGE }],
    partners: ["Local community center"],
    communityNeeds: [
      "Year-round mentorship for teen leaders",
      "Micro-grants for costumes and props",
      "Occasional transport to city-center stages",
    ],
    localContext:
      "Nicknamed for the color of the buildings and the way sun hits the concrete, the settlement rarely appears in positive media. The club offered a new lens.",

    currentProjects: ["Courtyard scenes", "Balcony chorus experiments"],

    artistPathwaysBlurb:
      "Artists learn to make theatre that meets people where they already are—on stairs, sidewalks, balconies, and shared space.",

    causes: [
      { category: "social-justice-human-rights-equity", subcategory: "poverty-reduction-social-inclusion" },
      { category: "education-access-equity-opportunity", subcategory: "reducing-barriers-to-education" },
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
    ],

    // Intentionally non-specific nickname location → leave coords undefined
    lat: undefined,
    lng: undefined,
  },

  "kosice-creative-lab": {
  ...DRAMA_CLUB_TEMPLATE,
  slug: "kosice-creative-lab",
  name: "Košice Creative lab",
  country: "Slovakia",
  region: "Eastern Slovakia",
  city: "Košice",

  heroTextureTagline: "Eastern Slovakia • Košice • Housing Estate Courtyards",
  location: "Košice housing estates • community rooms • city-center sharings when invited",
  meetingPlace: "Estate courtyards & partner community spaces",

  shortBlurb:
    "A Roma-led drama club in Košice where youth artists build voice, belonging, and public presence—telling stories for their own community first.",

  cardImage: FALLBACK_IMAGE,

  heroImage: "/images/drama-clubs/kosice/hero.jpg",
  gallery: [{ src: FALLBACK_IMAGE, alt: "Youth artists performing in Košice" }],

  description:
    "A Roma-led drama club in Košice where young artists reclaim their stories, challenge stereotypes, and practice craft in a room designed for safety, play, and truth.",
  whatHappens:
    "Sessions blend ensemble play, scene-making, and real conversation—turning daily life, memory, and pressure into theatre that can be shared in courtyards, community rooms, and occasionally on formal stages when the community chooses.",
  originStory:
    "Created in partnership with ETP Slovensko after multiple years of residencies. The club became a consistent container for youth leadership and regular sharings rooted in the neighborhood.",
  language: "Romani / Slovak",

  culturalExchangeLearn:
    "We learn what stigma does to a neighborhood—and how story can reverse the gaze with dignity and precision.",
  culturalExchangeShare:
    "We share theatre tools that turn lived experience into crafted performance: structure, rhythm, humor, and ensemble accountability.",

  status: "legacy",
  statusOverride: "legacy",
  foundedYear: 2015,
  yearsActive: 6,
  firstYearActive: 2015,
  lastYearActive: 2020,

  approxYouthServed: 120,
  youthReached: 120,
  showcasesCount: 20,
  communityShowcases: 20,
  approxCommunityAudience: 2500,

  partners: ["ETP Slovensko"],
  communityPartners: [{ name: "ETP Slovensko", logoSrc: SAMPLE_IMAGE }],
  communityNeeds: [
    "Transportation support for youth across multiple neighborhoods/estates",
    "Sustained support for Roma-led teaching artists",
    "Resources to remount legacy pieces for new generations",
  ],
  localContext:
    "Košice includes some of the most stigmatized Roma housing estates in the region. This work helped youth flip the narrative—moving from being spoken about to being heard on their own terms.",

  currentProjects: ["Remounting legacy street pieces", "Youth-led story circles"],

  artistPathwaysBlurb:
    "Artists learn to build theatre where relationship and consent come first—craft in service of community. Youth leadership is not a bonus; it’s the point.",

  causes: [
    { category: "social-justice-human-rights-equity", subcategory: "anti-racism" },
    { category: "social-justice-human-rights-equity", subcategory: "poverty-reduction-social-inclusion" },
    { category: "education-access-equity-opportunity", subcategory: "reducing-barriers-to-education" },
    { category: "arts-culture-storytelling-representation", subcategory: "narrative-justice" },
  ],

  // ✅ Košice city anchor
  lat: 48.7166,
  lng: 21.2611,
},

  "lunik-ix-youth-ensemble": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "lunik-ix-youth-ensemble",
    name: "Luník IX Youth Ensemble",
    country: "Slovakia",
    region: "Eastern Slovakia",
    city: "Košice – Luník IX",

    heroTextureTagline: "Eastern Slovakia • Luník IX Estate",
    location: "Estate courtyards & makeshift rehearsal rooms",
    meetingPlace: "Central courtyard in the Luník IX estate",
    shortBlurb:
      "A club where young people reshaped the stories told about their neighborhood.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [{ src: FALLBACK_IMAGE, alt: "Luník IX youth rehearsing in the estate" }],

    description:
      "A drama club based in the Luník IX housing estate in Košice, where young people used theatre to counter the narratives imposed on their community.",
    whatHappens:
      "Youth build plays out of everyday interactions—arguments, jokes, and small acts of care—then perform them where neighbors can see themselves differently.",
    originStory:
      "Emerging from long-term collaboration with ETP Slovensko, the club began as outdoor workshops and grew into a core group of returning young performers.",
    language: "Romani / Slovak",

    culturalExchangeLearn:
      "We learn how to make theatre under pressure—how to create when the world expects you not to.",
    culturalExchangeShare:
      "We share ensemble-building methods that protect dignity and make space for truthful humor.",

    statusOverride: "legacy",

    communityPartners: [{ name: "ETP Slovensko", logoSrc: SAMPLE_IMAGE }],
    partners: ["ETP Slovensko"],
    communityNeeds: [
      "Reliable indoor rehearsal access for winter months",
      "Support for youth leaders to run sessions independently",
      "Resources to document and preserve stories created by the club",
    ],
    localContext:
      "Luník IX is frequently reduced to a headline. The club builds a counter-archive—stories told by the people who live there.",

    currentProjects: ["Neighborhood story archive", "Courtyard performance routes"],

    artistPathwaysBlurb:
      "Artists learn how to build theatre that is both shield and megaphone—protecting youth while amplifying their voice.",

    causes: [
      { category: "social-justice-human-rights-equity", subcategory: "anti-racism" },
      { category: "social-justice-human-rights-equity", subcategory: "poverty-reduction-social-inclusion" },
      { category: "arts-culture-storytelling-representation", subcategory: "narrative-justice" },
    ],

    // Use Košice city anchor unless/until you set an exact estate pin
    lat: 48.7166,
    lng: 21.2611,
  },

  "camp-etp-slovensko": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "camp-etp-slovensko",
    name: "Camp ETP Slovensko",
    country: "Slovakia",
    region: "Eastern Slovakia",
    city: "Various (camp sites)",

    heroTextureTagline: "Eastern Slovakia • Rotating Camp Sites",
    location: "Seasonal campgrounds & workshop tents",
    meetingPlace: "Temporary campgrounds across eastern Slovakia",
    shortBlurb:
      "A seasonal camp where Roma youth gathered for intensive theatre, art, and community building.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [{ src: FALLBACK_IMAGE, alt: "ETP Slovensko Drama Camp ensemble gathering" }],

    description:
      "A seasonal drama camp run in partnership with ETP Slovensko, bringing Roma youth from multiple settlements together for intensive theatre training and ensemble building.",
    whatHappens:
      "Over several days, youth from multiple communities share meals, rehearsals, and late-night story circles that culminate in large ensemble pieces.",
    originStory:
      "Designed as an extension of ongoing clubs in Košice and surrounding settlements, the camp allowed youth to meet across communities and create large-scale ensemble work.",
    language: "Romani / Slovak",

    culturalExchangeLearn:
      "We learn what changes when youth from different settlements meet as peers—not statistics.",
    culturalExchangeShare:
      "We share intensive training formats that build trust fast and turn it into performance.",

    statusOverride: "ongoing",

    approxYouthServed: 200,
    youthReached: 200,
    showcasesCount: 10,
    communityShowcases: 10,
    approxCommunityAudience: 1500,

    communityPartners: [{ name: "ETP Slovensko", logoSrc: SAMPLE_IMAGE }],
    partners: ["ETP Slovensko"],
    communityNeeds: [
      "Scholarships for youth travel from remote settlements",
      "Camp facility rental and meals",
      "Follow-up mini-grants for youth-led projects post-camp",
    ],
    localContext:
      "The camp became a rare shared space—Roma youth from different villages meeting as collaborators and friends.",

    currentProjects: ["Annual camp cycle", "Post-camp youth micro-projects"],

    artistPathwaysBlurb:
      "Artists learn to lead intensives that prioritize safety, consent, and cohesion—then translate that cohesion into ensemble performance.",

    causes: [
      { category: "social-justice-human-rights-equity", subcategory: "poverty-reduction-social-inclusion" },
      { category: "youth-empowerment-mental-health-wellbeing", subcategory: "youth-leadership" },
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
      { category: "education-access-equity-opportunity", subcategory: "reducing-barriers-to-education" },
    ],

    // Rotating sites → leave coords undefined
    lat: undefined,
    lng: undefined,
  },

  /* ============================
     SLOVAKIA – NORTHERN & WESTERN
     ============================ */

  "stara-lubovna-story-circle": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "stara-lubovna-story-circle",
    name: "Stará Ľubovňa Story Circle",
    country: "Slovakia",
    region: "Northern Slovakia",
    city: "Stará Ľubovňa",

    heroTextureTagline: "Northern Slovakia • Castle Town",
    location: "Community center & school gym",
    meetingPlace: "Community center hall beneath the castle hill",
    shortBlurb:
      "A mixed-community club where Roma and non-Roma youth shared stories across a small northern Slovak town.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [{ src: FALLBACK_IMAGE, alt: "Stará Ľubovňa rehearsal in a school gym" }],

    description:
      "A mixed-community drama club in Stará Ľubovňa where Roma and non-Roma youth created original plays about family, migration, and small-town life.",
    whatHappens:
      "Workshops break down into small ensembles where youth from different backgrounds play side by side, then bring their stories together into one shared piece.",
    originStory:
      "Developed alongside local NGOs and educators, the club provided a neutral creative space for young people who rarely met outside of school.",
    language: "Slovak / Romani",

    culturalExchangeLearn:
      "We learn how small towns hold long histories—and how youth can interrupt inherited divisions.",
    culturalExchangeShare:
      "We share collaboration tools that make shared creation possible across difference.",

    statusOverride: "legacy",

    communityPartners: [{ name: "Local NGOs and educators", logoSrc: SAMPLE_IMAGE }],
    partners: ["Local NGOs and educators"],
    communityNeeds: [
      "Consistent facilitation support across the school year",
      "Resources for public sharings that feel safe for all families",
      "Transportation support for cross-community exchanges",
    ],
    localContext:
      "In a small town, separation can become routine. The club offered a new habit: shared rehearsal, shared laughter, shared stage.",

    currentProjects: ["Story exchange evenings", "Town myths + migration scenes"],

    artistPathwaysBlurb:
      "Artists learn how to facilitate across tension—slowing down, listening hard, and building trust through play.",

    causes: [
      { category: "social-justice-human-rights-equity", subcategory: "anti-racism" },
      { category: "education-access-equity-opportunity", subcategory: "education-equity" },
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
      { category: "youth-empowerment-mental-health-wellbeing", subcategory: "youth-leadership" },
    ],

    lat: 49.3029,
    lng: 20.6866,
  },

  "bratislava-drama-lab": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "bratislava-drama-lab",
    name: "Bratislava Drama Lab",
    country: "Slovakia",
    region: "Western Slovakia",
    city: "Bratislava",

    heroTextureTagline: "Bratislava • Studio Stage & Old Town",
    location: "Divadlo Blanka rehearsal rooms & studio stage",
    meetingPlace: "Divadlo Blanka rehearsal studio",
    shortBlurb:
      "A Bratislava-based youth ensemble connected to Divadlo Blanka’s education and outreach work.",
    cardImage: IMG_NITRA,

    heroImage: IMG_NITRA,
    gallery: [{ src: FALLBACK_IMAGE, alt: "Divadlo Blanka youth on a studio stage" }],

    description:
      "A youth ensemble in Bratislava connected to Divadlo Blanka, where young performers experimented with contemporary theatre techniques and devised work.",
    whatHappens:
      "Youth explore contemporary performance vocabulary—from physical theatre to text collage—on a professional stage.",
    originStory:
      "Developed alongside the theatre’s education team, the ensemble created a bridge between DAT projects and local young artists in the capital.",
    language: "Slovak",

    culturalExchangeLearn:
      "We learn what young artists reach for when given professional tools—how craft accelerates imagination.",
    culturalExchangeShare:
      "We share experimental devising processes that keep the rehearsal room brave and playful.",

    statusOverride: "legacy",

    communityPartners: [{ name: "Divadlo Blanka", logoSrc: IMG_NITRA }],
    partners: ["Divadlo Blanka"],
    communityNeeds: [
      "Scholarships for youth who cannot afford training",
      "Production support for youth-led showings",
      "Exchange opportunities with visiting artists",
    ],
    localContext:
      "In a capital city, access often shapes who gets to experiment. The ensemble focuses on opening professional processes to emerging youth artists.",

    currentProjects: ["Physical theatre labs", "Text collage experiments"],

    artistPathwaysBlurb:
      "Artists learn how to translate high-craft rehearsal techniques into teachable, youth-friendly practice.",

    causes: [
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
      { category: "education-access-equity-opportunity", subcategory: "arts-education-access" },
      { category: "youth-empowerment-mental-health-wellbeing", subcategory: "youth-leadership" },
    ],

    lat: 48.1486,
    lng: 17.1077,
  },

  /* ============================
     CZECHIA – SOUTH MORAVIA
     ============================ */

  "roma-youth-ensemble": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "roma-youth-ensemble",
    name: "Roma Youth Ensemble",
    country: "Czechia",
    region: "South Moravia",
    city: "Brno",

    heroTextureTagline: "Brno • Museum & Courtyard Spaces",
    location: "Roma Museum & partner cultural spaces",
    meetingPlace: "Roma Museum courtyard & workshop rooms",
    shortBlurb:
      "An upcoming ensemble in Brno, rooted in partnership with the Roma Museum and local artists.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [{ src: FALLBACK_IMAGE, alt: "Placeholder for Brno Roma Youth Ensemble" }],

    description:
      "An upcoming Roma youth ensemble in Brno, envisioned as a collaboration between the Roma Museum, local artists, and visiting DAT collaborators.",
    whatHappens:
      "The ensemble works in and around the museum—turning exhibits, family archives, and oral histories into live performance.",
    originStory:
      "Planned as a next step in DAT’s relationship with the Roma Museum in Brno, the ensemble connects museum resources with youth-led theatre making.",
    language: "Czech / Romani",

    culturalExchangeLearn:
      "We learn how archives live—how a museum can become a rehearsal room and memory can become action.",
    culturalExchangeShare:
      "We share approaches for adapting oral history into performance without flattening it.",

    statusOverride: "new",

    communityPartners: [{ name: "Roma Museum in Brno", logoSrc: SAMPLE_IMAGE }],
    partners: ["Roma Museum in Brno"],
    communityNeeds: [
      "Seed funding for the first ensemble season",
      "Support for Roma-led facilitators and youth coordinators",
      "Production resources for public sharings at the museum",
    ],
    localContext:
      "Brno holds powerful Roma history and ongoing discrimination. The ensemble aims to make youth voices visible—inside institutions and in public life.",

    currentProjects: ["Archive-to-stage experiments", "Oral-history scene cycle"],

    artistPathwaysBlurb:
      "Artists learn how to collaborate with institutions without losing the community’s voice—keeping the work youth-led and story-first.",

    causes: [
      { category: "social-justice-human-rights-equity", subcategory: "anti-racism" },
      { category: "education-access-equity-opportunity", subcategory: "reducing-barriers-to-education" },
      { category: "arts-culture-storytelling-representation", subcategory: "arts-cultural-preservation" },
    ],

    lat: 49.1951,
    lng: 16.6068,
  },

  /* ============================
     TANZANIA – MAINLAND
     ============================ */

  "mloka-collective": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "mloka-collective",
    name: "Mloka Collective",
    country: "Tanzania",
    region: "Southern Tanzania",
    city: "Mloka",

    heroTextureTagline: "Southern Tanzania • Village Beside the Park",
    location: "Village meeting spaces & outdoor clearings",
    meetingPlace: "Village meeting tree & open clearings",
    shortBlurb:
      "A village-based group where youth used theatre to talk about school, family, and the forest.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [{ src: FALLBACK_IMAGE, alt: "Mloka youth gathering in a clearing" }],

    description:
      "A village-based youth theatre group in Mloka where young people devised scenes about school, family, and the surrounding forest.",
    whatHappens:
      "Youth rehearse in open clearings, building scenes that weave together humor, village gossip, and questions about conservation.",
    originStory:
      "Formed during early DAT work in Tanzania, the group emerged from school workshops that spilled out into village gathering places after hours.",
    language: "Swahili",

    culturalExchangeLearn:
      "We learn how the forest sits inside daily life—work, danger, beauty, and responsibility all at once.",
    culturalExchangeShare:
      "We share performance formats that work outdoors and invite neighbors into the story naturally.",

    statusOverride: "legacy",

    communityPartners: [{ name: "Village leadership & schools", logoSrc: SAMPLE_IMAGE }],
    partners: ["Village leadership & schools"],
    communityNeeds: [
      "Support for consistent local facilitators",
      "Basic portable props/costumes for outdoor performance",
      "Transport for exchanges with nearby youth groups",
    ],
    localContext:
      "Mloka sits near major conservation landscapes where policy and livelihood collide. Theatre gave youth a place to name what those collisions feel like at home.",

    currentProjects: ["Forest stories", "School-life comedy scenes"],

    artistPathwaysBlurb:
      "Artists learn to build theatre from the ground up—no tech, no stage, just ensemble and story.",

    causes: [
      { category: "community-wellbeing-safety-resilience", subcategory: "local-leadership-capacity-building" },
      { category: "climate-justice-biodiversity-environmental-protection", subcategory: "rainforest-protection" },
      { category: "education-access-equity-opportunity", subcategory: "literacy-learning-access" },
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
    ],

    // Mloka village (verified settlement coordinates)
    lat: -7.77563,
    lng: 38.24175,
  },

  "moshi-story-circle": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "moshi-story-circle",
    name: "Moshi Story Circle",
    country: "Tanzania",
    region: "Kilimanjaro",
    city: "Moshi",

    heroTextureTagline: "Kilimanjaro • Base-of-the-Mountain Town",
    location: "School classrooms & courtyard stages",
    meetingPlace: "School courtyard beneath views of Kilimanjaro",
    shortBlurb:
      "A Kilimanjaro-side circle where youth experimented with storytelling at the base of the mountain.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [{ src: FALLBACK_IMAGE, alt: "Moshi youth circle in a school courtyard" }],

    description:
      "A youth drama circle in Moshi where students explored storytelling, movement, and song at the base of Kilimanjaro.",
    whatHappens:
      "Students rehearse after school, turning lessons and local legends into short pieces that can be shared in the courtyard.",
    originStory:
      "Launched through partnerships with local schools, the circle gave students a chance to keep creating between visiting artist residencies.",
    language: "Swahili",

    culturalExchangeLearn:
      "We learn how youth carry ambition and duty at once—school, family, and future pulling in every direction.",
    culturalExchangeShare:
      "We share ensemble warm-ups and devising tools that work in tight time windows after school.",

    statusOverride: "legacy",

    communityPartners: [{ name: "Local Moshi schools", logoSrc: SAMPLE_IMAGE }],
    partners: ["Local Moshi schools"],
    communityNeeds: [
      "Support for ongoing teaching artists",
      "Basic performance materials and notebooks",
      "Opportunities for youth to share work beyond the school yard",
    ],
    localContext:
      "Moshi is a crossroads town—tourism, trade, education, and mountain life all intersecting. The circle helps youth name who they are inside that movement.",

    currentProjects: ["Mountain stories", "Schoolyard sharings"],

    artistPathwaysBlurb:
      "Artists learn to build repeatable club structures—simple enough to sustain, strong enough to grow.",

    causes: [
      { category: "education-access-equity-opportunity", subcategory: "arts-education-access" },
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
    ],

    lat: -3.3349,
    lng: 37.3403,
  },

  "light-in-africa-story-laboratory": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "light-in-africa-story-laboratory",
    name: "Light-in-Africa Story Laboratory",
    country: "Tanzania",
    region: "Kilimanjaro",
    city: "Moshi Region",

    heroTextureTagline: "Kilimanjaro • Children’s Homes & Hills",
    location: "Light in Africa homes & play spaces",
    meetingPlace: "Shared play yard at Light in Africa",
    shortBlurb:
      "A drama club where children in care used play and performance to process their stories and imagine new futures.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [{ src: FALLBACK_IMAGE, alt: "Drama games at Light in Africa (placeholder)" }],

    description:
      "A drama club based at Mama Lynn's Light in Africa, where children in care used play and performance to process their stories and imagine new futures.",
    whatHappens:
      "Children build ensemble games and small scenes that allow them to try on different futures in a safe, playful environment.",
    originStory:
      "Started during DAT’s early work in Tanzania, the club arose from informal games and workshops that became a regular creative outlet for the kids.",
    language: "Swahili",

    culturalExchangeLearn:
      "We learn how safety is built—through routine, gentleness, and permission to play.",
    culturalExchangeShare:
      "We share trauma-aware creative structures that let kids choose how visible they want to be.",

    statusOverride: "legacy",

    communityPartners: [{ name: "Light in Africa", logoSrc: SAMPLE_IMAGE }],
    partners: ["Light in Africa"],
    communityNeeds: [
      "Support for consistent arts programming",
      "Supplies for play, costume, and storytelling",
      "Training for caregivers in creative facilitation",
    ],
    localContext:
      "For children in care, consistency matters. The club focused on building a reliable creative rhythm—play as healing, ensemble as belonging.",

    currentProjects: ["Story games repertoire", "Small scene sharings"],

    artistPathwaysBlurb:
      "Artists learn to make theatre with care at the center—prioritizing consent, gentleness, and joy.",

    causes: [
      { category: "youth-empowerment-mental-health-wellbeing", subcategory: "youth-in-care-displacement-support" },
      { category: "youth-empowerment-mental-health-wellbeing", subcategory: "trauma-informed-spaces" },
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
    ],

    // Use Moshi anchor until you want a more specific pin
    lat: -3.3349,
    lng: 37.3403,
  },

  "bagamoyo-young-company": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "bagamoyo-young-company",
    name: "Bagamoyo Young Company",
    country: "Tanzania",
    region: "Coastal Tanzania",
    city: "Bagamoyo",

    heroTextureTagline: "Coastal Tanzania • Historic Port",
    location: "Arts college studios & beachside spaces",
    meetingPlace: "Arts college courtyard & nearby beach",
    shortBlurb:
      "A coastal collective mixing traditional forms with devised theatre in Bagamoyo.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [{ src: FALLBACK_IMAGE, alt: "Bagamoyo collective near the coast (placeholder)" }],

    description:
      "A coastal drama collective in Bagamoyo where young artists mixed traditional performance forms with devised theatre and movement.",
    whatHappens:
      "Rehearsals alternate between college studios and beachside spaces, folding the sound of waves into movement and song.",
    originStory:
      "Built in conversation with local arts institutions, the collective offered a shared space for DAT artists and Bagamoyo performers to exchange practices.",
    language: "Swahili",

    culturalExchangeLearn:
      "We learn how coastal history lives in the body—gesture, rhythm, and memory carried through performance.",
    culturalExchangeShare:
      "We share devising approaches that let traditional forms and new text coexist without hierarchy.",

    statusOverride: "legacy",

    communityPartners: [{ name: "Local arts college", logoSrc: SAMPLE_IMAGE }],
    partners: ["Local arts college"],
    communityNeeds: [
      "Support for youth scholarships into arts training",
      "Documentation resources for movement-based work",
      "Exchange opportunities with other coastal ensembles",
    ],
    localContext:
      "Bagamoyo’s layered history and artistic culture make it a natural home for exchange—where forms evolve through encounter, not replacement.",

    currentProjects: ["Beachside movement studies", "Song + scene hybrids"],

    artistPathwaysBlurb:
      "Artists learn how to build theatre from form—letting song and movement lead the narrative.",

    causes: [
      { category: "arts-culture-storytelling-representation", subcategory: "arts-heritage-traditional-knowledge" },
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
      { category: "climate-justice-biodiversity-environmental-protection", subcategory: "coastal-ocean-conservation" },
    ],

    lat: -6.432933,
    lng: 38.903804,
  },

  "dar-collective": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "dar-collective",
    name: "Dar Collective",
    country: "Tanzania",
    region: "Coastal Tanzania",
    city: "Dar es Salaam",

    heroTextureTagline: "Dar es Salaam • Coastal City Lab",
    location: "Urban arts centers & community halls",
    meetingPlace: "Partner arts center in central Dar es Salaam",
    shortBlurb:
      "An urban lab where young performers tested bold new work in a busy coastal city.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [{ src: FALLBACK_IMAGE, alt: "Dar es Salaam lab sharing work-in-progress (placeholder)" }],

    description:
      "An urban drama lab in Dar es Salaam where young performers experimented with bold new work in a rapidly changing coastal city.",
    whatHappens:
      "Youth test brave, contemporary pieces in front of audiences unused to seeing young people claiming the stage.",
    originStory:
      "Developed through partnerships with local arts organizations, the lab hosted short intensive residencies led by DAT artists and Tanzanian collaborators.",
    language: "Swahili",

    culturalExchangeLearn:
      "We learn how speed changes culture—how a city’s growth shows up in youth identity and voice.",
    culturalExchangeShare:
      "We share rehearsal structures for creating quickly without losing depth.",

    statusOverride: "legacy",

    communityPartners: [{ name: "Dar es Salaam arts organizations", logoSrc: SAMPLE_IMAGE }],
    partners: ["Dar es Salaam arts organizations"],
    communityNeeds: [
      "Stable rehearsal access for youth groups",
      "Support for public sharings and audience building",
      "Resources for youth-led writing and directing",
    ],
    localContext:
      "Dar is movement—people, commerce, music, language. The lab helped youth capture that movement onstage in their own terms.",

    currentProjects: ["City-change monologues", "Street-to-stage improvisations"],

    artistPathwaysBlurb:
      "Artists learn how to run focused residencies that leave behind replicable tools and leadership pathways.",

    causes: [
      { category: "community-wellbeing-safety-resilience", subcategory: "local-leadership-capacity-building" },
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
      { category: "education-access-equity-opportunity", subcategory: "arts-education-access" },
    ],

    lat: -6.7923,
    lng: 39.2083,
  },

  /* ============================
     TANZANIA – ZANZIBAR
     ============================ */

  "stone-town-youth-ensemble": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "stone-town-youth-ensemble",
    name: "Stone Town Youth Ensemble",
    country: "Tanzania",
    region: "Zanzibar",
    city: "Stone Town",

    heroTextureTagline: "Zanzibar • Stone Town Alleys & Rooftops",
    location: "Old town courtyards & cultural centers",
    meetingPlace: "Shared courtyard inside Stone Town’s historic quarter",
    shortBlurb:
      "A youth theatre where narrow alleys, markets, and sea breezes turned into scenes.",
    cardImage: IMG_ZANZIBAR,

    heroImage: IMG_ZANZIBAR,
    gallery: [{ src: IMG_ZANZIBAR, alt: "Stone Town youth performing in an old courtyard" }],

    description:
      "A youth theatre initiative in Stone Town, Zanzibar, where young performers devised work drawn from the alleys, markets, and tides of the old city.",
    whatHappens:
      "Youth traverse courtyards and rooftop terraces, transforming Stone Town into intersecting performance routes.",
    originStory:
      "Created during DAT’s Zanzibar work, the group gathered youth from different neighborhoods to explore shared stories through performance.",
    language: "Swahili",

    culturalExchangeLearn:
      "We learn how history is architectural—how doors, corridors, and courtyards hold memory.",
    culturalExchangeShare:
      "We share promenade and route-based staging methods that let a whole neighborhood become a set.",

    statusOverride: "legacy",

    communityPartners: [{ name: "Stone Town cultural centers", logoSrc: SAMPLE_IMAGE }],
    partners: ["Stone Town cultural centers"],
    communityNeeds: [
      "Stable youth rehearsal access inside the old city",
      "Support for performances that can move through public space safely",
      "Documentation resources for site-based work",
    ],
    localContext:
      "Stone Town is a living labyrinth—tourism, local life, and heritage layered together. The work taught youth to reclaim the maze as their stage.",

    currentProjects: ["Alleyway scene routes", "Market chorus experiments"],

    artistPathwaysBlurb:
      "Artists learn site-based creation in dense urban heritage space—precision, adaptation, and consent are everything.",

    causes: [
      { category: "community-wellbeing-safety-resilience", subcategory: "local-leadership-capacity-building" },
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
      { category: "climate-justice-biodiversity-environmental-protection", subcategory: "coastal-ocean-conservation" },
    ],

    lat: -6.165,
    lng: 39.199,
  },

  "matemwe-young-company": {
  ...DRAMA_CLUB_TEMPLATE,
  slug: "matemwe-young-company",
  name: "Matemwe Young Company",
  country: "Tanzania",
  region: "Zanzibar",
  city: "Matemwe",

  heroTextureTagline: "Zanzibar • Matemwe • Reef Coastline",
  location: "Village school yard • palm-shaded clearings • shoreline paths",
  meetingPlace: "School yard and nearby sandy clearings (a short walk from the water)",

  shortBlurb:
    "A coastal village drama club where kids made theatre in the rhythm of reef tides—between school, sand, and the everyday life of Matemwe.",

  cardImage: FALLBACK_IMAGE,

  heroImage: FALLBACK_IMAGE,
  gallery: [
    { src: FALLBACK_IMAGE, alt: "Drama games with youth in Matemwe (placeholder)" },
  ],

  description:
    "A village drama club in Matemwe, Zanzibar where children created theatre between the classroom, the reef shoreline, and the daily work of village life—turning observation into scenes, songs, and playful public sharings.",
  whatHappens:
    "Rehearsals begin with games and storytelling circles, then spill outdoors—bare feet in sand, palm shade overhead, the ocean always nearby. Kids devise short pieces about family life, school, reef fishing, weather, and local myths—building voice, confidence, and ensemble trust.",
  originStory:
    "Born from school-based workshops that naturally expanded into outdoor playmaking, the club became a recurring gathering for kids who wanted to keep making stories together—with families and neighbors invited in for informal sharings.",
  language: "Swahili",

  culturalExchangeLearn:
    "We learn how reef-coast life shapes imagination—tide cycles, weather, boats, and the collective rhythm of a village that lives with the sea.",
  culturalExchangeShare:
    "We share portable devising formats designed for outdoors—story structures that can travel across school yard, sand, and shoreline without needing a theatre building.",

  statusOverride: "legacy",

  communityPartners: [
    { name: "Matemwe village school & parent committees", logoSrc: SAMPLE_IMAGE },
  ],
  partners: ["Matemwe village school & parent committees"],

  communityNeeds: [
    "Durable costumes/props and basic supplies that can handle heat, sand, and salt air",
    "Support for consistent local facilitation and youth leadership roles",
    "Resources for community sharings that include families and elders",
  ],

  localContext:
    "In Matemwe, school, work, and ocean are intertwined. The club gave kids a creative container to reflect that reality back to their community—joyfully, honestly, and in their own voice.",

  currentProjects: ["Reef & tide stories", "Village-life scenes", "Boat and market skits"],

  artistPathwaysBlurb:
    "Artists learn ultra-portable theatre-making—craft that’s light enough for a backpack, strong enough for a school yard, and alive enough to hold a whole community’s attention.",

  causes: [
    {
      category: "climate-justice-biodiversity-environmental-protection",
      subcategory: "coastal-ocean-conservation",
    },
    {
      category: "education-access-equity-opportunity",
      subcategory: "literacy-learning-access",
    },
    {
      category: "arts-culture-storytelling-representation",
      subcategory: "community-creative-expression",
    },
  ],

  // Matemwe, Zanzibar (approx)
  lat: -5.872,
  lng: 39.355,
},


  /* ============================
     ZIMBABWE – SOUTHERN AFRICA
     ============================ */

  "bulawayo-young-company": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "bulawayo-young-company",
    name: "Bulawayo Young Company",
    country: "Zimbabwe",
    region: "Southern Africa",
    city: "Bulawayo",

    heroTextureTagline: "Southern Africa • Bulawayo Streets & Stages",
    location: "Amakhosi Theatre Company",
    meetingPlace: "Amakhosi Theatre rehearsal spaces",
    shortBlurb:
      "A young company born out of early DAT work in Zimbabwe, nurtured in partnership with Amakhosi Theatre.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [{ src: FALLBACK_IMAGE, alt: "Bulawayo Young Company working with Amakhosi Theatre" }],

    description:
      "An early DAT-affiliated youth company at Amakhosi Theatre in Bulawayo, where young performers explored street theatre, community storytelling, and ensemble training.",
    whatHappens:
      "Youth trained under professional mentors, taking devised work into streets and community venues around Bulawayo.",
    originStory:
      "Launched during DAT’s founding years in Zimbabwe in collaboration with Amakhosi Theatre Company, the Young Company provided a training ground for emerging performers and local leaders.",
    language: "English / Ndebele",

    culturalExchangeLearn:
      "We learn how political reality shapes art-making—and how theatre becomes both survival and celebration.",
    culturalExchangeShare:
      "We share ensemble-training methods that strengthen voice, body, and collective storytelling.",

    status: "legacy",
    statusOverride: "legacy",
    foundedYear: 2007,
    yearsActive: 1,
    firstYearActive: 2007,
    lastYearActive: 2008,

    approxYouthServed: 20,
    youthReached: 20,
    showcasesCount: 1,
    communityShowcases: 1,
    approxCommunityAudience: 200,

    partners: ["Amakhosi Theatre Company"],
    communityPartners: [{ name: "Amakhosi Theatre Company", logoSrc: SAMPLE_IMAGE }],
    communityNeeds: [
      "Resources to preserve and remount early work",
      "Support for youth leadership pathways into the arts",
      "Exchange opportunities with other youth companies",
    ],
    localContext:
      "Bulawayo’s theatre culture has long been a site of resilience. This early work helped establish DAT’s ethos: story as relationship, ensemble as community.",

    currentProjects: ["Legacy archive recovery (future)", "Alumni reconnection (future)"],

    artistPathwaysBlurb:
      "Artists learn classic ensemble-building and street-theatre practice rooted in community presence.",

    causes: [
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
      { category: "community-wellbeing-safety-resilience", subcategory: "local-leadership-capacity-building" },
      { category: "youth-empowerment-mental-health-wellbeing", subcategory: "youth-leadership" },
    ],

    lat: -20.17,
    lng: 28.58,
  },

  "matopos-youth-drama-camp": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "matopos-youth-drama-camp",
    name: "Matopos Youth Drama Camp",
    country: "Zimbabwe",
    region: "Southern Africa",
    city: "Matopos",

    heroTextureTagline: "Southern Africa • Matopos Hills Retreat",
    location: "Retreat center near the Matopos hills",
    meetingPlace: "Retreat center grounds near Matopos hills",
    shortBlurb:
      "A short-term youth camp where teens explored story, ritual, and the Matopos landscape through theatre.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [{ src: FALLBACK_IMAGE, alt: "Matopos youth camp gathering outdoors (placeholder)" }],

    description:
      "A short-term youth drama camp near the Matopos hills where Zimbabwean teens explored story, ritual, and the surrounding landscape through theatre and movement.",
    whatHappens:
      "Days were spent in rehearsal and exploration; evenings in ritual-like sharings under the sky.",
    originStory:
      "Organized during DAT’s foundational years, the camp brought together youth from Bulawayo and nearby communities for intensive ensemble-building and performance in the Matopos area.",
    language: "English / Ndebele",

    culturalExchangeLearn:
      "We learn how landscape changes story—how stone, sky, and silence shape performance.",
    culturalExchangeShare:
      "We share ritual-inflected theatre forms that honor place and collective presence.",

    statusOverride: "legacy",

    communityPartners: [{ name: "Retreat center near Matopos hills", logoSrc: SAMPLE_IMAGE }],
    partners: ["Retreat center near Matopos hills"],
    communityNeeds: [
      "Resources to document legacy work and methods",
      "Support for future youth camps in the region",
      "Travel support for youth participation from multiple communities",
    ],
    localContext:
      "Matopos holds deep spiritual and ecological significance. The camp used the landscape as collaborator, letting place become teacher.",

    currentProjects: ["Legacy documentation (future)", "Ritual movement studies"],

    artistPathwaysBlurb:
      "Artists learn how to lead intensive, place-based creation where environment is part of the dramaturgy.",

    causes: [
      { category: "climate-justice-biodiversity-environmental-protection", subcategory: "biodiversity-wildlife-protection" },
      { category: "climate-justice-biodiversity-environmental-protection", subcategory: "disaster-resilience" },
      { category: "youth-empowerment-mental-health-wellbeing", subcategory: "youth-leadership" },
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
    ],

    // Matopos Hills anchor
    lat: -20.505533,
    lng: 28.441536,
  },

  "wanezi-youth-ensemble": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "wanezi-youth-ensemble",
    name: "Wanezi Youth Ensemble",
    country: "Zimbabwe",
    region: "Southern Africa",
    city: "Wanezi",

    heroTextureTagline: "Southern Africa • Wanezi",
    location: "Mission-area school grounds & community gathering spaces",
    meetingPlace: "School hall + outdoor yard (community sharings)",
    shortBlurb:
      "A mission-area youth ensemble rooted in community storytelling, music, and the everyday grit and humor of rural life.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [
      { src: FALLBACK_IMAGE, alt: "Wanezi Youth Ensemble (placeholder)" },
      { src: FALLBACK_IMAGE, alt: "Community sharing space in Wanezi (placeholder)" },
    ],

    description:
      "A youth ensemble in Wanezi where young artists build original work from daily life, local memory, and the stories that hold a community together.",
    whatHappens:
      "Youth gather after school and on weekends to devise scenes, songs, and movement pieces—then share them back with families and neighbors in informal, community-facing performances.",
    originStory:
      "Built through relationship and return visits, this ensemble grew from workshops into an ongoing creative home for young storytellers.",
    language: "English / Ndebele",

    culturalExchangeLearn:
      "We learn how rural communities hold resilience—how humor, music, and story carry people through hard seasons.",
    culturalExchangeShare:
      "We share ensemble tools that help young artists shape lived experience into performance—simple enough to sustain, strong enough to travel.",

    statusOverride: "legacy",

    partners: ["Local school partners", "Community leadership (Wanezi)"],
    communityPartners: [
      { name: "Local school partners", logoSrc: SAMPLE_IMAGE },
      { name: "Community leadership (Wanezi)", logoSrc: SAMPLE_IMAGE },
    ],
    communityNeeds: [
      "Support for consistent local facilitation",
      "Transportation for youth from surrounding areas",
      "Basic production resources for sharings + documentation",
    ],
    localContext:
      "Wanezi is rural and relationship-driven—consistency matters. The ensemble serves as a steady gathering point where youth can practice leadership, voice, and craft.",

    leadArtists: ["jesse-baxter"],
    currentProjects: [
      "Community-story scene cycle (songs + scenes)",
      "Short-form sharings for school/community events",
    ],

    artistPathwaysBlurb:
      "Wanezi trains artists in presence: building theatre with minimal resources, deep listening, and real community accountability.",

    videoThumbnail: FALLBACK_IMAGE,
    videoTitle: "Wanezi Youth Ensemble – (Video Title TBD)",

    causes: [
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
      { category: "youth-empowerment-mental-health-wellbeing", subcategory: "youth-leadership" },
      { category: "education-access-equity-opportunity", subcategory: "arts-education-access" },
      { category: "community-wellbeing-safety-resilience", subcategory: "local-leadership-capacity-building" },
    ],

    // Set coords later when you choose the exact pin
    lat: undefined,
    lng: undefined,
  },

  "harare-youth-ensemble": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "harare-youth-ensemble",
    name: "Harare Youth Ensemble",
    country: "Zimbabwe",
    region: "Southern Africa",
    city: "Harare",

    heroTextureTagline: "Harare • Capital City Stages",
    location: "City arts centers & school halls",
    meetingPlace: "Central arts center in Harare",
    shortBlurb:
      "A youth ensemble where students devised scenes about city life, family, and a changing Zimbabwe.",
    cardImage: FALLBACK_IMAGE,

    heroImage: FALLBACK_IMAGE,
    gallery: [{ src: FALLBACK_IMAGE, alt: "Harare youth ensemble in a school hall (placeholder)" }],

    description:
      "A youth ensemble in Harare where students devised scenes about city life, family, and a changing Zimbabwe, blending text, music, and movement.",
    whatHappens:
      "Youth explored how politics, economics, and everyday choices collide in a changing capital city.",
    originStory:
      "Developed through workshops with local schools and arts partners in Harare, the ensemble offered an early urban counterpoint to DAT’s work in Bulawayo and Matopos.",
    language: "English / Shona",

    culturalExchangeLearn:
      "We learn how youth tell truth in coded ways—humor, metaphor, music—when directness is risky.",
    culturalExchangeShare:
      "We share devising tools that protect voice while making the work legible to an audience.",

    statusOverride: "legacy",

    communityPartners: [{ name: "Harare arts partners & schools", logoSrc: SAMPLE_IMAGE }],
    partners: ["Harare arts partners & schools"],
    communityNeeds: [
      "Resources for youth-led writing and directing",
      "Support for public sharings and audience building",
      "Documentation support for legacy work",
    ],
    localContext:
      "Harare is a city of sharp contrast—aspiration and constraint living side by side. The ensemble helped youth stage that reality with clarity and style.",

    currentProjects: ["City-life scenes", "Music + movement hybrids"],

    artistPathwaysBlurb:
      "Artists learn how to build work fast in school contexts while keeping the theatre bold.",

    causes: [
      { category: "education-access-equity-opportunity", subcategory: "school-retention-success" },
      { category: "education-access-equity-opportunity", subcategory: "arts-education-access" },
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
      { category: "youth-empowerment-mental-health-wellbeing", subcategory: "youth-leadership" },
    ],

    lat: -17.863889,
    lng: 31.029722,
  },

  /* ============================
     UNITED STATES – NYC (UPCOMING)
     ============================ */

  "nyc-drama-lab": {
    ...DRAMA_CLUB_TEMPLATE,
    slug: "nyc-drama-lab",
    name: "NYC Drama Lab",
    country: "United States",
    region: "New York",
    city: "New York City",

    heroTextureTagline: "New York City • Rehearsal Rooms & Rooftops",
    location: "Rehearsal studios & pop-up classrooms",
    meetingPlace: "Partner rehearsal studios across Manhattan & Queens",
    shortBlurb:
      "An upcoming NYC-based lab where DAT artists and alumni will test new work between international journeys.",
    cardImage: SAMPLE_IMAGE,

    heroImage: SAMPLE_IMAGE,
    gallery: [{ src: SAMPLE_IMAGE, alt: "Placeholder for DAT NYC Drama Lab studio work" }],

    description:
      "An upcoming NYC-based drama lab designed as a home-base hub for DAT artists, alumni, and local youth to develop new work between international journeys.",
    whatHappens:
      "Once active, the lab will host readings, workshops, and devising intensives that connect directly to DAT’s international hubs.",
    originStory:
      "Imagined as part of DAT’s return to New York, the lab offers a consistent space for process, training, and new plays rooted in global collaboration.",
    language: "English / Spanish (visiting artists)",

    culturalExchangeLearn:
      "We learn what happens when global work lands at home—how to translate, not dilute, what was built abroad.",
    culturalExchangeShare:
      "We share a home-base rehearsal culture that stays porous to the world: artists come in, learn, and carry it forward.",

    statusOverride: "new",

    communityPartners: [{ name: "NYC rehearsal studios & community partners", logoSrc: SAMPLE_IMAGE }],
    partners: ["NYC rehearsal studios & community partners"],
    communityNeeds: [
      "Seed funding to secure consistent rehearsal space",
      "Support for scholarships so local youth can participate",
      "Resources to host visiting artists from Ecuador, Slovakia, and beyond",
    ],
    localContext:
      "New York City is both DAT’s origin point and future home base. The lab will sit at the crossroads of global and local storytelling.",

    artistPathwaysBlurb:
      "The NYC Drama Lab is where global ideas land, get sharpened, and then travel back out through CASTAWAY, RAW, and ACTion.",

    visitingArtists: [
      { name: "DAT Alumni Artist 1", avatarSrc: SAMPLE_IMAGE },
      { name: "DAT Alumni Artist 2", avatarSrc: SAMPLE_IMAGE },
    ],
    alumniPathways: [{ name: "DAT Alum – Alexis", role: "Performer & teaching artist", slug: "alexis-floyd" }],

    causes: [
      { category: "arts-culture-storytelling-representation", subcategory: "community-creative-expression" },
      { category: "education-access-equity-opportunity", subcategory: "arts-education-access" },
      { category: "youth-empowerment-mental-health-wellbeing", subcategory: "youth-leadership" },
      { category: "education-access-equity-opportunity", subcategory: "global-learning-cultural-literacy" },
    ],

    // NYC city anchor
    lat: 40.7128,
    lng: -74.006,
  },
};

export const dramaClubs: DramaClub[] = Object.values(dramaClubMap);

// (Optional) If you want this constant accessible site-wide:
export const DRAMA_CLUB_LEAD_TEAM_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vQzkIPStlL2TU7AHySD3Kw9CqBFTi1q6QW7N99ivE3FpofNhHlwWejU0LXeMOmnTawtmLCT71KWMU-F/pub?gid=2095520301&single=true&output=csv";

/**
 * ✅ Full “everything” template: includes every possible DramaClub field.
 * - Required fields are present as empty strings so it type-checks.
 * - Optional scalars are `undefined`.
 * - Optional arrays are `[]` so the key exists but is empty.
 *
 * Use `createDramaClubTemplateFull()` when you want a fresh copy you can safely edit.
 */
export const DRAMA_CLUB_TEMPLATE_FULL = {
  // ========================
  // Identity
  // ========================
  slug: "",
  name: "",

  // Geography / region
  country: "",
  region: undefined,
  city: undefined,

  heroTextureTagline: undefined,
  heroTextureSrc: undefined,
  regionTextureSrc: undefined,

  // Display helpers
  location: undefined,
  shortBlurb: undefined,
  cardImage: undefined,

  // Branding
  logoSrc: undefined,
  logoAlt: undefined,

  // ========================
  // Images / Media
  // ========================
  heroImage: undefined,
  gallery: [],

  video: undefined as EmbeddableVideo | undefined,

  videoThumbnail: undefined,
  videoTitle: undefined,

  // ========================
  // Narrative / Story
  // ========================
  description: "",

  whatHappens: undefined,
  originStory: undefined,

  language: undefined as string | string[] | undefined,
  workingLanguages: undefined as DramaClubWorkingLanguages | undefined,

  ageRange: undefined,
  whoWeServe: undefined,
  localLanguageName: undefined,
  localLanguageLabel: undefined,

  coreFocus: undefined,
  localChallenge: undefined,

  roomFeelsLike: undefined,
  roomFeelsLikeOverride: undefined,

  elderQuote: undefined as
    | {
        text: string;
        name?: string;
        role?: string;
        avatarSrc?: string;
      }
    | undefined,

  alumniQuote: undefined as
    | {
        text: string;
        name?: string;
        role?: string;
      }
    | undefined,

  culturalExchangeLearn: undefined,
  culturalExchangeShare: undefined,

  // ========================
  // Status & activity timeline
  // ========================
  status: undefined as DramaClubStatus | undefined,

  foundedYear: undefined,
  yearsActive: undefined,

  firstYearActive: undefined,
  lastYearActive: undefined as number | "present" | undefined,
  statusOverride: undefined as DramaClubStatus | undefined,

  // ========================
  // Impact / activity
  // ========================
  youthArtistsServed: undefined,
  approxYouthServed: undefined,
  youthReached: undefined,

  showcasesCount: undefined,
  communityShowcases: undefined,
  approxCommunityAudience: undefined,

  currentImpactStats: [] as DramaClubImpactStat[],
  sponsorshipUnlockStats: [] as DramaClubImpactStat[],

  currentWeeksPerYear: undefined,
  targetWeeksPerYear: undefined,
  currentLocalFacilitators: undefined,
  targetLocalFacilitators: undefined,

  // ========================
  // Community / relationships
  // ========================
  meetingPlace: undefined,
  communityAnchor: undefined,
  leadPartner: undefined,

  partners: [] as string[],

  communityPartners: [] as NonNullable<DramaClub["communityPartners"]>,

  communityNeeds: [] as string[],
  localContext: undefined,

  leadArtist: undefined as PersonRef | undefined,
  leadArtists: [] as string[],

  currentProjects: [] as string[],

  // ========================
  // Artist / AIR pathways
  // ========================
  artistPathwaysBlurb: undefined,
  visitingArtists: [] as PersonRef[],

  // ========================
  // Causes / focus areas
  // ========================
  causes: [] as DramaClubCause[],
  primaryCause: undefined as DramaClubCause | undefined,
  primaryCauseSlug: undefined,
  causeSlugs: [] as string[],

  // ========================
  // Map + cross-links
  // ========================
  lat: undefined,
  lng: undefined,
  storyMapHref: undefined,

  relatedProgramSlugs: [] as string[],
} satisfies DramaClubDraft;

/**
 * ✅ Preferred: returns a fresh, editable copy (so you never accidentally mutate the exported constant).
 */
export function createDramaClubTemplateFull(): DramaClubDraft {
  return {
    ...DRAMA_CLUB_TEMPLATE_FULL,
    // ensure fresh arrays too
    gallery: [],
    partners: [],
    communityPartners: [],
    communityNeeds: [],
    leadArtists: [],
    currentProjects: [],
    visitingArtists: [],
    causes: [],
    causeSlugs: [],
    currentImpactStats: [],
    sponsorshipUnlockStats: [],
    relatedProgramSlugs: [],
  };
}
