// lib/dramaClubMap.ts

import type { DramaClubCause } from "@/lib/causes";

export type DramaClubStatus = "ongoing" | "new" | "legacy";

export type PersonRef = {
  name: string;
  href?: string; // optional custom URL; otherwise auto /alumni/[slugified-name]
  avatarSrc?: string;
};

/**
 * Working language model (preferred).
 *
 * ✅ Distinguishes languages DAT works in directly vs. those supported via interpretation.
 * UI can render as:
 *   direct: ["Shuar", "Spanish"]
 *   interpretation: ["English"]
 * => "Shuar, Spanish (with interpretation support: English)" OR
 * => "Shuar · Spanish · English (with interpretation support)"
 *
 * Keep `DramaClub.language` for backward compatibility with older UI.
 */
export type DramaClubWorkingLanguages = {
  /** Languages used directly (no translation needed for facilitation). */
  direct?: string[];
  /** Languages supported via interpretation/translation (optional). */
  interpretation?: string[];
  /** Optional extra note: e.g. "Interpretation support varies by session." */
  note?: string;
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
   * for texture/landscape context, e.g. "Amazon • Shuar Territory".
   */
  heroTextureTagline?: string;

  /**
   * Optional extra background/texture images for the hero band
   */
  heroTextureSrc?: string; // club-specific texture
  regionTextureSrc?: string; // reusable regional texture (e.g. Andes, Amazon)

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

  /**
   * Legacy/compat language field used by older UI.
   * Prefer `workingLanguages` going forward.
   */
  language?: string | string[];

  /** Preferred working language model (direct vs interpretation). */
  workingLanguages?: DramaClubWorkingLanguages;

  /**
   * Typical age range for youth in this club, e.g. "Ages 10–16".
   * Used in the Club Snapshot panel.
   */
  ageRange?: string;

  /**
   * Short line for “Who we serve” in the snapshot,
   * e.g. "Shuar youth from river communities near Gualaquiza."
   */
  whoWeServe?: string;

  /**
   * Club name in the local language (e.g. Shuar name).
   * Paired with `localLanguageLabel` like "In Shuar".
   */
  localLanguageName?: string;
  localLanguageLabel?: string;

  /**
   * Core focus line for the snapshot:
   * what this club is building toward.
   */
  coreFocus?: string;

  /**
   * Local challenge / barrier this club helps address.
   */
  localChallenge?: string;

  /**
   * Preferred explicit “room tone” line for
   * “The room feels like…” in the snapshot.
   */
  roomFeelsLike?: string;

  /**
   * Back-compat: older field name for room tone.
   * If both exist, UI should prefer `roomFeelsLike` and fall back to this.
   */
  roomFeelsLikeOverride?: string;

  // Elder / local hero micro-quote
  elderQuote?: {
    text: string;
    name?: string;
    role?: string;
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
   * Preferred explicit snapshot number for "Youth artists served".
   * If unset, UI can fall back to `youthReached ?? approxYouthServed`.
   */
  youthArtistsServed?: number;

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
   * Primary community anchor for this club, used in the Club Snapshot.
   * e.g. "Local Shuar leadership council"
   */
  communityAnchor?: string;

  /**
   * Optional: if you want a separate explicit lead partner label
   * (e.g. a school/NGO distinct from "communityAnchor").
   */
  leadPartner?: string;

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
    logoAlt?: string;
    href?: string;
    kind?: "community" | "school" | "ngo" | "artistic" | "impact";
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
   * Optional canonical lead artist reference.
   */
  leadArtist?: PersonRef;

  /**
   * Legacy simple list of lead artist names.
   * (Kept for backwards compatibility; we can derive a leadArtist from it.)
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
   * Visiting artist avatars row (PersonRef-compatible).
   */
  visitingArtists?: PersonRef[];

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
  /**
   * Causes / focus areas (used for filtering + funding language).
   *
   * Uses canonical DramaClubCause from lib/causes:
   * - category    → one of the 7 core cause categories
   * - subcategory → one of the canonical subcause IDs
   */
  causes?: DramaClubCause[];

  /**
   * Primary / headline cause for this club.
   * Used in the snapshot panel, cause ribbons, etc.
   *
   * This should always be one of the entries from `causes`.
   */
  primaryCause?: DramaClubCause;

  /**
   * String-only helper for primary cause – matches a subcategory slug
   * (e.g. "indigenous-cultural-preservation-traditional-knowledge").
   * Handy for quick comparisons, routing, or analytics.
   */
  primaryCauseSlug?: string;

  /**
   * Optional future hook: if you introduce slug-based causes
   * (e.g. "indigenous-sovereignty", "rainforest-protection"),
   * you can populate this without touching existing `causes`.
   */
  causeSlugs?: string[];

  // ========================
  // Map hooks
  // ========================
  lat?: number;
  lng?: number;

  /**
   * Optional deep-link to this club’s position on the Story Map.
   * e.g. "/story-map?club=shuar-drama-club"
   */
  storyMapHref?: string;
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
 * Helper: build legacy `language` tokens from `workingLanguages`.
 * This keeps older UI functional while we migrate rendering to the structured model.
 */
function languageTokensFromWorkingLanguages(
  w?: DramaClubWorkingLanguages
): string[] | undefined {
  if (!w) return undefined;
  const direct = (w.direct ?? []).map((s) => s.trim()).filter(Boolean);
  const interp = (w.interpretation ?? []).map((s) => s.trim()).filter(Boolean);

  const out: string[] = [];
  for (const d of direct) out.push(d);
  for (const i of interp) out.push(`${i} (with interpretation support)`);

  if (w.note && w.note.trim()) out.push(w.note.trim());
  return out.length ? out : undefined;
}

/**
 * Base template so every club gets all fields with safe defaults.
 * You can copy this object as a starting point when adding new clubs.
 *
 * NOTE: defaults are mostly ""/[] so truthy checks in UI naturally skip rendering
 * (no "Unknown", no placeholders unless you explicitly set them).
 */
const BASE_CLUB: DramaClub = {
  slug: "",
  name: "",
  country: "",
  region: "",
  city: "",
  heroTextureTagline: "",
  heroTextureSrc: undefined,
  regionTextureSrc: undefined,
  location: "",
  shortBlurb: "",
  cardImage: FALLBACK_IMAGE,
  logoSrc: undefined,
  logoAlt: undefined,

  heroImage: FALLBACK_IMAGE,
  gallery: [],

  videoThumbnail: undefined,
  videoTitle: undefined,

  description: "", // required but overridden per club
  whatHappens: "",
  originStory: "",

  language: "",
  workingLanguages: undefined,

  ageRange: "",
  whoWeServe: "",
  localLanguageName: "",
  localLanguageLabel: "",
  coreFocus: "",
  localChallenge: "",

  roomFeelsLike: "",
  roomFeelsLikeOverride: "",

  elderQuote: undefined,
  alumniQuote: undefined,
  culturalExchangeLearn: "",
  culturalExchangeShare: "",

  status: undefined,
  foundedYear: undefined,
  yearsActive: undefined,
  firstYearActive: undefined,
  lastYearActive: undefined,
  statusOverride: undefined,

  youthArtistsServed: undefined,
  approxYouthServed: undefined,
  youthReached: undefined,
  showcasesCount: undefined,
  communityShowcases: undefined,
  approxCommunityAudience: undefined,

  meetingPlace: "",
  communityAnchor: "",
  leadPartner: "",
  partners: [],
  communityPartners: [],
  communityNeeds: [],
  localContext: "",

  leadArtist: undefined,
  leadArtists: [],
  currentProjects: [],

  artistPathwaysBlurb: "",
  visitingArtists: [],
  alumniPathways: [],

  causes: [],
  primaryCause: undefined,
  primaryCauseSlug: "",
  causeSlugs: [],

  lat: undefined,
  lng: undefined,
  storyMapHref: "",
};

export const dramaClubMap: Record<string, DramaClub> = {
  /* ============================
     ECUADOR – AMAZON
     ============================ */

  // **FULL TEST CLUB – every field exercised**
  "shuar-drama-club": {
    ...BASE_CLUB,
    slug: "shuar-drama-club",
    name: "Shuar Drama Club",
    country: "Ecuador",
    region: "Amazon",
    city: "Gualaquiza",

    heroTextureTagline: "Amazon • Shuar Territory",
    location: "Community center & jungle clearing",
    meetingPlace: "Shuar community center beside the jungle clearing",
    shortBlurb:
      "A youth-driven ensemble rooted in Shuar storytelling, environmental guardianship, and the sounds of the Amazon.",
    ageRange: "Ages 11–18",
    whoWeServe:
      "Shuar youth and teens from river communities in and around Gualaquiza.",

    coreFocus:
      "Shuar-language ensemble theatre that strengthens cultural memory and forest guardianship.",
    localChallenge:
      "Youth navigating pressure from mining, migration, and cultural loss while trying to remain rooted in their territory.",

    // Preferred room tone (snapshot)
    roomFeelsLike:
      "A circle of drums, laughter, and rainforest night sounds, with elders listening just outside the light.",

    // Back-compat still set (optional; UI should prefer `roomFeelsLike`)
    roomFeelsLikeOverride:
      "A circle of drums, laughter, and rainforest night sounds, with elders listening just outside the light.",

    communityAnchor: "Local Shuar leadership council",
    leadPartner: "Community cultural council",
    storyMapHref: "/story-map?club=shuar-drama-club",

    // ===== IMAGES / MEDIA (all literal paths) =====
    heroImage: IMG_AMAZON,
    cardImage: IMG_AMAZON,
    logoSrc: IMG_MASKED,
    logoAlt: "Shuar Drama Club emblem",

    gallery: [
      {
        src: IMG_AMAZON,
        alt: "Shuar youth performing in a jungle clearing",
      },
      {
        src: SAMPLE_IMAGE,
        alt: "Warm-up circle at the Shuar community center",
      },
      {
        src: FALLBACK_IMAGE,
        alt: "Shuar Drama Club rehearsal with forest backdrop",
      },
    ],
    videoThumbnail: IMG_AMAZON,
    videoTitle: "Shuar Drama Club – Forest Guardians",

    // ========================
    // Narrative / Story
    // ========================
    description:
      "A youth-driven ensemble rooted in Shuar storytelling, environmental guardianship, and the sounds of the Amazon.",
    whatHappens:
      "On rehearsal days, the community center fills with drums, laughter, and the sound of Shuar language. Youth devise scenes that move between ancestral stories, forest protection, and the everyday humor of life in the jungle.",
    originStory:
      "Born from a series of ACTion residencies, this club grew out of workshops in a jungle community center and has become a gathering place for young storytellers, dancers, and musicians.",

    // ✅ Preferred structured language model
    workingLanguages: {
      direct: ["Shuar", "Spanish"],
      interpretation: ["English"],
      note: "Interpretation support varies by visiting artist / session.",
    },

    // ✅ Back-compat: keep `language` aligned with workingLanguages
    language:
      languageTokensFromWorkingLanguages({
        direct: ["Shuar", "Spanish"],
        interpretation: ["English"],
        note: "Interpretation support varies by visiting artist / session.",
      }) ?? ["Shuar", "Spanish", "English (with interpretation support)"],

    localLanguageName: "Ayumpum Jintia Nunink",
    localLanguageLabel: "In Shuar",

    elderQuote: {
      text: "When the youth perform, the forest listens — and so do we.",
      name: "Don Aurelio",
      role: "Community elder",
      avatarSrc: SAMPLE_IMAGE,
    },

    alumniQuote: {
      text: "This club gave me a reason to stay, to study, and to fight for our territory.",
      name: "María",
      role: "Shuar Drama Club alum",
    },

    culturalExchangeLearn:
      "We learn how visiting artists see our forest with new eyes — and how we can share our stories on their stages.",
    culturalExchangeShare:
      "We share Shuar language, songs, and the responsibilities of being guardians of this land.",

    // ========================
    // Status & activity timeline
    // ========================
    status: "ongoing",
    statusOverride: "ongoing",
    foundedYear: 2019,
    yearsActive: 4, // kept for legacy, but UI will compute dynamically
    firstYearActive: 2019,
    lastYearActive: "present",

    // ========================
    // Impact / activity
    // ========================
    youthArtistsServed: 80,
    approxYouthServed: 80,
    youthReached: 80,
    showcasesCount: 12,
    communityShowcases: 12,
    approxCommunityAudience: 1200,

    // ========================
    // Community / relationships
    // ========================
    partners: ["Local Shuar leadership", "Community cultural council"],
    communityPartners: [
      {
        name: "Local Shuar leadership",
        logoSrc: SAMPLE_IMAGE,
        logoAlt: "Local Shuar leadership",
        kind: "community",
      },
      {
        name: "Community cultural council",
        logoSrc: SAMPLE_IMAGE,
        logoAlt: "Community cultural council",
        kind: "community",
      },
    ],
    communityNeeds: [
      "Consistent transportation for youth from neighboring communities",
      "Stipends for youth facilitators and translators",
      "Funds to document and archive Shuar-language plays and songs",
    ],
    localContext:
      "The Shuar Drama Club sits deep in Amazonian territory where mining pressures, logging, and economic instability are part of daily life. The club offers a steady, joyful space rooted in culture and collective resistance.",

    leadArtists: ["jesse-baxter"],
    currentProjects: [
      "Forest Guardians play cycle",
      "Story-song circles",
      "Ritual movement pieces for river ceremonies",
    ],

    // ========================
    // Artist / AIR pathways
    // ========================
    artistPathwaysBlurb:
      "Here, theatre is inseparable from land. Artists who come to work with the Shuar Drama Club are invited into a long conversation about territory, ritual, and responsibility.",
    visitingArtists: [
      {
        name: "DAT Artist – Alexis",
        avatarSrc: SAMPLE_IMAGE,
      },
      {
        name: "Local Artist – Wolframio",
        avatarSrc: IMG_AMAZON,
      },
    ],
    alumniPathways: [
      {
        name: "María",
        role: "Youth leader & facilitator",
        slug: "maria-shuar-alum",
      },
      {
        name: "José",
        role: "Performer & forest guide",
        slug: "jose-shuar-alum",
      },
      {
        name: "Lucía",
        role: "Singer & story-keeper",
        slug: "lucia-shuar-alum",
      },
    ],

    // ========================
    // Causes / focus areas
    // ========================
    causes: [
      {
        category: "indigenous-sovereignty-rights",
        subcategory: "indigenous-cultural-preservation-traditional-knowledge",
      },
      {
        category: "indigenous-sovereignty-rights",
        subcategory: "indigenous-ecological-knowledge",
      },
      {
        category: "climate-justice-biodiversity-environmental-protection",
        subcategory: "rainforest-protection",
      },
      {
        category: "arts-culture-storytelling-representation",
        subcategory: "community-creative-expression",
      },
    ],
    primaryCause: {
      category: "indigenous-sovereignty-rights",
      subcategory: "indigenous-cultural-preservation-traditional-knowledge",
    },
    primaryCauseSlug: "indigenous-cultural-preservation-traditional-knowledge",
    causeSlugs: [
      "indigenous-cultural-preservation-traditional-knowledge",
      "indigenous-ecological-knowledge",
      "rainforest-protection",
      "community-creative-expression",
    ],

    // ========================
    // Map hooks
    // ========================
    lat: -3.407,
    lng: -78.571,
  },

  // **FULL TEST CLUB #2 – every field exercised**
  "gualaquiza-warriors": {
    ...BASE_CLUB,
    slug: "gualaquiza-warriors",
    name: "Gualaquiza Warriors",
    country: "Ecuador",
    region: "Amazon",
    city: "Gualaquiza",

    heroTextureTagline: "Amazon • Shuar Territory",
    location: "Community center & jungle clearing",
    meetingPlace: "Shuar community center beside the jungle clearing",
    shortBlurb:
      "A youth-driven ensemble rooted in Shuar storytelling, environmental guardianship, and the sounds of the Amazon.",
    ageRange: "Ages 10–16",
    whoWeServe:
      "Shuar children and early teens from families living close to the jungle edge and town center.",

    coreFocus:
      "Building confidence, team spirit, and performance skills so youth can speak up for their forest and community.",
    localChallenge:
      "Limited access to arts education and safe gathering spaces for youth navigating economic and environmental instability.",

    roomFeelsLike:
      "A packed rehearsal room humming with jokes, rhythm patterns, and half-finished dance moves.",
    roomFeelsLikeOverride:
      "A packed rehearsal room humming with jokes, rhythm patterns, and half-finished dance moves.",

    communityAnchor: "Community cultural council",
    leadPartner: "Local school / youth center partner (placeholder)",
    storyMapHref: "/story-map?club=gualaquiza-warriors",

    // ===== IMAGES / MEDIA (all literal paths) =====
    heroImage: IMG_AMAZON,
    cardImage: IMG_AMAZON,
    logoSrc: IMG_MASKED,
    logoAlt: "Shuar Drama Club emblem",

    gallery: [
      {
        src: IMG_AMAZON,
        alt: "Shuar youth performing in a jungle clearing",
      },
      {
        src: SAMPLE_IMAGE,
        alt: "Warm-up circle at the Shuar community center",
      },
      {
        src: FALLBACK_IMAGE,
        alt: "Shuar Drama Club rehearsal with forest backdrop",
      },
    ],
    videoThumbnail: IMG_AMAZON,
    videoTitle: "Gualaquiza Warriors – Youth Ensemble",

    // ========================
    // Narrative / Story
    // ========================
    description:
      "A youth-driven ensemble rooted in Shuar storytelling, environmental guardianship, and the sounds of the Amazon.",
    whatHappens:
      "On rehearsal days, the community center fills with drums, laughter, and Shuar rhythms. Youth build short scenes and movement pieces that practice bravery, teamwork, and performance in front of family and friends.",
    originStory:
      "This club emerged as a younger cohort alongside Shuar Drama Club, created to give pre-teens and early teens a steady rhythm of rehearsal, play, and performance.",

    workingLanguages: {
      direct: ["Shuar"],
      interpretation: ["Spanish"],
      note: "Spanish support available when needed for visiting partners.",
    },

    language:
      languageTokensFromWorkingLanguages({
        direct: ["Shuar"],
        interpretation: ["Spanish"],
        note: "Spanish support available when needed for visiting partners.",
      }) ?? "Shuar",

    localLanguageName: "Ayumpum Jintia Nunink",
    localLanguageLabel: "In Shuar",

    elderQuote: {
      text: "When the youth perform, the forest listens — and so do we.",
      name: "Don Aurelio",
      role: "Community elder",
      avatarSrc: SAMPLE_IMAGE,
    },

    alumniQuote: {
      text: "This club gave me a reason to stay, to study, and to fight for our territory.",
      name: "María",
      role: "Shuar Drama Club alum",
    },

    culturalExchangeLearn:
      "We learn how visiting artists see our forest with new eyes — and how we can share our stories on their stages.",
    culturalExchangeShare:
      "We share Shuar language, songs, and the responsibilities of being guardians of this land.",

    // ========================
    // Status & activity timeline
    // ========================
    status: "ongoing",
    statusOverride: "ongoing",
    foundedYear: 2019,
    yearsActive: 4, // kept for legacy, but UI will compute dynamically
    firstYearActive: 2019,
    lastYearActive: "present",

    // ========================
    // Impact / activity
    // ========================
    youthArtistsServed: 80,
    approxYouthServed: 80,
    youthReached: 80,
    showcasesCount: 12,
    communityShowcases: 12,
    approxCommunityAudience: 1200,

    // ========================
    // Community / relationships
    // ========================
    partners: ["Local Shuar leadership", "Community cultural council"],
    communityPartners: [
      {
        name: "Local Shuar leadership",
        logoSrc: SAMPLE_IMAGE,
        logoAlt: "Local Shuar leadership",
        kind: "community",
      },
      {
        name: "Community cultural council",
        logoSrc: SAMPLE_IMAGE,
        logoAlt: "Community cultural council",
        kind: "community",
      },
    ],
    communityNeeds: [
      "Consistent transportation for youth from neighboring communities",
      "Stipends for youth facilitators and translators",
      "Funds to document and archive Shuar-language plays and songs",
    ],
    localContext:
      "The Gualaquiza Warriors club serves younger youth who need consistent, safe gathering space and confidence-building through ensemble theatre, music, and movement.",

    leadArtists: ["jesse-baxter"],
    currentProjects: [
      "Youth courage scenes",
      "Rhythm + movement labs",
      "Mini showcase series",
    ],

    // ========================
    // Artist / AIR pathways
    // ========================
    artistPathwaysBlurb:
      "This club is a foundation layer: ensemble discipline, joy, and courage. Visiting artists help youth translate lived experience into scenes and movement scores.",
    visitingArtists: [
      {
        name: "DAT Artist – Alexis",
        avatarSrc: SAMPLE_IMAGE,
      },
      {
        name: "Local Artist – Wolframio",
        avatarSrc: IMG_AMAZON,
      },
    ],
    alumniPathways: [
      {
        name: "María",
        role: "Youth leader & facilitator",
        slug: "maria-shuar-alum",
      },
      {
        name: "José",
        role: "Performer & forest guide",
        slug: "jose-shuar-alum",
      },
      {
        name: "Lucía",
        role: "Singer & story-keeper",
        slug: "lucia-shuar-alum",
      },
    ],

    // ========================
    // Causes / focus areas
    // ========================
    causes: [
      {
        category: "indigenous-sovereignty-rights",
        subcategory: "indigenous-cultural-preservation-traditional-knowledge",
      },
      {
        category: "indigenous-sovereignty-rights",
        subcategory: "indigenous-ecological-knowledge",
      },
      {
        category: "climate-justice-biodiversity-environmental-protection",
        subcategory: "rainforest-protection",
      },
      {
        category: "education-access-equity-opportunity",
        subcategory: "arts-education-access",
      },
    ],
    primaryCause: {
      category: "education-access-equity-opportunity",
      subcategory: "arts-education-access",
    },
    primaryCauseSlug: "arts-education-access",
    causeSlugs: [
      "indigenous-cultural-preservation-traditional-knowledge",
      "indigenous-ecological-knowledge",
      "rainforest-protection",
      "arts-education-access",
    ],

    // ========================
    // Map hooks
    // ========================
    lat: -3.407,
    lng: -78.571,
  },
};

export const dramaClubs: DramaClub[] = Object.values(dramaClubMap);
