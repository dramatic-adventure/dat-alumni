// lib/programMap.ts

/**
 * Canonical artist model:
 * - keys are alumni slugs (preferred)
 * - values are role lines (0+ strings)
 */
export type ProgramArtistsBySlug = Record<string, string[]>;

export type ProgramFootprint = {
  // Where did this project take place (for matching)?
  country: string; // REQUIRED for each footprint
  region?: string; // OPTIONAL (e.g. "Amazon" | "Andes" | "Galápagos")
  city?: string; // OPTIONAL (only when truly city-specific)

  /**
   * OPTIONAL: If only some artists went to this specific footprint,
   * list the subset here using the SAME model as ProgramData.artists.
   *
   * If omitted, we assume ALL program artists apply to this footprint.
   */
  artists?: ProgramArtistsBySlug;
};

export interface ProgramData {
  title: string;
  slug: string;
  program: string;

  /**
   * Back-compat / display string (existing UI uses this).
   * For matching, we prefer structured geo fields + footprints.
   */
  location: string;

  // Simple case convenience (optional)
  country?: string;
  region?: string;
  city?: string;

  // Complex case (optional)
  footprints?: ProgramFootprint[];

  year: number;
  season: number;
  url?: string;

  artists: ProgramArtistsBySlug;

  color?: string;
  stampIcon?: string;

  /**
   * Direct drama club associations for "get involved" CTAs.
   * List the slug(s) of clubs this program is actively working with.
   * When populated, a "ways to get involved" block appears on those
   * drama club pages linking artists to this program.
   *
   * Example:
   *   dramaClubSlugs: ["amazon-shuar-youth-ensemble", "galapagos-youth-theatre"]
   */
  dramaClubSlugs?: string[];

  /**
   * Full external URL where artists can learn more and apply.
   * e.g. "https://www.dramaticadventure.com/action/ecuador"
   * Leave empty until the page is live — the block won't render
   * if the URL is missing or returns a non-2xx response.
   */
  externalUrl?: string;
}

/**
 * A resolved, URL-verified program entry safe to pass to the drama club
 * page template as a "ways to get involved" CTA.
 */
export interface ActiveProgram {
  title: string;
  slug: string;
  program: string;
  year: number;
  season: number;
  externalUrl: string;
  /**
   * The URL actually linked from the card.
   * Active programs: the specific externalUrl (e.g. /action/ecuador).
   * Past programs: root-stripped to the program type page (e.g. /creative-trek)
   * so the card points artists toward any new iteration of that program.
   */
  displayUrl: string;
  /** True when prog.year < current year at build/revalidation time. */
  isPast: boolean;
}

/**
 * ============================================================
 * TEMPLATE (COMMENT ONLY — DO NOT ADD AS A REAL ENTRY)
 * ============================================================
 *
 * // "SEASON-20-SLUG-GOES-HERE": {
 * //   title: "ACTion: Ecuador 2026",
 * //   slug: "action-ecuador-2026",
 * //   program: "ACTion",
 * //   location: "Ecuador",
 * //   country: "Ecuador",
 * //   region: "Amazon",
 * //   city: "Gualaquiza",
 * //   footprints: [
 * //     { country: "Ecuador", region: "Amazon", city: "Gualaquiza" },
 * //     { country: "Ecuador", region: "Andes", city: "Quito" },
 * //     {
 * //       country: "Ecuador",
 * //       region: "Galápagos",
 * //       artists: { "artist-slug": ["Role 1"] },
 * //     },
 * //   ],
 * //   year: 2026,
 * //   season: 20,
 * //   url: "/action",
 * //   artists: { "jesse-baxter": ["Artistic Director"] },
 * //   // "Get involved" CTA on drama club pages:
 * //   dramaClubSlugs: ["amazon-shuar-youth-ensemble", "galapagos-youth-theatre"],
 * //   externalUrl: "https://www.dramaticadventure.com/action/ecuador",
 * // },
 *
 * ============================================================
 */

