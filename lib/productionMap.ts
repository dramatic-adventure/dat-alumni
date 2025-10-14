export type Layout = "landscape" | "portrait";
export type TitlePosition = "bottom-left" | "bottom-center";

export interface Production {
  title: string;
  slug: string;
  year: number;
  season: number;
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
    season: 12,
    location: "Towson, MD",
    festival: "Spinal: MFA New Works in Theatre -- Towson Unversity",
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
      "clara-coslett": ["Actor"],
      "isabel-martinez": ["Actor"]
    }
  },

  "miracles-are-soft-in-the-jungle": {
    title: "Miracles are Soft in the Jungle",
    slug: "miracles-are-soft-in-the-jungle",
    year: 2017,
    season: 11,
    location: "NYC",
    festival: "ACTion Fest 2017: Juntos, Mano a Mano / Hand in Hand -- IATI Theatre",
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
      "sam-super": ["Actor"],
      "isabel-martinez": ["Actor"]
    }
  },

  "whispers-of-floreana": {
    title: "Whispers of Floreana",
    slug: "whispers-of-floreana",
    year: 2017,
    season: 11,
    location: "NYC",
    festival: "ACTion Fest 2017: Juntos, Mano a Mano / Hand in Hand -- IATI Theatre",
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
    season: 10,
    location: "NYC",
    festival: "ACTion Fest 2016: Shangaa / Shock and Awe -- IATI Theatre",
    url: "/tembo",
    posterUrl: "/posters/tembo.jpg",
    artists: {
      "candis-c-jones": ["Director"],
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
    season: 10,
    location: "NYC",
    festival: "ACTion Fest 2016: Shangaa / Shock and Awe -- IATI Theatre",
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
    season: 10,
    location: "NYC",
    festival: "ACTion Fest 2016: Shangaa / Shock and Awe -- IATI Theatre",
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
    season: 10,
    location: "NYC",
    festival: "ACTion Fest 2016: Shangaa / Shock and Awe -- IATI Theatre",
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
    season: 9,
    location: "Nitra, Slovakia",
    festival: "Workshop Production 2015 -- Divadlo Andreja Bagara",
    url: "/rebel-bird-workshop",
    posterUrl: "/posters/rebel-bird.jpg",
    artists: {
      "kathleen-amshoff": ["Director"],
      "jason-williamson": ["Resident Playwright"],
      "jesse-baxter": ["Artistic Director"],
      "mary-k-baxter": ["Executive Director"],
      "tom-costello": ["Producer"],
      "christen-madrazo": ["Dramaturg", "Narrator"],
      "dominika-siroka": ["Dramaturg"],
      "petra-slovakova": ["Interpreter"],
      "lukas-hudak": ["Actor, Musician"],
      "milan-hudak": ["Actor, Musician"],
      "jan-koky": ["Actor, Musician"],
      "igor-hudak": ["Actor"],
      "jonathan-david": ["Actor"],
      "nick-lehane": ["Actor"],
      "lucia-siposova": ["Actor"]
    }
  },

  "stop-stay-leave": {
    title: "Stop. Stay. Leave.",
    slug: "stop-stay-leave",
    year: 2015,
    season: 9,
    location: "NYC",
    festival: "ACTion Fest 2015: Tu a Teraz / Here and Now -- IATI Theatre",
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
    season: 9,
    location: "NYC",
    festival: "ACTion Fest 2015: Tu a Teraz / Here and Now -- IATI Theatre",
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
    season: 9,
    location: "NYC",
    festival: "ACTion Fest 2015: Tu a Teraz / Here and Now -- IATI Theatre",
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
      "vicki-rodriguez": ["Actor"],
      "isabel-martinez": ["Actor"]
    }
  },

  "little-light": {
    title: "Little Light",
    slug: "little-light",
    year: 2015,
    season: 9,
    location: "NYC",
    festival: "ACTion Fest 2015: Tu a Teraz / Here and Now -- IATI Theatre",
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

  "a-girl-without-wings": {
    title: "A Girl Without Wings",
    slug: "a-girl-without-wings",
    year: 2013,
    season: 8,
    location: "NYC",
    festival: "Off-Off-Broadway Production 2013 -- IATI Theater",
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
      "thomas-burns-scully": ["Musician"],
      "janice-amaya": ["Actor"],
      "mike-axelrod": ["Actor"],
      "andrew-clarke": ["Actor"],
      "ivano-pulito": ["Actor"],
      "laura-riveros": ["Actor"],
      "matt-stannah": ["Actor"]
    }
  },

       // Season 7 entry: 
 "the-cleaver-and-the-wall-an-almost-fairytale": {
    title: "The Cleaver and the Wall: An Almost Fairytale",
    slug: "the-cleaver-and-the-wall",
    year: 2013,
    season: 7,
    location: "NYC",
    festival: "ACTion Fest 2013: Hearts of Europe -- Abingdon Theatre",
    url: "",
    posterUrl: "",
    artists: {
      "jason-williamson": ["Director"],
      "": ["Set Designer"],
      "": ["Lighting Designer"],
      "": ["Sound Designer"],
      "petra-slovakova": ["Road Manager"],
      "katherine-a-uyeda": ["Actor"],
      "claudio-silva": ["Actor"],
      "brooke-hutchins": ["Actor"],
      "ashley-james": ["Actor"],
      "anna-deblassio": ["Actor"],
      "amber-finn": ["Actor"]
    }
  },
       
  "ako-david": {
    title: "Ako David",
    slug: "ako-david",
    year: 2013,
    season: 7,
    location: "NYC",
    festival: "ACTion Fest 2013: Hearts of Europe -- Abingdon Theatre",
    url: "",
    posterUrl: "",
    artists: {
      "tom-costello": ["Director"],
      "": ["Set Designer"],
      "": ["Lighting Designer"],
      "": ["Sound Designer"],
      "richard-sipos": ["Road Manager"],
      "nicholas-linnehan": ["Actor"],
      "janice-amaya": ["Actor"],
      "ivano-pulito": ["Actor"],
      "gabriel-kadian": ["Actor"],
      "anna-cherkezishvili": ["Actor"],
      "abbey-glasure": ["Actor"]
    }
  },

  "flakes": {
    title: "Flakes",
    slug: "flakes",
    year: 2013,
    season: 7,
    location: "NYC",
    festival: "ACTion Fest 2013: Hearts of Europe -- Abingdon Theatre",
    url: "",
    posterUrl: "",
    artists: {
      "kathleen-amshoff": ["Director"],
      "": ["Set Designer"],
      "": ["Lighting Designer"],
      "": ["Sound Designer"],
      "dominika-siroka": ["Road Manager"],
      "michael-axelrod": ["Actor"],
      "lacy-allen": ["Actor"],
      "claire-edmonds": ["Actor"],
      "benjamin-ridge": ["Actor"],
      "alexis-floyd": ["Actor"]
    }
  },

  "a-girl-without-wings-workshop-production": {
  title: "A Girl without Wings, Workshop Production 2012",
  slug: "a-girl-without-wings-workshop-production",
  location: "NYC",
  year: 2012,
  season: 7,
  festival: "",
  url: "",
  posterUrl: "",
  artists: {
    "paul-huelo": ["Actor"],
    "elisha-lawson": ["Actor"],
    "carmen-cabrera": ["Actor"],
    "carlo-alban": ["Actor"],
    "katey-parker": ["Actor"],
    "jason-williamson": ["Resident Playwright"],
    "christen-madrazo": ["Dramaturg", "Actor"],
    "kathleen-amshoff": ["Director"],
    "mary-k-baxter": ["Executive Director"],
    "jesse-baxter": ["Artistic Director"]
  }
},

