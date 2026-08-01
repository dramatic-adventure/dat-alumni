// lib/events/season-20.ts
// ─────────────────────────────────────────────────────────────────────────────
// SEASON 20 EVENTS  ·  September 2025 – August 2026
// ─────────────────────────────────────────────────────────────────────────────
// Upcoming events whose date falls in DAT Season 20 (Sept–Aug; Season 1 = 2006).
// Records only — the DatEvent type and all helper logic live in lib/events.ts,
// which imports this array. Ordered by date. See SEASON_TEMPLATE.ts to add one.
// ─────────────────────────────────────────────────────────────────────────────

import type { DatEvent } from "@/lib/events";

/**
 * Hide this ENTIRE season until it's ready to go live.
 * Set to `true` and every Season 20 event disappears from the site (no listings,
 * no detail pages) regardless of each event's own `hidden` flag. Set back to
 * `false` (or leave as-is) to publish the season.
 *
 * To hide just ONE event instead, set `hidden: true` on that event below.
 */
export const season20Hidden = false;

export const season20Events: DatEvent[] = [

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
    hidden: true
  },

  {
    id: "regiony-festival-hradec-kralove-2026",
    title: "DAT at REGIONY — Hradec Králové",
    subtitle: "An Associate Artistic Director Residency — Puppetry, Partnerships & NYU Prague",
    category: "festival",
    status: "upcoming",
    date: "2026-06-16",
    endDate: "2026-06-24",
    venue: "REGIONY International Theatre Festival · Drak & Klicpera Theatres",
    city: "Hradec Králové",
    country: "Czech Republic",
    description:
      "DAT travels to the Czech Republic for REGIONY, the country's largest international theatre festival and a home of legendary Czech puppetry. Resident Playwright & Associate Artistic Director Jason Williamson scouts new work and deepens DAT's partnerships — including with NYU's Global Media Lab and NYU Prague.",
    longDescription:
      "REGIONY is the largest theatre showcase in the Czech Republic — an international festival in Hradec Králové co-created by the Klicpera Theatre, the world-renowned Drak Theatre, and kontrapunkt. Founded in 1958, Drak helped shape the course of Czech and global puppetry, and each summer REGIONY fills the city's venues and public squares with puppet theatre, devised and visual work, dance, and immersive performance — much of it reaching Czech audiences for the very first time.\n\nBased out of Prague, DAT's Resident Playwright and Associate Artistic Director Jason Williamson travels to the 31st edition of the festival to immerse himself in the international puppetry circuit: studying technique and devising methods, meeting companies and artists, and tracking the collaborators who could shape DAT's next work.\n\nThe trip also strengthens DAT's cross-institutional ties. As a member of NYU's Global Media Lab, Jason bridges DAT's field practice with academic research and the NYU Prague community — connecting a festival rooted in puppetry tradition with the kind of exchange that turns a visit into a lasting partnership. Follow along for dispatches from the Czech Republic, and reach out if you'll be in Prague or Hradec Králové and want to connect.",
    image: "/images/theatre/archive/agwow-condor.webp",
    ticketUrl: "https://www.festivalregiony.cz/?lang=en",
    ticketPrice: "Many events free · festival programme ticketed",
    ticketType: "free",
    featured: true,
    tags: ["Czech Republic", "Hradec Králové", "Prague", "puppetry", "REGIONY", "Drak Theatre", "scouting", "partnerships", "NYU Global Media Lab", "NYU Prague", "international"],
    artistNote:
      "Puppetry is where DAT's storytelling has always come most alive — from A Girl Without Wings to the work ahead. Drak and REGIONY are where the form's deepest traditions and its boldest experiments share the same stage. That's exactly where I want to be listening.",
    artistNoteBy: "Jason Williamson, Resident Playwright & Associate Artistic Director",
    donateLink: "/donate",
    impactBlurb:
      "Every partnership DAT builds at festivals like REGIONY — and through ties with institutions like NYU's Global Media Lab and NYU Prague — becomes a future co-production, residency, or community collaboration. Your support is what lets us show up, scout, and turn connections into the next adventure.",
    contactEmail: "hello@dramaticadventure.com",
  },

  {
    id: "zemplinska-teplica-community-showcase-2026",
    title: "Community Showcase",
    subtitle: "Zemplínska Teplica Ensemble",
    category: "performance",
    subcategory: "community-showcase",
    status: "upcoming",
    date: "2026-07-23",
    time: "5:00 PM",
    venue: "TBD",
    city: "Zemplínska Teplica",
    country: "Slovakia",
    dramaClubs: ["zt-youth-ensemble"],
    description:
      "A community showcase featuring the young artists of DAT’s Zemplínska Teplica Ensemble in an evening of performance, storytelling, and celebration.",
    longDescription:
      "This community showcase brings together young artists from DAT’s Zemplínska Teplica Ensemble for an evening of performance, storytelling, and connection. Created through workshops, collaboration, and community-based theatre-making, the event celebrates the creativity, courage, and collective spirit of these young artists while honoring the relationships built in their community. Join us for a joyful gathering that highlights the power of young people finding their voice through theatre.",
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
      "Zemplínska Teplica",
    ],
    contactEmail: "hello@dramaticadventure.com",
  },

  {
    id: "lunik-ix-community-showcase-2026",
    title: "Community Showcase",
    subtitle: "Luník IX Collective",
    category: "performance",
    subcategory: "community-showcase",
    status: "upcoming",
    date: "2026-07-24",
    time: "8:00 PM",
    venue: "TBD",
    city: "Luník IX",
    country: "Slovakia",
    dramaClubs: ["lunik-ix-collective"],
    description:
      "A community showcase featuring the young artists of DAT’s Luník IX Collective in an evening of performance, storytelling, and celebration.",
    longDescription:
      "This community showcase brings together young artists from DAT’s Luník IX Collective for an evening of performance, storytelling, and connection. Created through workshops, collaboration, and community-based theatre-making, the event celebrates the creativity, courage, and collective spirit of these young artists while honoring the relationships built in their community. Join us for a joyful gathering that highlights the power of young people finding their voice through theatre.",
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
    ],
    contactEmail: "hello@dramaticadventure.com",
  },

  {
    id: "water-that-wanders",
    previousIds: [
      "the-consequence-of-meeting-kosice-2026",
      "water-that-wanders-kosice-2026",
    ],
    title: "Water that Wanders",
    subtitle: "US, Slovak, and Romani artists join hands to step into waters less known",
    category: "performance",
    // No `subcategory: "benefit"` — that only exists to swap the eyebrow to
    // "Benefit Event"; without it the page uses the standard "Live Theatre".
    status: "upcoming",
    date: "2026-08-01",
    time: "7:00 PM",
    doors: "6:30 PM",
    runtime: "Approx. 2 hours",
    venue: "Divadlo na Peróne",
    venueUrl: "https://www.facebook.com/divadlonaperone",
    city: "Košice",
    country: "Slovakia",
    language: "Performed in English, Slovak, and Romani",
    accessibility: "In-person performance",
    dramaClubs: ["zt-youth-ensemble", "lunik-ix-collective"],
    image: "/posters/water-that-wanders.jpeg",
    description:
      "US, Slovak, and Romani artists unite to share this eclectic evening of work in progress. Theatre, storytelling, and poetry fuse as we explore the confluence of lived experience that happens when people from different worlds join hands and step together into waters less known.",
    longDescription:
      "US, Slovak, and Romani artists unite to share this eclectic evening of work in progress. Theatre, storytelling, and poetry fuse as we explore the confluence of lived experience that happens when people from different worlds join hands and step together into waters less known.\n\n" +
      "Dramatic Adventure Theatre (DAT) is excited to continue its 14-year collaboration with ETP Slovensko, which began in 2012 and has since spanned many devised theatre projects in Roma settlements throughout Eastern Slovakia. Water that Wanders represents a new step in our relationship as we co-produce this theatrical collage that gives Košice audiences a window into DAT’s creative process. The creative articulations we’ll share represent new ideas, raw impressions, and fresh remembrances, inspired by our recent three-week project in Slovakia that included work with Roma youth in Zemplínska Teplica and Luník IX, as well as artistic jam sessions with local Slovak theatre artists.\n\n" +
      "This is the closing night of [PASSAGE: Slovakia](https://www.dramaticadventure.com/passage), and a friend-raiser for ETP Slovensko. Come see what three weeks made, then stay and talk with the company afterward. Teachers, youth workers, artists, neighbors, and the plain curious are all welcome. Admission is free, and anything you give goes straight to ETP’s work with kids and families in Eastern Slovakia.",
    // Company roster is built live from programMap — add an artist to either
    // program and they appear here (with headshot + profile link) automatically.
    companyPrograms: ["passage-slovakia-2026", "dat-lab-kosice-2026"],
    // Junior Field Artists are kept off the public roster; their PASSAGE credit
    // in programMap is unchanged.
    companyExclude: ["asa-madrazo-williamson", "vida-madrazo-williamson"],
    companyLabel: "The Company",
    partners: [
      {
        name: "ETP Slovensko",
        href: "https://etp.sk",
        type: "community",
        logoSrc: "/images/partners/etp-slovensko.jpg",
        logoAlt: "ETP Slovensko",
      },
      {
        name: "Divadlo na Peróne",
        href: "https://www.facebook.com/divadlonaperone",
        type: "artistic",
      },
    ],
    // Themes must already exist on a production — /theme/[slug] is built from
    // productionDetailsMap and 404s otherwise.
    themes: ["Belonging", "Memory", "Cultural Identity"],
    // Taxonomy ids from lib/causes.ts; the two linked drama clubs carry the
    // same causes, so each pill lands on a populated /cause page.
    causes: [
      {
        label: "Anti-racism",
        category: "social-justice-human-rights-equity",
        subcategory: "anti-racism",
      },
      {
        label: "Poverty reduction & social inclusion",
        category: "social-justice-human-rights-equity",
        subcategory: "poverty-reduction-social-inclusion",
      },
      {
        label: "Narrative justice",
        category: "arts-culture-storytelling-representation",
        subcategory: "narrative-justice",
      },
      {
        label: "Cross-cultural solidarity",
        category: "arts-culture-storytelling-representation",
        subcategory: "cross-cultural-exchange-solidarity",
      },
      {
        label: "Arts education access",
        category: "education-access-equity-opportunity",
        subcategory: "arts-education-access",
      },
    ],
    resources: [
      {
        label: "Facebook event — Water that Wanders",
        href: "https://www.facebook.com/events/1458829016003103",
      },
      {
        label: "PASSAGE: Slovakia",
        href: "https://www.dramaticadventure.com/passage",
      },
      {
        label: "ETP Slovensko",
        href: "https://etp.sk",
      },
    ],
    // Programme for the evening. Each piece carries its own author, which is
    // how individual authorship stays visible in a collage — the roster below
    // deliberately does not repeat "Writer" on everyone.
    runningOrder: [
      {
        title: "Teme mamo adarik Džav",
        titleAlt: "Keď ja mamko tadiaľ idem · Look mom, I’m going this way",
        by: [{ name: "Lukáš Hudák", href: "/alumni/lukas-hudak" }],
      },
      {
        title: "Všímaj si",
        titleAlt: "Observe",
        by: [
          { name: "Jana Štafurová", href: "/alumni/jana-stafurova" },
          { name: "Alica Hingisová", href: "/alumni/alica-hingisova" },
          { name: "Jakub Muranský", href: "/alumni/jakub-muransky" },
          { name: "Jesse Baxter", href: "/alumni/jesse-baxter" },
        ],
      },
      {
        title: "Som Voda",
        titleAlt: "I am water",
        by: [{ name: "Jana Štafurová", href: "/alumni/jana-stafurova" }],
      },
      {
        title: "The Farm",
        titleAlt: "Farma",
        by: [{ name: "Adrián Pica Borjas", href: "/alumni/adrian-pica-borjas" }],
        contributors: [
          {
            role: "Movement",
            people: [{ name: "Jakub Muranský", href: "/alumni/jakub-muransky" }],
          },
        ],
      },
      {
        title: "Church Crawl",
        titleAlt: "Putovanie po kostoloch",
        by: [{ name: "Christina Greene", href: "/alumni/christina-greene" }],
      },
      {
        title: "Paňi panori čhajori romaňi",
        titleAlt: "Pri vodičke rómske dievčatko · Sweet little Romani girl near lovely waters",
        by: [{ name: "Lukáš Hudák", href: "/alumni/lukas-hudak" }],
      },
      {
        title: "Vnímaj",
        titleAlt: "Notice",
        by: [
          { name: "Jana Štafurová", href: "/alumni/jana-stafurova" },
          { name: "Alica Hingisová", href: "/alumni/alica-hingisova" },
          { name: "Jakub Muranský", href: "/alumni/jakub-muransky" },
          { name: "Jesse Baxter", href: "/alumni/jesse-baxter" },
        ],
      },
      {
        title: "Kúpalisko",
        titleAlt: "The Pool",
        by: [{ name: "Tatiana Kuková", href: "/alumni/tatiana-kukova" }],
      },
      {
        title: "Spojenie",
        titleAlt: "Connection",
        by: [{ name: "Barbora Ćurejová", href: "/alumni/barbora-curejova" }],
        contributors: [
          {
            role: "Puppetry",
            people: [
              { name: "Jana Štafurová", href: "/alumni/jana-stafurova" },
              { name: "Alica Hingisová", href: "/alumni/alica-hingisova" },
            ],
          },
        ],
      },
      {
        title: "Nane cocha nane gad",
        titleAlt: "Nie je sukňa nie sú šaty · No skirt, no dress",
        by: [{ name: "Lukáš Hudák", href: "/alumni/lukas-hudak" }],
      },
      {
        title: "The Water that Wanders",
        titleAlt: "Voda, ktorá vandruje",
        by: [{ name: "The Company" }],
      },
    ],
    artistNote:
      "Poor water has no speech / With which she could talk or sing, / Only sometimes she whispers / A silver splash like a heartbeat. / A heartbeat of speaking water. / But the water does not look behind. / It flees, runs farther away, / Where eyes will not see her — / The water that wanders.",
    artistNoteBy: "Papusza, “Water That Wanders”",
    impactBlurb:
      "This event supports ETP Slovensko, DAT’s community partner in Eastern Slovakia. Through education, mentorship, community development, and long-term local engagement, ETP Slovensko works with children, families, and communities to expand opportunity and strengthen pathways forward. Your attendance, donation, or sponsorship helps support this vital work while also making space for artists and communities to gather through story, performance, and creative exchange. All donations and event proceeds benefit ETP Slovensko.",
    donateLink: "https://etp.darujme.sk/3601/",
    ticketPrice: "Free admission · donations welcome",
    ticketType: "free",
    featured: true,
    tags: [
      "bilingual",
      "benefit",
      "co-production",
      "ETP Slovensko",
      "Divadlo na Peróne",
      "PASSAGE",
      "DAT Lab",
      "Papusza",
      "Slovakia",
      "Košice",
    ],
    contactEmail: "hello@dramaticadventure.com",
    defaultLang: "en",
    translations: {
      sk: {
        title: "Voda, ktorá vandruje",
        subtitle: "Komunitný večer s divadlom",
        description:
          "Inšpirovaní poľsko-rómskou poetkou Papuszou a jej básňou Pani, so tradeł (Voda, ktorá vandruje) a nemenej inšpirovaní zážitkami z poznávania Slovenska sme vytvorili divadelný cestopisný zážitok, ktorý vám zahráme v rámci tohto komunitného večera.",
        longDescription:
          "Inšpirovaní poľsko-rómskou poetkou Papuszou a jej básňou Pani, so tradeł (Voda, ktorá vandruje) a nemenej inšpirovaní zážitkami z poznávania Slovenska sme vytvorili divadelný cestopisný zážitok, ktorý vám zahráme v rámci tohto komunitného večera.\n\n" +
          "Pozývame vás na priateľské stretnutie a záverečné predstavenie projektu [PASSAGE: Slovakia](https://www.dramaticadventure.com/passage), ktorý prepája ETP Slovensko s organizáciou Dramatic Adventure Theatre z New Yorku, s ktorou spolupracujeme už 14 rokov, od roku 2012.\n\n" +
          "Aj toto leto viedli americké i slovenské lektorky a lektori DAT tvorivé divadelné workshopy pre deti a mladých ľudí v Košiciach aj v Zemplínskej Teplici a poznávali Slovensko v Bratislave, Košiciach, Martine a Ždiari.\n\n" +
          "Predstavenie Voda, ktorá vandruje / Water that Wanders vznikalo metódou autorského divadla v priebehu uplynulých troch týždňov. Nesie v sebe zážitky, osobné perspektívy a pohľad lokálnych i hosťujúcich očí a sŕdc.\n\n" +
          "Komunitný večer nie je len o divadle, ale i o možnosti stretnúť sa, vytvoriť nové priateľstvá a dlhodobé väzby. Bude priestor na rozhovory, otázky a hľadanie nových príležitostí spolupráce.\n\n" +
          "Podujatie je otvorené pre všetkých — pedagógov, pracovníkov a pracovníčky s mládežou, ľudí z kultúrneho prostredia aj širokú verejnosť. Budeme radi, ak sa pridáte. Vstup je voľný.\n\n" +
          "Tešíme sa na stretnutie.",
        impactBlurb:
          "Toto podujatie podporuje ETP Slovensko, komunitného partnera DAT na východnom Slovensku. Prostredníctvom vzdelávania, mentoringu, komunitného rozvoja a dlhodobej lokálnej práce ETP Slovensko podporuje deti, rodiny a komunity pri rozširovaní príležitostí a posilňovaní ciest vpred. Vaša účasť, dobrovoľný príspevok alebo sponzorská podpora pomáha tejto dôležitej práci a zároveň vytvára priestor, kde sa umelci a komunity môžu stretnúť prostredníctvom príbehu, performance a tvorivej výmeny. Všetky dobrovoľné príspevky a výťažok z podujatia podporia ETP Slovensko.",
        companyLabel: "Súbor",
        ticketPrice: "Vstup voľný · dobrovoľné príspevky vítané",
        language: "V angličtine, slovenčine a rómčine",
        accessibility: "Predstavenie naživo",
      },
    },
  },

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
    hidden: true
  },

  {
    id: "edinburgh-fringe-2026",
    title: "DAT at the Edinburgh Fringe",
    subtitle: "An Artistic Director Residency — Scouting the Next Adventure",
    category: "festival",
    status: "upcoming",
    date: "2026-08-06",
    endDate: "2026-08-10",
    venue: "Edinburgh Festival Fringe",
    city: "Edinburgh",
    country: "UK",
    description:
      "DAT lands at the world's largest arts festival. Fresh off PASSAGE: Slovakia, Artistic Director Jesse Baxter spends three full days at the Fringe scouting international work and building the partnerships that become DAT's next adventures.",
    longDescription:
      "Coming off the momentum of PASSAGE: Slovakia, DAT heads to Edinburgh for the world's biggest celebration of live performance. Over three full days at the Fringe, Artistic Director Jesse Baxter is seeing work across the international circuit — devised, documentary, and ensemble theatre — meeting fellow companies and presenters, and tracking the artists and collaborators who could shape DAT's next co-production.\n\nThis is DAT plugged into the global field: not a single show, but a working residency in the place where the international theatre community gathers each August. Follow along for dispatches from the festival, and reach out if you're in Edinburgh and want to connect.",
    image: "/images/theatre/archive/esmeraldas_dumbshow.webp",
    ticketUrl: "https://www.edfringe.com",
    ticketPrice: "Free to follow along",
    ticketType: "free",
    featured: true,
    tags: ["Edinburgh Fringe", "festival", "scouting", "partnerships", "PASSAGE", "international"],
    artistNote:
      "PASSAGE: Slovakia reminded me why we travel to make this work — the next adventure always starts with showing up where the world's artists are. Edinburgh in August is exactly that place.",
    artistNoteBy: "Jesse Baxter, Artistic Director",
    donateLink: "/donate",
    impactBlurb:
      "Every partnership DAT builds at festivals like the Fringe becomes a future co-production, residency, or community collaboration. Your support is what lets us show up, scout, and turn connections into the next adventure.",
    contactEmail: "jesse@dramaticadventure.com",
  },

];
