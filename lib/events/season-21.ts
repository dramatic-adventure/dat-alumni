// lib/events/season-21.ts
// ─────────────────────────────────────────────────────────────────────────────
// SEASON 21 EVENTS  ·  September 2026 – August 2027
// ─────────────────────────────────────────────────────────────────────────────
// Upcoming events whose date falls in DAT Season 21 (Sept–Aug; Season 1 = 2006).
// Records only — the DatEvent type and all helper logic live in lib/events.ts,
// which imports this array. Ordered by date. See SEASON_TEMPLATE.ts to add one.
// ─────────────────────────────────────────────────────────────────────────────

import type { DatEvent } from "@/lib/events";

/**
 * Hide this ENTIRE season until it's ready to go live.
 * Set to `true` and every Season 21 event disappears from the site (no listings,
 * no detail pages) regardless of each event's own `hidden` flag. Set back to
 * `false` (or leave as-is) to publish the season.
 *
 * To hide just ONE event instead, set `hidden: true` on that event below.
 */
export const season21Hidden = false;

export const season21Events: DatEvent[] = [

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
    hidden: true
  },

  {
    id: "agwow-malayerba-quito-2026",
    title: "A Girl Without Wings",
    subtitle: "DAT × Malayerba Teatro Co-production",
    category: "performance",
    status: "upcoming",
    date: "2026-09-24",
    endDate: "2026-10-11",
    time: "20:00",
    doors: "Doors at 7:30 PM",
    venue: "Teatro Malayerba",
    address: "Lizardo García N4-30 y Reina Victoria, La Floresta",
    city: "Quito",
    country: "Ecuador",
    description:
      "In Spanish & Kichwa. DAT and Malayerba Teatro revive the company's most celebrated love story — a solitary condor and the wingless shepherdess who stole his heart.",
    longDescription:
      "A solitary condor and the beautiful Chaska fall desperately in love. But fortune does not smile on these lovers: Chaska is no ordinary bird — she is a wingless shepherdess, bound to the earth.\n\nIn the merciless and beautiful Andes, the love and sorrow between a demigod who longs for companionship and a girl who must leave her family to ascend to the sky take life in a world of puppets and Kichwa legend.\n\nA Girl Without Wings immerses audiences in a universe where a tale from the Andean highlands is reborn among mischievous hummingbirds, coloured prayer threads, and a storm of shoes raining from the sky.\n\nCelebrated by The New York Times at its English-language premiere, this co-production with Malayerba Teatro presents the work for the first time in Spanish and Kichwa — a story born in the mountains that returns to them.",
    image: "/posters/a-girl-without-wings-landscape.jpg",
    imageFocus: "center 35%",
    ticketUrl: "https://www.ticketshow.com.ec",
    venueUrl: "https://www.teatromalayerba.com",
    ticketPrice: "$15 / $8 students",
    runtime: "Approx. 80 min · No interval",
    language: "Spanish & Kichwa",
    suitability: "Ages 10+",
    ticketType: "ticketed",
    featured: true,
    tags: ["New York Times Critics Pick", "Kichwa", "Spanish", "Quito", "Andes", "Malayerba", "puppetry", "co-production"],
    production: "a-girl-without-wings",
    dramaClub: "quito-collective",
    contactEmail: "hello@dramaticadventure.com",
    donateLink: "/donate?mode=new-work&production=agwow-quito-2026",
    impactBlurb:
      "This co-production sustains DAT's network of Drama Clubs in Ecuador — forming new generations of community artists in Quito and beyond. Your support makes theatre that is born from community possible.",

    // ── Rich content: every section fully populated ───────────────────────────

    photoGallery: [
      {
        src: "/images/Andean_Mask_Work.jpg",
        alt: "Mask work with the cast — creation residency in Quito",
      },
      {
        src: "/images/theatre/archive/agwow-condor.webp",
        alt: "The Condor — archive image from the original production",
      },
      {
        src: "/images/teaching-andes.jpg",
        alt: "DAT artists in the Andes during community research",
      },
      {
        src: "/images/teaching-amazon.jpg",
        alt: "Storytelling workshop with young people in the Ecuadorian Amazon",
      },
      {
        src: "/images/performing-zanzibar.jpg",
        alt: "Performance moment on international tour",
      },
    ],
    photoCredit: "DAT Archive / Malayerba Teatro",
    photographerHref: "https://www.teatromalayerba.com",
    albumHref: "https://photos.dramaticadventure.com/agwow-quito-2026",

    videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    videoTitle: "Watch: Trailer — A Girl Without Wings",

    artistNote:
      "The condor still flies. The girl is still brave. That never changes.",
    artistNoteBy: "Kathleen Amshoff, Director",

    // Cast & creative team — English roles as base; Spanish roles in translations.es.
    // group: "creative" → Creative Team section; group: "cast" → Cast section (with photos)
    credits: [
      // Creative Team
      { group: "creative", role: "Direction",            name: "Kathleen Amshoff",       href: "/alumni/kathleen-amshoff" },
      { group: "creative", role: "Artistic Direction",   name: "Jesse Baxter",            href: "/alumni/jesse-baxter" },
      { group: "creative", role: "Dramaturgy",           name: "Jason Williamson",         href: "/alumni/jason-williamson" },
      { group: "creative", role: "Spanish Translation",  name: "Karina Vélez",             href: "/alumni/karina-velez" },
      { group: "creative", role: "Kichwa Translation",   name: "Edward Serrate Yujo",      href: "/alumni/edward-serrate-yujo" },
      { group: "creative", role: "Puppet Design",        name: "Maria-Isabel Rojas",       href: "/alumni/maria-isabel-rojas" },
      { group: "creative", role: "Production",           name: 'Juliana "Juice" Franco',   href: "/alumni/juliana-franco" },
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
        role: "The Condor",
        name: "Javier Spivey",
        href: "/alumni/javier-spivey",
        photo: "https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1613937012050-7HWDMXIJ72U50MKM7JSQ/javier.PNG",
      },
      {
        group: "cast",
        role: "The Mother",
        name: "Ana Arellano",
        href: "/alumni/ana-arellano",
        photo: "https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1616727468148-OBFR2IM4WPQ43JVPXH13/21728911_10156595589829056_8394607501235178776_o.jpg",
      },
      {
        group: "cast",
        role: "Hummingbird",
        name: "Yan Rey",
        href: "/alumni/yan-rey",
        photo: "https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1688752206990-AL7Y5GAW3AMGR71JYRJD/Yan_foto-perfil.jpg",
      },
      {
        group: "cast",
        role: "Narrator",
        name: "Daniela Garzón-Silva",
        href: "/alumni/daniela-garzon-silva",
        photo: "https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1688755665448-6R1OMNYCMKOS8G1CZMPH/IMG_2761.jpg",
      },
      {
        group: "cast",
        role: "Lead Musician",
        name: "Thomas Burns Scully",
        href: "/alumni/thomas-burns-scully",
        photo: "https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1613454794191-W20YLPVCQ2ZLXOAR79HU/thomas.jpg",
      },
    ],

    pressQuotes: [
      {
        text: "Not much is typical about 'A Girl without Wings.' Poignant. Sensitively directed. Magical.",
        attribution: "Laurel Graeber, The New York Times",
        href: "https://www.nytimes.com/",
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

    accessibility:
      "Step-free access via main entrance · Audio-described performance: 3 Oct · BSL-interpreted performance: 10 Oct · English subtitles available",

    groupBookingEmail: "produccion@malayerba.org",

    // translations.es — Spanish overrides for all bilingual fields.
    // Base event is English; this object is shown when the user selects ES.
    translations: {
      es: {
        title: "Una Niña Sin Alas",
        subtitle: "Co-producción DAT × Malayerba Teatro",
        description:
          "En español y kichwa. DAT y Malayerba Teatro traen de vuelta la historia de amor más premiada de la compañía — un cóndor solitario y la pastora sin alas que robó su corazón.",
        longDescription:
          "Un cóndor solitario y la hermosa Chaska se enamoran perdidamente. Pero la fortuna no sonríe a estos amantes: Chaska no es un pájaro más, sino una pastora sin alas, atada a la tierra.\n\nEn los despiadados y bellos Andes, el amor y el dolor entre un semidiós que anhela compañía y una muchacha que debe dejar su familia para ascender al cielo toman vida en un mundo de títeres y leyenda kichwa.\n\nUna Niña Sin Alas sumerge al público en un universo donde un cuento del altiplano andino renace entre picaflores traviesos, hilos de oración de colores y una tormenta de zapatos que llueve del cielo.\n\nCelebrada por The New York Times en su estreno en inglés, esta co-producción con Malayerba Teatro la presenta por primera vez en español y kichwa. Una historia nacida en las montañas que regresa a ellas.",
        artistNote:
          "Esta pieza nació en los Andes, viajó por tres continentes y fue reconstruida desde cero para cada comunidad que la recibió. Lo que ven esta noche no es un simple revival — es un re-enraizamiento. El cóndor todavía vuela. La niña todavía es valiente. Eso nunca cambia.",
        artistNoteBy: "Kathleen Amshoff, Directora",
        impactBlurb:
          "Esta co-producción sustenta la red de Drama Clubs de DAT en el Ecuador — formando nuevas generaciones de artistas comunitarios en Quito y más allá. Tu apoyo hace posible el teatro que nace de la comunidad.",
        runtime: "Aprox. 80 min · Sin intervalo",
        language: "Español y Kichwa",
        suitability: "Mayores de 10 años",
        ticketPrice: "$15 / $8 estudiantes",
        videoTitle: "Mira: Tráiler — Una Niña Sin Alas",
        accessibility:
          "Acceso sin escalones por entrada principal · Función audiodescrita: 3 oct · Función con interpretación LSEC: 10 oct · Subtítulos en inglés disponibles",
        pressQuotes: [
          {
            text: "Nada en 'Una Niña sin Alas' es usual. Emotiva, sensitivamente dirigida. Mágica.",
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
        credits: [
          // Creative Team — Spanish roles, same names/links
          { group: "creative", role: "Dirección",             name: "Kathleen Amshoff",       href: "/alumni/kathleen-amshoff" },
          { group: "creative", role: "Dirección Artística",   name: "Jesse Baxter",            href: "/alumni/jesse-baxter" },
          { group: "creative", role: "Dramaturgia",           name: "Jason Williamson",         href: "/alumni/jason-williamson" },
          { group: "creative", role: "Traducción al Español", name: "Karina Vélez",             href: "/alumni/karina-velez" },
          { group: "creative", role: "Traducción al Kichwa",  name: "Edward Serrate Yujo",      href: "/alumni/edward-serrate-yujo" },
          { group: "creative", role: "Diseño de Títeres",     name: "Maria-Isabel Rojas",       href: "/alumni/maria-isabel-rojas" },
          { group: "creative", role: "Producción",            name: 'Juliana "Juice" Franco',   href: "/alumni/juliana-franco" },
          // Cast — Spanish roles, same headshots/links
          { group: "cast", role: "Chaska",          name: "Isabel Martínez",       href: "/alumni/isa-martinez" },
          { group: "cast", role: "El Cóndor",       name: "Javier Spivey",         href: "/alumni/javier-spivey" },
          { group: "cast", role: "La Madre",        name: "Ana Arellano",          href: "/alumni/ana-arellano" },
          { group: "cast", role: "Picaflor",        name: "Yan Rey",               href: "/alumni/yan-rey" },
          { group: "cast", role: "Narradora",       name: "Daniela Garzón-Silva",  href: "/alumni/daniela-garzon-silva" },
          { group: "cast", role: "Músico Principal",name: "Thomas Burns Scully",   href: "/alumni/thomas-burns-scully" },
        ],
      },
    },
    hidden: false
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
    hidden: true
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
    hidden: true
  },

  {
    id: "travelogue-stories-from-passage-2026",
    title: "Travelogue: Stories from PASSAGE",
    subtitle: "An Interactive Online Storytelling Cabaret",
    category: "fundraiser",
    status: "upcoming",
    date: "2026-11-15",
    time: "1:00 PM ET / 7:00 PM CET",
    venue: "Online — Zoom",
    city: "Worldwide",
    country: "Online",
    description:
      "A special edition of DAT’s Travelogue series — and a PASSAGE: Slovakia reunion — featuring live storytelling, music, and conversation inspired by global journeys and the adventures that shape us.",
    longDescription:
      "Travelogue is Dramatic Adventure Theatre’s interactive travel-storytelling series, where artists, travelers, and special guests share stories, songs, poems, and reflections shaped by meaningful journeys. This special edition, Stories from PASSAGE, doubles as a reunion of the PASSAGE: Slovakia cohort — gathering the artists, collaborators, and friends of the journey alongside invited guests from across the DAT community for an afternoon (evening in Central Europe) of live storytelling, music, and conversation. The online format means the whole circle can be in the room: PASSAGE artists, Slovak partners, and the worldwide DAT community. Rooted in the spirit of adventure, artistic exchange, and human connection, the event invites audiences to listen, reflect, and even share an adventure of their own.",
    image: "/images/theatre/archive/tembo.webp",
    ticketUrl: "https://dramaticadventure.com/travelogue",
    ticketPrice: "Free — registration required",
    ticketType: "free",
    featured: false,
    tags: ["Travelogue", "storytelling", "cabaret", "music", "online", "PASSAGE", "reunion"],
    contactEmail: "hello@dramaticadventure.com",
  },

];