export const programMap: Record<string, ProgramData> = {
  // Season 20 entry:
  "passage-slovakia-2026": {
    title: "PASSAGE: Slovakia 2026",
    slug: "passage-slovakia-2026",
    program: "PASSAGE",
    location: "Slovakia",
    country: "Slovakia",
    year: 2026,
    season: 20,
    dramaClubSlugs: ["lunik-ix-collective", "zemplinska-teplica-youth-ensemble"],
    externalUrl: "https://www.dramaticadventure.com/passage",
    url: "/passage",
    artists: {
      "jesse-baxter": ["Artistic Director"],
      "christen-madrazo": ["Director of Creative Learning"],
      "jason-williamson": ["Resident Playwright"],
      "asa-williamson": ["Artist Apprentice"],
      "vida-williamson": ["Artist Apprentice"],
    },
  },

  "dat-lab-slovakia-2026": {
    title: "DAT Lab: Slovakia 2026",
    slug: "dat-lab-slovakia-2026",
    program: "DAT Lab Creative Residency",
    location: "Slovakia",
    country: "Slovakia",
    year: 2026,
    season: 20,
    dramaClubSlugs: ["lunik-ix-collective", "zemplinska-teplica-youth-ensemble"],
    externalUrl: "https://www.dramaticadventure.com/passage",
    url: "/passage",
    artists: {
      "jesse-baxter": ["Artistic Director"],
      "christen-madrazo": ["Director of Creative Learning"],
      "jason-williamson": ["Resident Playwright"],
    },
  },

    "teaching-artist-residency-slovakia-2026": {
    title: "Teaching Artist Residency: Slovakia 2026",
    slug: "teaching-artist-residency-slovakia-2026",
    program: "Teaching Artist Residency",
    location: "Slovakia",
    year: 2026,
    season: 20,
    dramaClubSlugs: ["lunik-ix-collective", "zemplinska-teplica-youth-ensemble"],
    externalUrl: "https://www.dramaticadventure.com/passage",
    url: "/teaching-artist-residency",
    artists: {
      "jesse-baxter": ["Artistic Director, Teaching Artist"],
      "christen-madrazo": ["Director of Creative Learning, Teaching Artist"],
      "jason-williamson": ["Resident Playwright, Teaching Artist"],
      "asa-williamson": ["Artist Apprentice"],
      "vida-williamson": ["Artist Apprentice"],
    },
  },

  // Season 19 entry:
  "creative-trek-ecuador-2025": {
    title: "Creative Trek: Ecuador (refresh) 2025",
    slug: "creative-trek-ecuador-2025",
    program: "Creative Trek",
    location: "Ecuador",
    country: "Ecuador",
    year: 2025,
    season: 19,
    url: "/creative-trek",
    artists: {
      "jesse-baxter": ["Artistic Director"],
    },
  },

  // Season 18 entry:
  "teaching-artist-residency-slovakia-2024": {
    title: "Teaching Artist Residency: Slovakia 2024",
    slug: "teaching-artist-residency-slovakia-2024",
    program: "Teaching Artist Residency",
    location: "Slovakia",
    year: 2024,
    season: 18,
    url: "/teaching-artist-residency",
    artists: {
      "christen-madrazo": ["Director of Creative Learning, Teaching Artist"],
      "jason-williamson": ["Resident Playwright, Teaching Artist"],
      "asa-williamson": ["Artist Apprentice"],
      "vida-williamson": ["Artist Apprentice"],
    },
  },

  "dat-retreat-2023": {
    title: "DAT Retreat 2023",
    slug: "dat-retreat-2023",
    program: "Company Retreat",
    location: "Berkshires",
    year: 2023,
    season: 18,
    url: "",
    artists: {
      "jason-williamson": ["Resident Playwright"],
      "christen-madrazo": ["Director of Creative Learning",],
      "kathleen-amshoff": ["Assoc. Artistic Director"],
      "mary-k-baxter": ["Executive Director"],
      "jesse-baxter": ["Artistic Director"],
      "asa-williamson": ["Artist Apprentice"],
      "vida-williamson": ["Artist Apprentice"],
      "lucille-baxter": ["Artist Apprentice"],
      "seamus-baxter": ["Artist Apprentice"],
      "greta-amshoff-brenner": ["Artist Apprentice"],
      "isaiah-amshoff-brenner": ["Artist Apprentice"],
    },
  },

  "micro-adventure-hudson-valley-derive-2023": {
    title: "Micro-Adventure: Hudson Valley Dérive 2023",
    slug: "micro-adventure-hudson-valley-derive-2023",
    program: "Micro-Adventure",
    location: "Hudson Valley",
    year: 2023,
    season: 18,
    url: "",
    artists: {
      "claudia-toth": ["Artist"],
      "christen-madrazo": ["Director of Creative Learning", "Artist"],
      "jason-williamson": ["Resident Playwright", "Artist"],
      "mary-k-baxter": ["Executive Director", "Artist"],
      "jesse-baxter": ["Artistic Director", "Artist"],
      "asa-williamson": ["Artist Apprentice"],
      "vida-williamson": ["Artist Apprentice"],
      "lucille-baxter": ["Artist Apprentice"],
      "seamus-baxter": ["Artist Apprentice"],
    },
  },

  // Season 17 entry:
  "creative-trek-slovakia-2023": {
    title: "Creative Trek: Slovakia (refresh) 2023",
    slug: "creative-trek-slovakia-2023",
    program: "Creative Trek",
    location: "Slovakia",
    year: 2023,
    season: 17,
    url: "/creative-trek",
    artists: {
      "jason-williamson": ["Resident Playwright"],
      "christen-madrazo": ["Director of Creative Learning"],
      "jesse-baxter": ["Artistic Director"],
      "asa-williamson": ["Artist Apprentice"],
      "vida-williamson": ["Artist Apprentice"],
    },
  },

  // Season 16 entry:
  "site-lines-ecuador-2022": {
    title: "SITE-LINES: The Amazon 2022",
    slug: "site-lines-ecuador-2022",
    program: "SITE-LINES",
    location: "Ecuador",
    year: 2022,
    season: 16,
    url: "/site-lines",
    artists: {
      "jesse-baxter": ["Artistic Director", "Director"],
      "peter-petkovsek": ["Assoc. Artistic Director", "Director"],
      "gustavo-redin": ["Director of Community Partnerships"],
      "carla-rizzo": ["Community Partnerships Coordinator"],
      "daniela-garzon-silva": ["Documentary Photographer", "Road Manager"],
      "juliana-franco": ["Road Manager"],
      "yan-rey": ["Road Manager"],
      "alexandra-dayka": ["Theatremaker"],
      "vanessa-frank": ["Theatremaker"],
      "lisa-herman": ["Theatremaker"],
      "deborah-katz": ["Theatremaker"],
      "mathilde-prosen-oldani": ["Theatremaker"],
      "marisa-puller": ["Theatremaker"],
      "maria-segal": ["Theatremaker"],
    }
  },
  // Season 15 entry:
  // Season 14 entry:
      "virtual-teaching-artist-residency-slovakia-2020": {
      title: "Virtual Teaching Artist Residency: Slovakia 2020",
      slug: "virtual-teaching-artist-residency-slovakia-2020",
      program: "Teaching Artist Residency",
      location: "Online with the Luník IX Collective in Košice, Slovakia",
      year: 2020,
      season: 14,
      dramaClubSlugs: ["lunik-ix-collective"],
      externalUrl: "https://www.dramaticadventure.com/teaching-artist-residency",
      url: "/teaching-artist-residency",
      artists: {
        "christen-madrazo": ["Director of Creative Learning", "Teaching Artist"],
        "jesse-baxter": ["Artistic Director", "Teaching Artist"],
        "barbara-herucova": ["Manager of Community Partnerships in Czechia & Slovakia", "Teaching Artist"],
      },
    },

  // Season 13 entry:
  // Season 12 entry:
    "teaching-artist-residency-slovakia-2018": {
      title: "Teaching Artist Residency: Košice, Slovakia 2018",
      slug: "teaching-artist-residency-slovakia-2018",
      program: "Teaching Artist Residency",
      location: "Košice, Slovakia",
      year: 2018,
      season: 12,
      dramaClubSlugs: ["lunik-ix-collective","camp-etp-slovensko"],
      externalUrl: "https://www.dramaticadventure.com/teaching-artist-residency",
      url: "/teaching-artist-residency",
      artists: {
        "christen-madrazo": ["Director of Creative Learning", "Teaching Artist"],
        "jason-williamson": ["Resident Playwright", "Teaching Artist"],
        "mary-k-baxter": ["Executive Director", "Teaching Artist"],
        "jesse-baxter": ["Artistic Director", "Teaching Artist"],
        "lucille-baxter": ["Artist Apprentice"],
        "karina-sindicich": ["Teaching Artist"],
        "antonia-lache": ["Teaching Artist"],
      },
    },

  // Season 11 entry:

  // Season 10 entry:
    "action-tanzania-2016": {
    title: "ACTion: Tanzania 2016",
    slug: "action-tanzania-2016",
    program: "ACTion",
    location: "Tanzania",
    year: 2016,
    season: 10,
    dramaClubSlugs: ["mloka", "mama-lynns", "Dar"],
    externalUrl: "https://www.dramaticadventure.com/action",
    url: "/action",
    artists: {

          },
  },

    "teaching-artist-residency-ecuador-2016": {
    title: "Teaching Artist Residency: Floreana Island, Galápagos, Ecuador 2016",
    slug: "teaching-artist-residency-ecuador-2016",
    program: "Teaching Artist Residency",
    location: "Floreana Island, Galápagos, Ecuador",
    year: 2016,
    season: 10,
    dramaClubSlugs: ["floreana-youth-ensemble"],
    externalUrl: "https://www.dramaticadventure.com/teaching-artist-residency",
    url: "/teaching-artist-residency",
    artists: {
      "christen-madrazo": ["Director of Creative Learning", "Teaching Artist"],
      "jason-williamson": ["Resident Playwright", "Teaching Artist"],
      "mary-k-baxter": ["Executive Director", "Teaching Artist"],
      "jesse-baxter": ["Artistic Director", "Teaching Artist"],
      "lucille-baxter": ["Artist Apprentice"],
      "sarah-cronk": ["Teaching Artist"],
      "gustavo-redin": ["Road Manager", "Teaching Artist"],
    },
  },
  // Season 9 entry:
  // Season 8 entry:
  "teaching-artist-residency-slovakia-2014": {
    title: "Teaching Artist Residency: Moldava nad Bodvou, Slovakia 2014",
    slug: "teaching-artist-residency-slovakia-2014",
    program: "Teaching Artist Residency",
    location: "Moldava nad Bodvou, Slovakia",
    year: 2014,
    season: 8,
    dramaClubSlugs: ["slum-dog-theatre"],
    externalUrl: "https://www.dramaticadventure.com/teaching-artist-residency",
    url: "/teaching-artist-residency",
    artists: {
      "christen-madrazo": ["Director of Creative Learning", "Teaching Artist"],
      "jason-williamson": ["Resident Playwright", "Teaching Artist"],
      "katey-parker": ["Teaching Artist"],
      "tina-valentova": ["Road Manager", "Teaching Artist"],
    },
  },

  // Season 7 entry:
  "action-heart-of-europe-2013": {
    title: "ACTion: Heart of Europe 2013",
    slug: "action-heart-of-europe-2013",
    program: "ACTion",
    location: "Heart of Europe",
    year: 2013,
    season: 7,
    dramaClubSlugs: ["slum-dog-theatre", "stara-lubovna", "??"],
    externalUrl: "https://www.dramaticadventure.com/action",
    url: "/action",
    artists: {
      "tom-costello": ["Interim Manager of Community Partnerships in Czechia and Slovakia", "Director"],
      "nicholas-linnehan": ["Actor"],
      "michael-axelrod": ["Actor"],
      "lacy-allen": ["Actor"],
      "katherine-a-uyeda": ["Actor"],
      "janice-amaya": ["Actor"],
      "ivano-pulito": ["Actor"],
      "gabriel-kadian": ["Actor"],
      "claudio-silva": ["Actor"],
      "claire-edmonds": ["Actor"],
      "brooke-hutchins": ["Actor"],
      "benjamin-ridge": ["Actor"],
      "ashley-james": ["Actor"],
      "anna-deblassio": ["Actor"],
      "anna-cherkezishvili": ["Actor"],
      "amber-finn": ["Actor"],
      "alexis-floyd": ["Actor"],
      "abbey-glasure": ["Actor"],
      "dominika-siroka": ["Road Manager"],
      "petra-slovakova": ["Road Manager"],
      "richard-sipos": ["Road Manager"],
      "jason-williamson": [
        "Resident Playwright",
        "Director",
        "Teaching Artist",
      ],
      "christen-madrazo": [
        "Director of Creative Learning",
        "Teaching Artist",
      ],
      "kathleen-amshoff": [
        "Assoc. Artistic Director",
        "Director",
        "Teaching Artist",
      ],
      "mary-k-baxter": ["Executive Director"],
      "jesse-baxter": ["Artistic Director", "Teaching Artist"],
    },
  },

  // Season 6 entry:
  "creative-trek-slovakia-2012": {
    title: "Creative Trek: Slovakia 2012",
    slug: "creative-trek-slovakia-2012",
    program: "Creative Trek",
    location: "Slovakia",
    year: 2012,
    season: 6,
    dramaClubSlugs: ["slum-dog-theatre", "stara-lubovna"],
    externalUrl: "https://www.dramaticadventure.com/creative-trek",
    url: "/creative-trek",
    artists: {
      "richard-sipos": ["Road Manager"],
      "lisa-kramer": ["Writer"],
      "jacob-hellman": ["Actor"],
      "elizabeth-mckinney": ["Actor"],
      "jason-williamson": ["Resident Playwright", "Teaching Artist"],
      "christen-madrazo": ["Director of Creative Learning", "Teaching Artist"],
      "mary-k-baxter": ["Executive Director", "Teaching Artist"],
      "jesse-baxter": ["Artistic Director", "Teaching Artist"],
    },
  },

  "dat-retreat-2011": {
    title: "DAT Retreat 2011",
    slug: "dat-retreat-2011",
    program: "Company Retreat",
    location: "Queens",
    year: 2011,
    season: 6,
    url: "",
    artists: {
      "bryant-vance": ["Actor"],
      "jason-williamson": [
        "Resident Playwright",
        "Director",
        "Teaching Artist",
      ],
      "christen-madrazo": [
        "Director of Creative Learning",
        "Teaching Artist",
      ],
      "kathleen-amshoff": ["Assoc. Artistic Director"],
      "mary-k-baxter": ["Executive Director"],
      "jesse-baxter": ["Artistic Director"],
    },
  },

  // Season 5 entry:
  "teaching-artist-residency-ecuador-2011": {
    title: "Teaching Artist Residency: Esmeraldas, Ecuador 2011",
    slug: "teaching-artist-residency-ecuador-2011",
    program: "Teaching Artist Residency",
    location: "Esmeraldas, Ecuador",
    year: 2011,
    season: 5,
    dramaClubSlugs: ["esmeraldas-youth-ensemble"],
    externalUrl: "https://www.dramaticadventure.com/teaching-artist-residency",
    url: "/teaching-artist-residency",
    artists: {
      "isabel-martinez": ["Actor"],
      "dionne-audain": ["Teaching Artist"],
      "mabel-demera-grijalva": ["Road Manager", "Teaching Artist"],
      "hanniel-sindelar": ["Teaching Artist"],
      "kathleen-amshoff": [
        "Assoc. Artistic Director",
        "Teaching Artist",
      ],
      "mary-k-baxter": ["Executive Director", "Teaching Artist"],
      "jesse-baxter": ["Artistic Director", "Teaching Artist"],
    },
  },

  "dat-retreat-2010": {
    title: "DAT Retreat 2010",
    slug: "dat-retreat-2010",
    program: "Company Retreat",
    location: "Space on Ryder Farms",
    year: 2010,
    season: 5,
    url: "",
    artists: {
      "mady-spiegel": ["Actor"],
      "bryant-vance": ["Actor"],
      "jon-kevin-lazarus": ["Actor"],
      "drew-ernst": ["Director"],
      "lauren-ullrich": ["Actor"],
      "gustavo-redin": ["Manager of Community Partnerships in Ecuador"],
      "jason-williamson": [
        "Resident Playwright",
        "Director",
        "Teaching Artist",
      ],
      "christen-madrazo": [
        "Director of Creative Learning",
        "Teaching Artist",
      ],
      "kathleen-amshoff": ["Assoc. Artistic Director"],
      "mary-k-baxter": ["Executive Director"],
      "jesse-baxter": ["Artistic Director"],
    },
  },

  // Season 4 entry:
  "action-ecuador-2010": {
    title: "ACTion: Ecuador 2010",
    slug: "action-ecuador-2010",
    program: "ACTion",
    location: "Ecuador",
    year: 2010,
    season: 4,
    dramaClubSlugs: ["quiolotoa-collective", "esmeraldas-youth-ensemble", "san-cristobal-collective"],
    externalUrl: "https://www.dramaticadventure.com/action",
    url: "/action",
    artists: {
      "tamara-easton": ["Actor"],
      "natalie-hirsch": ["Actor"],
      "lauren-ullrich": ["Actor"], // NOTE: lauren-ullrich did the project twice in one summer! 
      "jennifer-rodriguez": ["Actor"],
      "jamie-blanek": ["Actor"],
      "garrett-bales": ["Actor"],
      "adam-griffith": ["Actor"],
      "kaitlin-hernandez": ["Actor"],
      "jnelle-bobb-semple": ["Actor"],
      "heather-ichihashi": ["Actor"],
      "hanniel-sindelar": ["Actor"],
      "courtney-dusenberry": ["Actor"],      
      "alena-acker": ["Actor"],
      "dianna-beshara": ["Actor"],
      "katarina-hughes": ["Actor"],
      "maggie-thompson": ["Actor"],
      "bryant-vance": ["Actor"],
      "isabel-martinez": ["Actor"],
      "gustavo-redin": [
        "Manager of Community Partnerships in Ecuador",
        "Road Manager",
        "Teaching Artist",
      ],
      "jason-williamson": [
        "Resident Playwright",
        "Teaching Artist",
      ],
      "christen-madrazo": [
        "Director of Creative Learning",
        "Teaching Artist",
      ],
      "santi-baxter": ["Fixer"],
      "sonia-ostaiza": ["Fixer"],
      "kathleen-amshoff": [
        "Assoc. Artistic Director",
        "Director",
        "Teaching Artist",
      ],
      "mary-k-baxter": ["Executive Director", "Road Manager", "Teaching Artist"],
      "jesse-baxter": ["Artistic Director", "Director", "Teaching Artist"],
    },
  },

  "dat-retreat-2009": {
    title: "DAT Retreat 2009",
    slug: "dat-retreat-2009",
    program: "Company Retreat",
    location: "Space on Ryder Farms",
    year: 2009,
    season: 4,
    url: "",
    artists: {
      "isabel-martinez": ["Actor"],
      "mady-spiegel": ["Actor"],
      "amy-e-witting": ["Actor"],
      "jennifer-robideau": ["Actor"],
      "zoe-reiniger": ["Actor"],
      "eugene-michael-santiago": ["Actor"],
      "jon-kevin-lazarus": ["Actor"],
      "drew-ernst": ["Director"],
      "jason-williamson": ["Resident Playwright"],
      "christen-madrazo": ["Director of Creative Learning",],
      "kathleen-amshoff": ["Assoc. Artistic Director"],
      "mary-k-baxter": ["Executive Director"],
      "jesse-baxter": ["Artistic Director"],
    },
  },

  // Season 3 entry:
  "action-ecuador-2009": {
    title: "ACTion: Ecuador 2009",
    slug: "action-ecuador-2009",
    program: "ACTion",
    location: "Ecuador",
    year: 2009,
    season: 3,
    dramaClubSlugs: ["quiolotoa-collective", "esmeraldas-youth-ensemble", "la-selva-lab", "san-cristobal-collective"],
    externalUrl: "https://www.dramaticadventure.com/action",
    url: "/action",
    artists: {
      "isabel-martinez": ["Actor"],
      "zoe-reiniger": ["Actor"],
      "tzena-nicole": ["Actor"],
      "tiffany-may": ["Actor"],
      "solia-martinez-jacobs": ["Actor"],
      "sarah-cronk": ["Actor"],
      "sarah-benjamin": ["Actor"],
      "rob-salas": ["Director"],
      "regina-gibson": ["Actor"],
      "rebecca-aranda": ["Actor"],
      "randyll-wendl": ["Actor"],
      "rachel-gross": ["Actor"],
      "rachael-palmer-jones": ["Actor"],
      "nemuna-ceesay": ["Actor"],
      "natalie-benally": ["Actor"],
      "mikkei-fritz": ["Actor"],
      "michelle-santagate": ["Actor"],
      "michael-rau": ["Director"],
      "melissa-dunham": ["Actor"],
      "mary-notari": ["Actor"],
      "maren-uecker": ["Actor"],
      "mady-spiegel": ["Actor"],
      "lulu-fogarty": ["Actor"],
      "liz-nelson": ["Actor"],
      "liz-baessler": ["Actor"],
      "lisa-younger": ["Actor"],
      "kaylee-mae-tucker": ["Actor"],
      "katie-montoya": ["Actor"],
      "katie-merkel": ["Actor"],
      "katie-clark": ["Actor"],
      "kathy-yamamoto": ["Actor"],
      "katey-parker": ["Actor"],
      "kara-wang": ["Actor"],
      "josimar-tulloch": ["Actor"],
      "jon-kevin-lazarus": ["Actor"],
      "jim-knipple": ["Director"],
      "jessica-emerson": ["Actor"],
      "jennifer-robideau": ["Actor"],
      "jeanne-lauren-smith": ["Actor"],
      "janel-miley": ["Actor"],
      "jamil-mangan": ["Director"],  // NOTE: jamil-mangan did the project twice in one summer! 
      "jacob-hellman": ["Actor"],
      "hilary-white": ["Actor"],
      "heather-massie": ["Actor"],
      "gillian-hurst": ["Actor"],
      "gia-battista": ["Actor"],
      "eugene-michael-santiago": ["Actor"],
      "erin-mcbride-africa": ["Director"],
      "elizabeth-mckinney": ["Actor"],
      "elizabeth-irwin": ["Actor"],
      "drew-ernst": ["Director"],
      "claire-harkey": ["Actor"],
      "carla-neuss": ["Actor"],
      "caitlin-green": ["Actor"],
      "cj-lassiter": ["Actor"],
      "byron-arreola": ["Actor"],
      "blaine-patagoc": ["Actor"],
      "amy-e-witting": ["Actor"],
      "amanda-cortinas": ["Actor"],
      "alexa-green": ["Actor"],
      "adrienne-wheeler": ["Actor"],
      "sarah-chien": ["Road Manager"],
      "george-adams": ["Road Manager"],
      "maria-isabel-rojas": ["Road Manager"],
      "gustavo-redin": ["Road Manager"],
      "jason-williamson": ["Director"],
      "christen-madrazo": ["Teaching Artist in Residence"],
      "vince-eaton": ["Actor"],
      "rachel-wiese": ["Director"],
      "santi-baxter": ["Fixer"],
      "sonia-ostaiza": ["Fixer"],
      "kathleen-amshoff": ["Director"],
      "mary-k-baxter": ["Executive Director", "Road Manager"],
      "jesse-baxter": ["Artistic Director"],
    },
  },

  // Season 2 entry:
  "creative-trek-ecuador-2008": {
    title: "Creative Trek: Ecuador 2008",
    slug: "creative-trek-ecuador-2008",
    program: "Creative Trek",
    location: "Ecuador",
    country: "Ecuador",
    year: 2008,
    season: 2,
    dramaClubSlugs: ["quiolotoa-collective", "esmeraldas-youth-ensemble", "la-selva-lab", "san-cristobal-collective"],
    externalUrl: "https://www.dramaticadventure.com/creative-trek",
    url: "/creative-trek",
    artists: {
      "rachel-wiese": ["Actor"],
      "lydia-feldez": ["Actor"],
      "leslie-fields": ["Playwright"],
      "jeremy-feldez": ["Actor"],
      "santi-baxter": ["Road Manager"],
      "mary-k-baxter": ["Executive Director", "Actor"],
      "jesse-baxter": ["Artistic Director", "Director"],
    },
  },

  // Season 1 entry:
  "creative-trek-zimbabwe-2007": {
    title: "Creative Trek: Zimbabwe 2007",
    slug: "creative-trek-zimbabwe-2007",
    program: "Creative Trek",
    location: "Zimbabwe",
    country: "Zimbabwe",
    year: 2007,
    season: 1,
    dramaClubSlugs: ["bulawayo-young-company", "Harare", "Starry", "Matopo", "Church"],
    externalUrl: "https://www.dramaticadventure.com/creative-trek",
    url: "/creative-trek",
    artists: {
      "isabel-martinez": ["Actor"],
      "oscar-manzini": ["Road Manager"],
      "lisa-bearpark": ["Actor"],
      "kathleen-amshoff": ["Assoc. Artistic Director", "Director"],
      "mary-k-baxter": ["Executive Director", "Actor"],
      "jesse-baxter": ["Artistic Director", "Actor"],
    },
  },
};
