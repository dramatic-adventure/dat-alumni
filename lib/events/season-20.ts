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
    id: "joint-drama-club-showcase-slovakia-2026",
    title: "Joint Community Showcase",
    subtitle: "Zemplínska Teplica Ensemble + Luník IX Collective",
    category: "performance",
    subcategory: "community-showcase",
    status: "upcoming",
    date: "2026-07-24",
    time: "Afternoon",
    venue: "TBD",
    city: "Slovakia",
    country: "Slovakia",
    dramaClubs: ["zemplinska-teplica-ensemble", "lunik-ix-collective"],
    description:
      "A special daytime community showcase featuring the Zemplínska Teplica Ensemble and the Luník IX Collective in an afternoon of performance, storytelling, and celebration.",
    longDescription:
      "This joint community showcase brings together young artists from DAT’s Zemplínska Teplica Ensemble and Luník IX Collective for a shared afternoon of performance, storytelling, and connection. Created through workshops, collaboration, and community-based theatre-making, the event celebrates the creativity, courage, and collective spirit of these young artists while honoring the relationships built across both communities. Join us for a joyful daytime gathering that highlights the power of young people finding their voice through theatre.",
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
