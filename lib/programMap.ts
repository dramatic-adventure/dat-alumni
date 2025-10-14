// lib/programMap.ts

export interface ProgramArtist {
  slug: string;
  role: string;
}

export interface ProgramData {
  title: string; // ✅ ADD THIS
  slug: string;
  program: string;
  location: string;
  year: number;
  season: number;
  url?: string;
  artists: {
    [slug: string]: string[]
  };
  color?: string;
  stampIcon?: string;
}


export const programMap: Record<string, ProgramData> = {
       // Season 20 entry: 

       // Season 19 entry:
"creative-trek-ecuador-2025": {
  title: "Creative Trek: Ecuador (refresh) 2025",
  slug: "creative-trek-ecuador-2025",
  program: "Creative Trek",
  location: "Ecuador",
  year: 2025,
  season: 19,
  url: "/creative-trek",
  artists: {
    "jesse-baxter": ["Artistic Director"]
  }
},

       // Season 18 entry:
"teaching-artist-residency-slovakia-2024": {
  title: "Teaching Artist Residency: Slovakia 2024",
  slug: "teaching-artist-residency-slovakia-2024",
  program: "Teaching Artist Residency",
  location: "Slovakia",
  year: 2024,
  season: 18,
  url: "/residencies",
  artists: {
    "christen-madrazo": ["Director of Creative Learning, Teaching Artist"],
    "jason-williamson": ["Resident Playwright, Teaching Artist"],
    "asa-williamson": ["Artist Apprentice"],
    "vida-williamson": ["Artist Apprentice"],
  }
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
    "jason-williamson": ["Resident Playwright", "Director", "Teaching Artist"],
    "christen-madrazo": ["Director of Creative Learning", "Teaching Artist"],
    "kathleen-amshoff": ["Assoc. Artistic Director"],
    "mary-k-baxter": ["Executive Director"],
    "jesse-baxter": ["Artistic Director"],
    "asa-williamson": ["Artist Apprentice"],
    "vida-williamson": ["Artist Apprentice"],
    "lucille-baxter": ["Artist Apprentice"],
    "seamus-baxter": ["Artist Apprentice"],
    "greta-amshoff-brenner": ["Artist Apprentice"],
    "isaiah-amshoff-brenner": ["Artist Apprentice"]
   }
},    

"micro-adventure-hudson-valley-derive-2023": {
  title: "Micro-Adventure: Hudson Valley Dérive 2023",
  slug: "micro-adventure-2023",
  program: "Micro-Adventure",
  location: "Hudson Valley",
  year: 2023,
  season: 18,
  url: "",
  artists: {
    "claudia-toth": ["Artist"],
    "christen-madrazo": ["Artist"],
    "jason-williamson": ["Artist"],
    "mary-k-baxter": ["Artist"],
    "jesse-baxter": ["Artist"],
    "asa-williamson": ["Artist Apprentice"],
    "vida-williamson": ["Artist Apprentice"],
    "lucille-baxter": ["Artist Apprentice"],
    "seamus-baxter": ["Artist Apprentice"]
  }
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
    "vida-williamson": ["Artist Apprentice"]
  }
},

       // Season 16 entry: 
       // Season 15 entry: 
       // Season 14 entry: 
       // Season 13 entry: 
       // Season 12 entry: 
       // Season 11 entry: 
       // Season 10 entry: 
       // Season 9 entry: 
       // Season 8 entry: 


       // Season 7 entry: 
"action-heart-of-europe-2013": {
  title: "ACTion: Heart of Europe 2013",
  slug: "action-heart-of-europe-2013",
  program: "ACTion",
  location: "Heart of Europe",
  year: 2013,
  season: 7,
  url: "/action",
  artists: {
    "tom-costello": ["Director"],
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
    "jason-williamson": ["Resident Playwright", "Director", "Teaching Artist"],
    "christen-madrazo": ["Director of Creative Learning", "Teaching Artist"],
    "kathleen-amshoff": ["Assoc. Artistic Director", "Director", "Teaching Artist"],
    "mary-k-baxter": ["Executive Director"],
    "jesse-baxter": ["Artistic Director", "Teaching Artist"]
  }
},

       // Season 6 entry:   
"creative-trek-slovakia-2012": {
  title: "Creative Trek: Slovakia 2012",
  slug: "creative-trek-slovakia-2012",
  program: "Creative Trek",
  location: "Slovakia",
  year: 2012,
  season: 6,
  url: "/creative-trek",
  artists: {
    "richard-sipos": ["Road Manager"],
    "lisa-kramer": ["Writer"],
    "jacob-hellman": ["Actor"],
    "elizabeth-mckinney": ["Actor"],
    "jason-williamson": ["Resident Playwright", "Teaching Artist"],
    "christen-madrazo": ["Director of Creative Learning", "Teaching Artist"],
    "mary-k-baxter": ["Executive Director", "Teaching Artist"],
    "jesse-baxter": ["Artistic Director", "Teaching Artist"]
  }
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
    "jason-williamson": ["Resident Playwright", "Director", "Teaching Artist"],
    "christen-madrazo": ["Director of Creative Learning", "Teaching Artist"],
    "kathleen-amshoff": ["Assoc. Artistic Director"],
    "mary-k-baxter": ["Executive Director"],
    "jesse-baxter": ["Artistic Director"]
   }
},        
 
       // Season 5 entry:      
