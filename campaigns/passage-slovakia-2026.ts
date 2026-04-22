// campaigns/passage-slovakia-2026.ts
/**
 * PASSAGE: Slovakia 2026 — DAT fundraising campaign
 *
 * Goal: Raise the funds needed to bring artists into community in Slovakia this summer,
 * widening participation for both traveling artists and local artists, and supporting
 * shared creative work that builds voice, confidence, belonging, leadership, and possibility.
 *
 * Primary link: https://dramaticadventure.com/passage/slovakia
 * Contextual link: https://dramaticadventure.com/passage
 *
 * LIVE: matchActive is false until a real match underwriter is confirmed.
 * Seed the Neon DB with a real donation before publishing to avoid a zero start.
 */

import type { FundraisingCampaign } from "@/lib/fundraisingCampaigns";

export const passageSlovakia2026: FundraisingCampaign = {
  // ── Identity ──────────────────────────────────────────────────────
  id: "passage-slovakia-2026",
  status: "active",

  // ── Hero ──────────────────────────────────────────────────────────
  title: "Get Artists to Slovakia This Summer",
  eyebrow: "PASSAGE: SLOVAKIA 2026",
  tagline:
    "Your gift will help artists and communities create work that builds voice, confidence, belonging, and possibility.",
  heroCopy:
    "This summer, Dramatic Adventure Theatre will bring artists to Eastern Slovakia to make theatre in real relationship with community — side by side with local partners, local artists, and young people whose voices and stories belong front and center.\n\nIn many of the communities DAT serves, meaningful access to arts education and programming is limited. And for many artists — especially those with fewer resources, fewer connections, or fewer opportunities to travel — work like this can feel out of reach. Your gift helps close that gap.\n\nYour gift opens this project to more artists, including overlooked and less-resourced traveling artists as well as local artists whose presence is essential to the honesty, depth, and impact of the work. And your gift helps create theatre that amplifies local voices, strengthens confidence and belonging, preserves culture, grows creative problem-solving and leadership, and gives people space to imagine beyond the immediate needs of the moment.\n\nPASSAGE does not end when the residency ends. The work deepens with DAT Drama Clubs, and each artist involved will be imprinted by the experience. This community-rooted way of making work will find its way into the artists' future classrooms, rehearsal rooms, and home communities.\n\nTogether we can create magic in Slovakia this summer.",
  heroImage: "/images/rehearsing-nitra.jpg",
  heroImageFocus: "center",
  heroImageCredit: "Rehearsals at Divadlo Andrea Bagara, Nitra",

  // ── Goal ──────────────────────────────────────────────────────────
  goalAmount: 12000,
  currency: "usd",

  // ── Deadline ──────────────────────────────────────────────────────
  deadline: "2026-06-30",

  // ── Match ─────────────────────────────────────────────────────────
  matchActive: false,
  matchDescription: "",
  matchCap: 0,
  matchUnderwriterEmail: "hello@dramaticadventure.com",
  matchUnderwriterLabel: "Interested in underwriting artist access?",

  // ── Donor callout ─────────────────────────────────────────────────
  donorCallout:
    "A gift of a few hundred dollars helps close two access gaps at once: bringing meaningful theatre into communities that deserve more of it, and opening this life-shaping work to artists who might otherwise be left out.",

  // ── Share ─────────────────────────────────────────────────────────
  shareText:
    "Help DAT bring artists to Slovakia this summer so artists and communities can create work that builds voice, confidence, belonging, leadership, and possibility.",

  // ── Giving ────────────────────────────────────────────────────────
  giveAmounts: [50, 100, 250, 500, 1000, 2500],
  oneTimeAmounts: [50, 100, 250, 500, 1000, 2500],
  monthlyAmounts: [25, 50, 100, 250],
  defaultAmount: 250,
  allowMonthly: false,

  // ── Frequency-aware impact copy ───────────────────────────────────
  oneTimeImpactCopy:
    "Your gift helps make PASSAGE possible for more artists and supports community-rooted theatre that can amplify local voices, strengthen belonging, grow leadership, preserve culture, and widen what feels possible.",
  monthlyImpactCopy:
    "Monthly giving is currently disabled for this time-bound campaign so the focus stays on getting artists to Slovakia this summer.",

  // ── Gift impact ───────────────────────────────────────────────────
  giftImpact: [
    {
      amount: 50,
      description:
        "Helps strengthen the shared creative process that gives young people and artists space to be seen, heard, and valued.",
      icon: "✨",
    },
    {
      amount: 100,
      description:
        "Supports theatre-making in community that builds confidence, communication, and creative expression.",
      icon: "🎭",
    },
    {
      amount: 250,
      description:
        "Helps make participation possible for an artist whose presence can deepen the work and widen who gets to take part.",
      icon: "🧭",
    },
    {
      amount: 500,
      description:
        "Provides meaningful support for community-rooted work that can grow belonging, leadership, and possibility.",
      icon: "✈️",
    },
    {
      amount: 1000,
      description:
        "Helps widen the circle of artists and strengthen the ripple effects this work can have in community and beyond.",
      icon: "⭐",
    },
    {
      amount: 2500,
      description:
        "Makes a leadership-level investment in shared creation that can shape artists, strengthen community, and leave lasting impact.",
      icon: "🔥",
    },
  ],

  monthlyGiftImpact: [
    {
      amount: 25,
      description:
        "Would sustain ongoing coordination and relationship-building with Slovak partners in future phases of the work.",
      icon: "🤝",
    },
    {
      amount: 50,
      description:
        "Would support future community-rooted theatre activity and continued partnership after the residency.",
      icon: "🎭",
    },
    {
      amount: 100,
      description:
        "Would help maintain ongoing mentorship, collaboration, and local follow-through beyond a single trip.",
      icon: "☀️",
    },
    {
      amount: 250,
      description:
        "Would help sustain DAT's long-term community relationships in Slovakia over time.",
      icon: "⭐",
    },
  ],

  // ── Stretch goals ─────────────────────────────────────────────────
  stretchGoals: [
    {
      amount: 15000,
      title: "A Wider Circle of Artists",
      description:
        "Go beyond the core goal and open PASSAGE to more artists whose presence can deepen the work and widen who gets to participate.",
    },
    {
      amount: 18000,
      title: "Stronger Community Impact",
      description:
        "Increase support for local artists and collaborators in Slovakia so the work can build deeper confidence, belonging, leadership, cultural pride, and community connection.",
    },
    {
      amount: 22000,
      title: "Longer Ripples Beyond the Summer",
      description:
        "Invest more deeply in the relationships, local leadership, and shared creative process that continue shaping artists and community long after the residency ends.",
    },
  ],

  // ── Testimonials ──────────────────────────────────────────────────
  testimonials: [
    {
      id: "t-passage-1",
      quote:
        "What changed me was not just being in Slovakia. It was making something in real relationship with people whose stories, artistry, and presence changed how I understand theatre and community.",
      name: "DAT Artist",
      role: "PASSAGE Participant",
    },
    {
      id: "t-passage-2",
      quote:
        "This work matters because it helps people find voice, confidence, connection, and possibility through shared creation. It strengthens artists, young people, and community at the same time.",
      name: "ETP Slovensko",
      role: "Community Collaborator",
    },
  ],

  // ── Linked content (dynamic references) ───────────────────────────
  alumniSlugs: [
    "jesse-baxter",
    "barbara-herucova",
    "peter-petkovsek",
    "mathilde-prosen-oldani",
  ],

  dramaClubSlugs: ["lunik-ix-collective"],

  eventIds: ["dat-summer-launch-2026", "passage-sendoff-2026", "joint-drama-club-showcase-slovakia-2026", "passage-performance-party-2026"],

  storySlugs: ["drama-works", "night-at-the-roma-museum"],

  // ── Gallery ───────────────────────────────────────────────────────
  // Keep inline for now: the captions are campaign-specific.
  gallery: [
    {
      src: "/images/rehearsing-nitra.jpg",
      alt: "DAT artists rehearsing in Nitra, Slovakia",
      caption: "Rehearsals at ETP Slovensko partner school, Nitra",
    },
    {
      src: "/images/performing-zanzibar.jpg",
      alt: "DAT performance — community theatre in action",
      caption: "The PASSAGE process: making theatre with the community",
    },
    {
      src: "/images/teaching-amazon.jpg",
      alt: "DAT teaching artist at work",
      caption: "What artists carry home can keep rippling outward for years",
    },
  ],

  // ── Campaign updates ──────────────────────────────────────────────
  updates: [
    {
      id: "u-passage-4",
      date: "2026-04-14",
      title: "Why This Work Matters",
      body:
        "PASSAGE is not just about getting artists to Slovakia. It is about creating shared work in community that can build voice, confidence, belonging, leadership, and possibility. Every gift helps widen that impact.",
      authorName: "Jesse Baxter",
      authorRole: "Artistic Director",
    },
    {
      id: "u-passage-3",
      date: "2026-04-13",
      title: "36% Funded",
      body:
        "We've crossed $4,300 toward our goal. Thank you for helping open this project to more artists and strengthen the community-rooted work at its heart.",
      authorName: "Jesse Baxter",
      authorRole: "Artistic Director",
    },
    {
      id: "u-passage-2",
      date: "2026-04-07",
      title: "The Impact Begins in Community",
      body:
        "This work only becomes real when artists are in relationship with community, making something together on the ground in Slovakia. That is where voice, belonging, confidence, and possibility begin.",
      authorName: "DAT Team",
    },
    {
      id: "u-passage-1",
      date: "2026-04-01",
      title: "Campaign Launched",
      body:
        "We're raising funds to help bring artists to Slovakia this summer so PASSAGE can create the kind of shared work that strengthens artists, communities, and the future they imagine together.",
      authorName: "DAT Team",
    },
  ],

  // ── Links ─────────────────────────────────────────────────────────
  learnMoreUrl: "https://dramaticadventure.com/passage/slovakia",
  secondaryUrl: "https://dramaticadventure.com/passage",
  ambassadorUrl: "https://dramaticadventure.com/passage/slovakia",

  // ── Archive state ─────────────────────────────────────────────────
  archiveHeadline: "Because you helped make this work possible.",
  archiveSummary:
    "Thank you to every donor who helped open PASSAGE to more artists and bring shared creative work to life in Slovakia. What was built there — voice, confidence, belonging, leadership, and possibility — will keep rippling outward through artists, community, and the relationships that continue beyond the summer.",

  // ── Analytics ─────────────────────────────────────────────────────
  utmCampaign: "passage-slovakia-2026",
};