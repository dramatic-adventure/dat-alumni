export type Layout = "landscape" | "portrait";
export type TitlePosition = "bottom-left" | "bottom-center";

export interface Production {
  title: string;
  slug: string;
  year: number;
  location: string;
  festival: string;
  url: string;
  posterUrl: string;
  artists: Record<string, string[]>;
  layout?: Layout;
  titlePosition?: TitlePosition;
}

// ✅ Add explicit typing here 👇
export const productionMap: Record<string, Production> = {
  "blackfish": {
    title: "Blackfish",
    slug: "blackfish",
    year: 2018,
    location: "Towson, MD",
    festival: "Spinal: MFA New Works in Theatre",
    url: "/blackfish-workshop",
    posterUrl: "/posters/blackfish.jpg",
    artists: {
      "jesse-baxter": ["Director"],
      "jason-williamson": ["Playwright"],
      "megan-durner": ["Stage Manager"],
      "david-crandall": ["Lighting Design"],
      "daniel-ettinger": ["Set Design"],
      "ava-ertel": ["Costume Design"],
      "italo-de-dea": ["Puppet Design"],
      "autumn-koehnlein": ["Puppeteer"],
      "samuel-pomerantz": ["Puppeteer"],
      "isaiah-harvey": ["Puppeteer"],
      "kasie-lerner": ["Actor"],
      "jon-kevin-lazarus": ["Actor"],
      "willem-rogers": ["Actor"],
      "taylor-rekus": ["Actor"],
      "gina-mattucci": ["Actor"],
      "clara-coslett": ["Actor"]
    }
  },
  "miracles-are-soft-in-the-jungle": {
    title: "Miracles are Soft in the Jungle",
    slug: "miracles-are-soft-in-the-jungle",
    year: 2017,
    location: "NYC",
    festival: "ACTion Fest 2017: Juntos, Mano a Mano: Hand in Hand",
    url: "/miracles-are-soft-in-the-jungle",
    posterUrl: "/posters/miracles.jpg",
    artists: {
      "peter-petkovšek": ["Director", "Actor"],
      "erin-jones": ["Lighting Design"],
      "brendan-boston": ["Set Design"],
      "claudia-toth": ["Stage Manager"],
      "ana-arellano": ["Road Manager"],
      "gustavo-redín": ["Road Manager"],
      "antonia-laché": ["Actor"],
      "karina-sindicich": ["Actor"],
      "leslie-root": ["Actor"],
      "sam-super": ["Actor"]
    }
  },
  "whispers-of-floreana": {
    title: "Whispers of Floreana",
    slug: "whispers-of-floreana",
    year: 2017,
    location: "NYC",
    festival: "ACTion Fest 2017: Juntos, Mano a Mano: Hand in Hand",
    url: "/whispers-of-floreana",
    posterUrl: "/posters/whispers.jpg",
    artists: {
      "amy-e-witting": ["Director", "Actor"],
      "erin-jones": ["Lighting Design"],
      "brendan-boston": ["Set Design"],
      "claudia-toth": ["Stage Manager"],
      "stephie-guerrero": ["Road Manager"],
      "javier-spivey": ["Actor"],
      "lauren-ullrich": ["Actor"],
      "liz-eacmen": ["Actor"],
      "meliza-gutierez": ["Actor"],
      "naira-agvani-zakaryan": ["Actor"],
      "sabrina-carmichael": ["Actor"],
      "willa-mcwhorter": ["Actor"]
    }
  },
  "tembo": {
    title: "Tembo!",
    slug: "tembo",
    year: 2016,
    location: "NYC",
    festival: "ACTion Fest 2016: Shangaa: Shock and Awe",
    url: "/tembo",
    posterUrl: "/posters/tembo.jpg",
    artists: {
      "candis-c-jones": ["Director", "Actor"],
      "erin-jones": ["Lighting Design"],
      "elle-kunnos-de-voss": ["Set Design"],
      "francisco-rondon": ["Set Design"],
      "claudia-toth": ["Stage Manager"],
      "jacqueline-kafipha": ["Road Manager"],
      "anikke-fox": ["Actor"],
      "danielle-click": ["Actor"],
      "giulia-martinelli": ["Actor"],
      "laura-bernas": ["Actor"],
      "tsebiyah-mishael": ["Actor"]
    }
  },
  "travelogues": {
    title: "Travelogues",
    slug: "travelogues",
    year: 2016,
    location: "NYC",
    festival: "ACTion Fest 2016: Shangaa: Shock and Awe",
    url: "/action-travelogues",
    posterUrl: "/posters/travelogues.jpg",
    artists: {
      "christen-madrazo": ["Director"],
      "erin-jones": ["Lighting Design"],
      "elle-kunnos-de-voss": ["Set Design"],
      "francisco-rondon": ["Set Design"],
      "claudia-toth": ["Stage Manager"],
      "jackson-kibona": ["Road Manager"],
      "amanda-donohue": ["Actor"],
      "ariana-castillo": ["Actor"],
      "edward-serrate-yujo": ["Actor"],
      "karina-velez": ["Actor"],
      "melissa-gaiti": ["Actor"],
      "natalie-giaccio": ["Actor"],
      "patricia-campbell": ["Actor"],
      "sam-jones": ["Actor"]
    }
  },

  "ubinadamu": {
    title: "Ubinadamu",
    slug: "ubinadamu",
    year: 2016,
    location: "NYC",
    festival: "ACTion Fest 2016: Shangaa: Shock and Awe",
    url: "/ubinadamu",
    posterUrl: "/posters/ubinadamu.jpg",
    artists: {
      "michael-herman": ["Director"],
      "asha-musa-dibuga": ["Inspiration"],
      "erin-jones": ["Lighting Design"],
      "elle-kunnos-de-voss": ["Set Design"],
      "francisco-rondon": ["Set Design"],
      "claudia-toth": ["Stage Manager"],
      "sarapia-veruli": ["Choreographer", "Road Manager", "Dramaturg"],
      "ariana-howell": ["Actor"],
      "brian-telestai": ["Actor"],
      "kate-moran": ["Actor"],
      "kerith-telestai": ["Actor"],
      "sarah-grace-sanders": ["Actor"],
      "vanessa-frank": ["Actor"]
    }
  },

  "nisikilize": {
    title: "Nisikilize",
    slug: "nisikilize",
    year: 2016,
    location: "NYC",
    festival: "ACTion Fest 2016: Shangaa: Shock and Awe",
    url: "/nisikilize",
    posterUrl: "/posters/nisikilize.jpg",
    artists: {
      "jason-williamson": ["Director"],
      "erin-jones": ["Lighting Design"],
      "elle-kunnos-de-voss": ["Set Design"],
      "francisco-rondon": ["Set Design"],
      "claudia-toth": ["Stage Manager"],
      "godfrey-staford": ["Road Manager"],
      "nelson-ramirez": ["Drums"],
      "daryl-paris-bright": ["Actor"],
      "hailey-moran": ["Actor"],
      "karina-sindicich": ["Actor"],
      "mai-reina-gold": ["Actor"],
      "sophia-pervilhac": ["Actor"]
    }
  },
  "the-rebel-bird": {
    title: "The Rebel Bird",
    slug: "the-rebel-bird",
    year: 2015,
    location: "Nitra, Slovakia",
    festival: "Workshop Production 2015 – Divadlo Andreja Bagara",
    url: "/rebel-bird-workshop",
    posterUrl: "/posters/rebel-bird.jpg",
    artists: {
      "kathleen-amshoff": ["Director"],
      "jesse-baxter": ["Artistic Director"],
      "mary-k-baxter": ["Executive Director"],
      "tom-costello": ["Producer"],
      "christen-madrazo": ["Dramaturg", "Narrator"],
      "petra-slováková": ["Interpreter"],
      "lukáš-hudák": ["Actor"],
      "milan-hudák": ["Actor"],
      "ján-koky": ["Actor"],
      "jonathan-david": ["Actor"],
      "nick-lehane": ["Actor"],
      "lucia-šipošová": ["Actor"]
    }
  },

  "stop-stay-leave": {
    title: "Stop. Stay. Leave.",
    slug: "stop-stay-leave",
    year: 2015,
    location: "NYC",
    festival: "ACTion Fest 2015: Tu a Teraz: Here and Now",
    url: "/stop-stay-leave",
    posterUrl: "/posters/stop-stay-leave.jpg",
    artists: {
      "danya-taymor": ["Director"],
      "erin-jones": ["Lighting Design"],
      "elle-kunnos-de-voss": ["Set Design"],
      "claudia-toth": ["Stage Manager"],
      "amber-steffey": ["Assistant Stage Manager"],
      "tamara-ďuračková": ["Road Manager"],
      "alex-wanebo": ["Actor"],
      "anna-kendall": ["Actor"],
      "cheyenne-shupp": ["Actor"],
      "dylan-lack": ["Actor"],
      "isaac-snyder": ["Actor"],
      "nancy-monahan": ["Actor"]
    }
  },

  "porajmos-the-devouring": {
    title: "Porajmos: The Devouring",
    slug: "porajmos-the-devouring",
    year: 2015,
    location: "NYC",
    festival: "ACTion Fest 2015: Tu a Teraz: Here and Now",
    url: "/porajmos",
    posterUrl: "/posters/porajmos.jpg",
    artists: {
      "bryce-britton": ["Director"],
      "erin-jones": ["Lighting Design"],
      "elle-kunnos-de-voss": ["Set Design"],
      "sarah-riffle": ["Costume Design"],
      "eli-sibley": ["Movement Coordinator"],
      "claudia-toth": ["Stage Manager"],
      "amber-steffey": ["Stage Manager"],
      "barbara-herucová": ["Road Manager"],
      "amna-mehmood": ["Actor"],
      "daryl-bright": ["Actor"],
      "gareth-tidball": ["Actor"],
      "marla-caram": ["Actor"],
      "monica-hanigan": ["Actor"],
      "susanna-morris": ["Actor"],
      "willa-mcwhorter": ["Actor"]
    }
  },
  "sunflower": {
    title: "The Town at the Edge of the Sunflower Field",
    slug: "sunflower",
    year: 2015,
    location: "NYC",
    festival: "ACTion Fest 2015: Tu a Teraz: Here and Now",
    url: "/sunflower",
    posterUrl: "/posters/sunflower.jpg",
    artists: {
      "ryan-whinnem": ["Director"],
      "erin-jones": ["Lighting Design"],
      "elle-kunnos-de-voss": ["Set Design"],
      "eli-sibley": ["Movement Coordinator"],
      "claudia-toth": ["Stage Manager"],
      "amber-steffey": ["Assistant Stage Manager"],
      "dorota-smiešková": ["Road Manager"],
      "annie-hartkemeyer": ["Actor"],
      "max-gould": ["Actor"],
      "megan-peters": ["Actor"],
      "mikayla-oneill": ["Actor"],
      "nativa-kesecker": ["Actor"],
      "noelle-rodriguez": ["Actor"],
      "vicki-rodriguez": ["Actor"]
    }
  },

  "little-light": {
    title: "Little Light",
    slug: "little-light",
    year: 2015,
    location: "NYC",
    festival: "ACTion Fest 2015: Tu a Teraz: Here and Now",
    url: "/little-light",
    posterUrl: "/posters/little-light.jpg",
    artists: {
      "tom-costello": ["Director"],
      "erin-jones": ["Lighting Design"],
      "elle-kunnos-de-voss": ["Set Design"],
      "claudia-toth": ["Stage Manager"],
      "amber-steffey": ["Assistant Stage Manager"],
      "petra-slováková": ["Road Manager"],
      "daryl-bright": ["Actor"],
      "katelynn-burns": ["Actor"],
      "lily-lipman": ["Actor"],
      "renna-wirchin": ["Actor"],
      "sydney-eberwein": ["Actor"]
    }
  },

  "a-girl": {
    title: "A Girl Without Wings",
    slug: "a-girl",
    year: 2013,
    location: "NYC",
    festival: "Off-Off-Broadway Production 2013 – IATI Theater",
    url: "/a-girl",
    posterUrl: "/posters/a-girl.jpg",
    artists: {
      "jason-williamson": ["Playwright"],
      "kathleen-amshoff": ["Director"],
      "jesse-baxter": ["Artistic Director"],
      "mary-k-baxter": ["Executive Director"],
      "maxwell-waters": ["Stage Manager"],
      "carl-wiemann": ["Lighting Design"],
      "brittany-vasta": ["Set Design"],
      "angela-harner": ["Costume Design"],
      "the-puppet-kitchen": ["Puppetry Advisor"],
      "christen-madrazo": ["Dramaturg", "Actor"],
      "thomas-burns-scully": ["Music"],
      "janice-amaya": ["Actor"],
      "mike-axelrod": ["Actor"],
      "andrew-clarke": ["Actor"],
      "ivano-pulito": ["Actor"],
      "laura-riveros": ["Actor"],
      "matt-stannah": ["Actor"]
    }
  },
    "a-girl-reading": {
    title: "A Girl Without Wings (Staged Reading)",
    slug: "a-girl-reading",
    year: 2010,
    location: "Washington, DC",
    festival: "Page-to-Stage Festival – Kennedy Center",
    url: "/a-girl-kennedy-center",
    posterUrl: "/posters/a-girl-reading.jpg",
    artists: {
      "jason-williamson": ["Playwright"],
      "kathleen-amshoff": ["Director"],
      "jesse-baxter": ["Artistic Director"],
      "david-d-mitchell": ["Artistic Director (RotM)"],
      "mary-k-baxter": ["Executive Director", "Actor"],
      "christen-madrazo": ["Dramaturg", "Actor"],
      "jon-kevin-lazarus": ["Narrator"],
      "kareem-carpenter": ["Actor"],
      "david-kellam": ["Actor"],
      "anne-letscher": ["Actor"],
      "louis-murray": ["Actor"],
      "david-winters": ["Actor"]
    }
  },

  "esperanza": {
    title: "Esperanza",
    slug: "esperanza",
    year: 2010,
    location: "NYC",
    festival: "ACTion Fest 2010 – Poco a Poco",
    url: "/esperanza",
    posterUrl: "/posters/esperanza.jpg",
    artists: {
      "jesse-baxter": ["Director", "Props & Costume Design"],
      "brittany-vasta": ["Set Design"],
      "drew-florida": ["Lighting Design"],
      "drew-ernst": ["Sound Design"],
      "gustavo-redín": ["Road Manager"],
      "alena-acker": ["Actor"],
      "dianna-beshara": ["Actor"],
      "katarina-hughes": ["Actor"],
      "maggie-thompson": ["Actor"],
      "lauren-ullrich": ["Actor"],
      "bryant-vance": ["Actor"]
    }
  },

  "hotel-millionaire": {
    title: "Hotel Millionaire",
    slug: "hotel-millionaire",
    year: 2008,
    location: "NYC",
    festival: "Performing Arts Marathon",
    url: "/hotel-millionaire",
    posterUrl: "/posters/hotel-millionaire.jpg",
    artists: {
      "kathleen-amshoff": ["Playwright", "Director", "Props, Costume and Sound Design"],
      "rachael-palmer-jones": ["Playwright", "Actor"],
      "heather-massie": ["Playwright", "Actor"],
      "katey-parker": ["Playwright", "Actor"],
      "jennifer-robideau": ["Playwright", "Actor"],
      "drew-florida": ["Lighting Design"],
      "mary-k-baxter": ["Road Manager"]
    }
  },

  "flight-360": {
    title: "Flight 360",
    slug: "flight-360",
    year: 2008,
    location: "NYC",
    festival: "Performing Arts Marathon",
    url: "/flight-360",
    posterUrl: "/posters/flight-360.jpg",
    artists: {
      "leslie-fields": ["Playwright"],
      "jesse-baxter": ["Director", "Props & Costume Design"],
      "vincent-eaton": ["Lighting & Sound Design"],
      "santi-baxter": ["Road Manager"],
      "mary-k-baxter": ["Actor"],
      "jeremy-feldman": ["Actor"],
      "rachel-martsolf": ["Actor"],
      "lydia-perez-carpenter": ["Actor"]
    }
  }
};