"travelogue-season-two": {
  title: "Travelogue Season Two",
  slug: "travelogue-season-two",
  location: "Jimmys No. 43, East Village, NYC",
  year: 2012-2013,
  season: 7,
  festival: "",
  url: "",
  posterUrl: "",
  artists: {
    "jason-williamson": ["Producer"],
    "christen-madrazo": ["Producer"],
    "kathleen-amshoff": ["Producer"],
    "mary-k-baxter": ["Producer"],
    "jesse-baxter": ["Host"]
   }
},    

       // Season 6 entry:    
"travelogue-season-one": {
  title: "Travelogue Season One",
  slug: "travelogue-season-one",
  location: "Jimmys No. 43, East Village, NYC",
  year: 2011-2012,
  season: 6,
  festival: "",
  url: "",
  posterUrl: "",
  artists: {
    "jason-williamson": ["Producer"],
    "christen-madrazo": ["Producer"],
    "kathleen-amshoff": ["Producer"],
    "mary-k-baxter": ["Producer"],
    "jesse-baxter": ["Host"]
   }
},    

       // Season 5 entry:  
"a-girl-without-wings-party": {
  title: "A Girl without Wings, Staged Reading 2011 (5 Year Anniversary Party)",
  slug: "a-girl-without-wings-party",
  year: 2011,
  season: 5,
  location: "Hells Kitchen, NYC",
  festival: "5 Year Anniversary Party",
  url: "",
  posterUrl: "",
  artists: {
    "jaime-carillo": ["Actor"],
    "masha-mendieta": ["Actor"],
    "november-christine": ["Actor"],
    "katarina-hughes": ["Actor"],
    "bryant-vance": ["Actor"],
    "katey-parker": ["Actor"],
    "drew-ernst": ["Actor"],
    "jason-williamson": ["Resident Playwright"],
    "christen-madrazo": ["Actor"],
    "kathleen-amshoff": ["Assoc. Artistic Director", "Director"],
    "mary-k-baxter": ["Executive Director"],
    "jesse-baxter": ["Artistic Director"]
  }
},

    "a-girl-without-wings-reading": {
    title: "A Girl Without Wings (Staged Reading)",
    slug: "a-girl-without-wings-reading",
    year: 2010,
    season: 5,
    location: "Washington, DC",
    festival: "Page-to-Stage Festival -- Kennedy Center",
    url: "/a-girl-kennedy-center",
    posterUrl: "/posters/a-girl-reading.jpg",
    artists: {
      "jason-williamson": ["Playwright"],
      "kathleen-amshoff": ["Director"],
      "jesse-baxter": ["Artistic Director"],
      "david-d-mitchell": ["Artistic Director (RotM)"],
      "mary-k-baxter": ["Executive Director", "Actor"],
      "christen-madrazo": ["Dramaturg", "Actor"],
      "jon-kevin-lazarus": ["Actor"],
      "kareem-carpenter": ["Actor"],
      "david-kellam": ["Actor"],
      "anne-letscher": ["Actor"],
      "louis-murray": ["Actor"],
      "david-winters": ["Actor"]
    }
  },

       // Season 4 entry:  
  "enchanted-islands": {
    title: "Enchanted Islands",
    slug: "enchanted-islands",
    year: 2010,
    season: 4,
    location: "NYC",
    festival: "ACTion Fest 2010: Poco a Poco / Little by Little -- Gene Frankel Theatre",
    url: "",
    posterUrl: "",
    artists: {
      "jesse-baxter": ["Director"],
      "brittany-vasta": ["Set Designer"],
      "drew-florida": ["Lighting Designer"],
      "drew-ernst": ["Sound Designer"],
      "gustavo-redín": ["Road Manager"],
      "tamara-easton": ["Actor"],
      "natalie-hirsch": ["Actor"],
      "lauren-ullrich": ["Actor"],
      "jennifer-rodriguez": ["Actor"],
      "jamie-blanek": ["Actor"],
      "garrett-bales": ["Actor"],
      "adam-griffith": ["Actor"]
    }
  },

  "esmeraldas-dumbshow": {
    title: "Esmeraldas Dumbshow",
    slug: "esmeraldas-dumbshow",
    year: 2010,
    season: 4,
    location: "NYC",
    festival: "ACTion Fest 2010: Poco a Poco / Little by Little -- Gene Frankel Theatre",
    url: "",
    posterUrl: "",
    artists: {
      "kathleen-amshoff": ["Director"],
      "brittany-vasta": ["Set Designer"],
      "drew-florida": ["Lighting Designer"],
      "drew-ernst": ["Sound Designer"],
      "": ["Road Manager"],
      "kaitlin-hernandez": ["Actor"],
      "jnelle-bobb-semple": ["Actor"],
      "heather-ichihashi": ["Actor"],
      "hanniel-sindelar": ["Actor"],
      "courtney-dusenberry": ["Actor"]
    }
  },

    "esperanza": {
    title: "Esperanza",
    slug: "esperanza",
    year: 2010,
    season: 4,
    location: "NYC",
    festival: "ACTion Fest 2010: Poco a Poco / Little by Little -- Gene Frankel Theatre",
    url: "/esperanza",
    posterUrl: "/posters/esperanza.jpg",
    artists: {
      "jesse-baxter": ["Director"],
      "brittany-vasta": ["Set Designer"],
      "drew-florida": ["Lighting Designer"],
      "drew-ernst": ["Sound Designer"],
      "gustavo-redín": ["Road Manager"],
      "alena-acker": ["Actor"],
      "dianna-beshara": ["Actor"],
      "katarina-hughes": ["Actor"],
      "maggie-thompson": ["Actor"],
      "lauren-ullrich": ["Actor"],
      "bryant-vance": ["Actor"],
      "isabel-martinez": ["Actor"]
    }
  },

      // Season 3 entry:
  "backpack-musical": {
    title: "Backpack Musical",
    slug: "backpack-musical",
    year: 2009,
    season: 3,
    location: "NYC",
    festival: "Performing Arts Marathon 2009 -- IATI Theatre; ACTion Fest 2009: Hecho en Ecuador / Made in Ecuador -- Richmond Shepard Theatre",
    url: "",
    posterUrl: "",
    artists: {
      "jim-knipple": ["Director"],
      "sarah-benjamin": ["Actor"],
      "nemuna-ceesay": ["Actor"],
      "solia-martinez-jacobs": ["Actor"],
      "cj-lassiter": ["Actor"],
      "katie-montoya": ["Actor"],
      "kara-wang": ["Actor"],
      "randyll-wendl": ["Actor"],
      "adrienne-wheeler": ["Actor"],
      "kathy-yamamoto": ["Actor"],
      "drew-florida": ["Lighting Designer"],
      "kim-braun": ["Production Stage Manager"],
      "kaitlin-kauffman": ["Assistant Stage Manager"],
      "": ["Road Manager"]
    }
  },

  "flight-of-the-condors": {
    title: "Flight of the Condors",
    slug: "flight-of-the-condors",
    year: 2009,
    season: 3,
    location: "NYC",
    festival: "Performing Arts Marathon 2009 -- IATI Theatre; ACTion Fest 2009: Hecho en Ecuador / Made in Ecuador -- Richmond Shepard Theatre",
    url: "",
    posterUrl: "",
    artists: {
      "rachel-wiese": ["Director"],
      "amanda-cortinas": ["Actor"],
      "claire-harkey": ["Actor"],
      "lisa-younger": ["Actor"],
      "drew-florida": ["Lighting Designer"],
      "kim-braun": ["Production Stage Manager"],
      "kaitlin-kauffman": ["Assistant Stage Manager"],
      "maria-isabel-rojas": ["Road Manager"]
    }
  },

  "hotel-millionaire": {
    title: "Hotel Millionaire",
    slug: "hotel-millionaire",
    year: 2009,
    season: 3,
    location: "NYC",
    festival: "Performing Arts Marathon 2009 -- IATI Theatre; ACTion Fest 2009: Hecho en Ecuador / Made in Ecuador -- Richmond Shepard Theatre",
    url: "/hotel-millionaire",
    posterUrl: "/posters/hotel-millionaire.jpg",
    artists: {
      "kathleen-amshoff": ["Assoc. Artistic Director", "Director"],
      "rachael-palmer-jones": ["Actor"],
      "heather-massie": ["Actor"],
      "katey-parker": ["Actor"],
      "jennifer-robideau": ["Actor"],
      "drew-florida": ["Lighting Designer"],
      "kim-braun": ["Production Stage Manager"],
      "kaitlin-kauffman": ["Assistant Stage Manager"],
      "mary-k-baxter": ["Road Manager"]
    }
  },

  "miente-de-nino": {
    title: "Miente de Niño",
    slug: "miente-de-nino",
    year: 2009,
    season: 3,
    location: "NYC",
    festival: "Performing Arts Marathon 2009 -- IATI Theatre; ACTion Fest 2009: Hecho en Ecuador / Made in Ecuador -- Richmond Shepard Theatre",
    url: "",
    posterUrl: "",
    artists: {
      "drew-ernst": ["Director"],
      "liz-baessler": ["Actor"],
      "katie-clark": ["Actor"],
      "jon-kevin-lazarus": ["Actor"],
      "blaine-patagoc": ["Actor"],
      "hilary-white": ["Actor"],
      "drew-florida": ["Lighting Designer"],
      "kim-braun": ["Production Stage Manager"],
      "kaitlin-kauffman": ["Assistant Stage Manager"],
      "gustavo-redin": ["Road Manager"]
    }
  },

  "piranhas": {
    title: "Piranhas",
    slug: "piranhas",
    year: 2009,
    season: 3,
    location: "NYC",
    festival: "Performing Arts Marathon 2009 -- IATI Theatre; ACTion Fest 2009: Hecho en Ecuador / Made in Ecuador -- Richmond Shepard Theatre",
    url: "",
    posterUrl: "",
    artists: {
      "michael-rau": ["Director"],
      "regina-gibson": ["Actor"],
      "gillian-hurst": ["Actor"],
      "mary-notari": ["Actor"],
      "maren-uecker": ["Actor"],
      "drew-florida": ["Lighting Designer"],
      "kim-braun": ["Production Stage Manager"],
      "kaitlin-kauffman": ["Assistant Stage Manager"],
      "": ["Road Manager"]
    }
  },

  "preaching-oil": {
    title: "Preaching Oil",
    slug: "preaching-oil",
    year: 2009,
    season: 3,
    location: "NYC",
    festival: "Performing Arts Marathon 2009 -- IATI Theatre; ACTion Fest 2009: Hecho en Ecuador / Made in Ecuador -- Richmond Shepard Theatre",
    url: "",
    posterUrl: "",
    artists: {
      "jamil-mangan": ["Assoc. Artistic Director, Director"],
      "vince-eaton": ["Actor"],
      "jacob-hellman": ["Actor"],
      "elizabeth-irwin": ["Actor"],
      "janel-miley": ["Actor"],
      "tiffany-may": ["Actor"],
      "eugene-michael-santiago": ["Actor"],
      "amy-e-witting": ["Actor"],
      "drew-florida": ["Lighting Designer"],
      "kim-braun": ["Production Stage Manager"],
      "kaitlin-kauffman": ["Assistant Stage Manager"],
      "": ["Road Manager"]
    }
  },

  "set-in-clay": {
    title: "Set in Clay",
    slug: "set-in-clay",
    year: 2009,
    season: 3,
    location: "NYC",
    festival: "Performing Arts Marathon 2009 -- IATI Theatre; ACTion Fest 2009: Hecho en Ecuador / Made in Ecuador -- Richmond Shepard Theatre",
    url: "",
    posterUrl: "",
    artists: {
      "jason-williamson": ["Director"],
      "elizabeth-mckinney": ["Assistant Director"],
      "katie-merkel": ["Assistant Director"],
      "natalie-benally": ["Actor"],
      "sarah-cronk": ["Actor"],
      "jessica-emerson": ["Actor"],
      "caitlin-green": ["Actor"],
      "drew-florida": ["Lighting Designer"],
      "kim-braun": ["Production Stage Manager"],
      "kaitlin-kauffman": ["Assistant Stage Manager"],
      "": ["Road Manager"]
    }
  },

  "to-the-universe": {
    title: "To the Universe",
    slug: "to-the-universe",
    year: 2009,
    season: 3,
    location: "NYC",
    festival: "Performing Arts Marathon 2009 -- IATI Theatre; ACTion Fest 2009: Hecho en Ecuador / Made in Ecuador -- Richmond Shepard Theatre",
    url: "",
    posterUrl: "",
    artists: {
      "jamil-mangan": ["Director"],
      "lulu-fogarty": ["Actor"],
      "tzena-nicole": ["Actor"],
      "zoe-reiniger": ["Actor"],
      "michelle-santagate": ["Actor"],
      "jeanne-lauren-smith": ["Actor"],
      "mady-spiegel": ["Actor"],
      "josimar-tulloch": ["Actor"],
      "drew-florida": ["Lighting Designer"],
      "kim-braun": ["Production Stage Manager"],
      "kaitlin-kauffman": ["Assistant Stage Manager"],
      "": ["Road Manager"]
    }
  },

  "wet-paint": {
    title: "Wet Paint",
    slug: "wet-paint",
    year: 2009,
    season: 3,
    location: "NYC",
    festival: "Performing Arts Marathon 2009 -- IATI Theatre; ACTion Fest 2009: Hecho en Ecuador / Made in Ecuador -- Richmond Shepard Theatre",
    url: "",
    posterUrl: "",
    artists: {
      "erin-mcbride-africa": ["Director"],
      "rob-salas": ["Director"],
      "mikkei-fritz": ["Assistant Director"],
      "byron-arreola": ["Assistant Director"],
      "melissa-dunham": ["Assistant Director"],
      "rebecca-aranda": ["Actor"],
      "gia-battista": ["Actor"],
      "alexa-green": ["Actor"],
      "rachel-gross": ["Actor"],
      "liz-nelson": ["Actor"],
      "carla-neuss": ["Actor"],
      "kaylee-mae-tucker": ["Actor"],
      "drew-florida": ["Lighting Designer"],
      "kim-braun": ["Production Stage Manager"],
      "kaitlin-kauffman": ["Assistant Stage Manager"],
      "": ["Road Manager"]
    }
  },

        // Season 2 entry:
  "flight-360": {
    title: "Flight 360",
    slug: "flight-360",
    year: 2008,
    season: 2,
    location: "NYC",
    festival: "Off-Off-Broadway Production 2008 -- Red Room Theater; Performing Arts Marathon 2008 -- IATI Theatre", 
    url: "/flight-360",
    posterUrl: "/posters/flight-360.jpg",
    artists: {
      "leslie-fields": ["Playwright"],
      "jesse-baxter": ["Director"],
      "vincent-eaton": ["Lighting Designer", "Sound Designer"],
      "santi-baxter": ["Road Manager"],
      "mary-k-baxter": ["Actor"],
      "jeremy-feldez": ["Actor"],
      "rachel-wiese": ["Actor"],
      "lydia-feldez": ["Actor"],
      "isabel-martinez": ["Actor"]
    }
  },

          // Season 1 entry:
"voices-from-zimbabwe": {
    title: "Voices from Zimbabwe",
    slug: "voices-from-zimbabwe",
    year: 2007,
    season: 1,
    location: "Baltimore, Pittsburgh, Rochester",
    festival: "North East US Tour",
    url: "",
    posterUrl: "",
    artists: {
      "oscar-manzini": ["Road Manager"],
      "lisa-bearpark": ["Actor"],
      "kathleen-amshoff": ["Director"],
      "mary-k-baxter": ["Actor"],
      "jesse-baxter": ["Actor"]
    }
  }
};