"teaching-artist-residency-ecuador-2011": {
  title: "Teaching Artist Residency: Esmeraldas, Ecuador 2011",
  slug: "teaching-artist-residency-ecuador-2011",
  program: "Teaching Artist Residency",
  location: "Esmeraldas, Ecuador",
  year: 2011,
  season: 5,
  url: "/residencies",
  artists: {
    "isabel-martinez": ["Actor"],
    "dionne-audain": ["Teaching Artist"],
    "mabel-demera-grijalva": ["Road Manager"],
    "hanniel-sindelar": ["Teaching Artist"],
    "kathleen-amshoff": ["Assoc. Artistic Director", "Teaching Artist"],
    "mary-k-baxter": ["Executive Director", "Teaching Artist"],
    "jesse-baxter": ["Artistic Director", "Teaching Artist"]
  }
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
    "jason-williamson": ["Resident Playwright", "Director", "Teaching Artist"],
    "christen-madrazo": ["Director of Creative Learning", "Teaching Artist"],
    "kathleen-amshoff": ["Assoc. Artistic Director"],
    "mary-k-baxter": ["Executive Director"],
    "jesse-baxter": ["Artistic Director"]
   }
},   

       // Season 4 entry:
"action-ecuador-2010": {
  title: "ACTion: Ecuador 2010",
  slug: "action-ecuador-2010",
  program: "ACTion",
  location: "Ecuador",
  year: 2010,
  season: 4,
  url: "/action",
  artists: {
    "katarina-hughes": ["Actor"],
    "tamara-easton": ["Actor"],
    "natalie-hirsch": ["Actor"],
    "maggie-thompson": ["Actor"],
    "lauren-ullrich": ["Actor"],
    "kaitlin-hernandez": ["Actor"],
    "jnelle-bobb-semple": ["Actor"],
    "jennifer-rodriguez": ["Actor"],
    "jamie-blanek": ["Actor"],
    "heather-ichihashi": ["Actor"],
    "hanniel-sindelar": ["Actor"],
    "garrett-bales": ["Actor"],
    "diana-beshara": ["Actor"],
    "courtney-dusenberry": ["Actor"],
    "bryant-vance": ["Actor"],
    "alena-acker": ["Actor"],
    "adam-griffith": ["Actor"],
    "gustavo-redin": ["Manager of Community Partnerships in Ecuador", "Road Manager", "Teaching Artist"],
    "jason-williamson": ["Resident Playwright", "Director", "Teaching Artist"],
    "christen-madrazo": ["Director of Creative Learning", "Teaching Artist"],
    "tim-baxter": ["Road Manager"],
    "kathleen-amshoff": ["Associate Artistic Director", "Director", "Teaching Artist"],
    "mary-k-baxter": ["Executive Director", "Teaching Artist"],
    "jesse-baxter": ["Artistic Director", "Director", "Teaching Artist"]
  }
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
    "jason-williamson": ["Resident Playwright", "Director", "Teaching Artist"],
    "christen-madrazo": ["Director of Creative Learning", "Teaching Artist"],
    "kathleen-amshoff": ["Assoc. Artistic Director"],
    "mary-k-baxter": ["Executive Director"],
    "jesse-baxter": ["Artistic Director"]
  }
},

// Season 3 entry:
"action-ecuador-2009": {
  title: "ACTion: Ecuador 2009",
  slug: "action-ecuador-2009",
  program: "ACTion",
  location: "Ecuador",
  year: 2009,
  season: 3,
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
    "jamil-mangan": ["Director"],
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
    "santi-baxter": ["Road Manager"],
    "kathleen-amshoff": ["Director"],
    "mary-k-baxter": ["Executive Director"],
    "jesse-baxter": ["Artistic Director"],
  }
},

      // Season 2 entry:
  "creative-trek-ecuador-2008": {
  title: "Creative Trek: Ecuador 2008",
  slug: "creative-trek-ecuador-2008",
  program: "Creative Trek",
  location: "Ecuador",
  year: 2008,
  season: 2,
  url: "/creative-trek",
  artists: {
    "rachel-wiese": ["Actor"],
    "lydia-feldez": ["Actor"],
    "leslie-fields": ["Playwright"],
    "jeremy-feldez": ["Actor"],
    "santi-baxter": ["Road Manager"],
    "mary-k-baxter": ["Executive Director", "Actor"],
    "jesse-baxter": ["Artistic Director", "Director"],
  }
},

          // Season 1 entry:
      "creative-trek-zimbabwe-2007": {
  title: "Creative Trek: Zimbabwe 2007",
  slug: "creative-trek-zimbabwe-2007",
  program: "Creative Trek",
  location: "Zimbabwe",
  year: 2007,
  season: 1,
  url: "/creative-trek",
  artists: {
    "isabel-martinez": ["Actor"],
    "oscar-manzini": ["Road Manager"],
    "lisa-bearpark": ["Actor"],
    "kathleen-amshoff": ["Assoc. Artistic Director", "Director"],
    "mary-k-baxter": ["Executive Director", "Actor"],
    "jesse-baxter": ["Artistic Director", "Actor"],
  }
}};
