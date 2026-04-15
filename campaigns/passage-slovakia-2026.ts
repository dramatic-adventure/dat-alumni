// campaigns/passage-slovakia-2026.ts
/**
 * PASSAGE: Slovakia 2026 — first instance of the DAT fundraising campaign engine.
 *
 * Goal: $12,000 minimum to subsidize artists participating in the Slovakia PASSAGE program.
 * Primary link: https://dramaticadventure.com/passage/slovakia
 * Contextual link: https://dramaticadventure.com/passage
 *
 * DEMO STATE: demoTotals are active while no real donations exist.
 *   - Shows match banner, supporter wall, multiple updates, stretch-goal states.
 *   - Remove demoTotals (or set to zero) to return to live-only data.
 *   - Set matchActive: false to hide the match banner before a real match is in place.
 */

import type { FundraisingCampaign } from "@/lib/fundraisingCampaigns";

export const passageSlovakia2026: FundraisingCampaign = {
  // ── Identity ──────────────────────────────────────────────────────
  id: "passage-slovakia-2026",
  status: "active",

  // ── Hero ──────────────────────────────────────────────────────────
  title: "PASSAGE: Slovakia 2026",
  eyebrow: "Artist Fundraising Campaign",
  tagline: "Send an artist to Slovakia. Build something that lasts.",
  heroCopy:
    "PASSAGE is not a tour. It is a residency — artists arriving in a community, making theatre *with* the people who live there, not for them. In 2026, that work goes to Slovakia: to ETP Slovensko's schools and cultural centers in Nitra and beyond, where DAT's partnership with the local community has been growing for years.\n\nEvery artist in the PASSAGE program brings something irreplaceable. But travel costs money. And we believe financial barriers should never decide who gets to be in the room. So we're raising $12,000 to subsidize artist participation — because the work is only as honest as who's allowed to show up.\n\nYour gift does not just send an artist across the world. It sends a specific person, with a specific story, into a room full of people who will make something none of them could make alone. That's the work. That's what your support makes possible.",
  heroImage: "/images/rehearsing-nitra.jpg",
  heroImageFocus: "center",
  heroImageCredit: "Rehearsals at ETP Slovensko, Nitra",

  // ── Goal ──────────────────────────────────────────────────────────
  goalAmount: 12000,
  currency: "usd",

  // ── Deadline ──────────────────────────────────────────────────────
  deadline: "2026-08-01",

  // ── Match ─────────────────────────────────────────────────────────
  // Set to true and update matchDescription when a real match is confirmed.
  // Currently active for demo visibility.
  matchActive: true,
  matchDescription: "All gifts matched 1:1 through May 31 — double your impact.",
  matchCap: 5000,
  matchUnderwriterEmail: "hello@dramaticadventure.com",
  matchUnderwriterLabel: "Interested in funding a matching gift?",

  // ── Donor callout ─────────────────────────────────────────────────
  donorCallout:
    "This is not just about travel. It is about who gets to be an artist — and who gets to say so. Your gift opens that door.",

  // ── Share ─────────────────────────────────────────────────────────
  shareText:
    "DAT artists are heading to Slovakia to make theatre with the community there — and every gift through May 31 is being matched. Help send them:",

  // ── Giving ────────────────────────────────────────────────────────
  giveAmounts: [50, 100, 250, 500, 1000],        // fallback
  oneTimeAmounts: [50, 100, 250, 500, 1000],     // one-time default
  monthlyAmounts: [25, 50, 100, 250],            // lower threshold for recurring
  defaultAmount: 100,
  allowMonthly: true,
  // One-time is the default (time-bound campaign).
  // Monthly giving sustains PASSAGE's ongoing community partnerships
  // and residency preparation work beyond the 2026 program.

  // ── Frequency-aware impact copy ────────────────────────────────────
  oneTimeImpactCopy:
    "Your gift goes directly toward artist travel subsidies, visa costs, and field expenses that make PASSAGE possible in Slovakia.",
  monthlyImpactCopy:
    "Your monthly gift sustains DAT's ongoing community partnerships in Slovakia — keeping drama programs active and residency relationships alive beyond any single trip.",

  // ── Gift impact ────────────────────────────────────────────────────
  giftImpact: [
    { amount: 50, description: "Covers materials for one community workshop session", icon: "🎭" },
    { amount: 100, description: "Funds one full day of an artist's residency in Slovakia", icon: "☀️" },
    { amount: 250, description: "Subsidizes one leg of an artist's international travel", icon: "✈️" },
    { amount: 500, description: "Covers visa, travel, and prep costs for one artist", icon: "📋" },
    { amount: 1000, description: "Fully funds one artist's PASSAGE residency, start to finish", icon: "⭐" },
  ],

  monthlyGiftImpact: [
    { amount: 25, description: "Sustains ongoing comms and prep between DAT and Slovak partners each month", icon: "🤝" },
    { amount: 50, description: "Funds one ongoing community drama partnership check-in in Slovakia", icon: "🎭" },
    { amount: 100, description: "Covers monthly coordination and remote mentorship for Slovak drama communities", icon: "☀️" },
    { amount: 250, description: "Keeps DAT's Slovakia presence active — materials, logistics, and local support", icon: "⭐" },
  ],

  // ── Stretch goals ─────────────────────────────────────────────────
  stretchGoals: [
    {
      amount: 15000,
      title: "Extended Residency",
      description:
        "Fund a two-week extension for a DAT teaching team to stay in Slovakia after the PASSAGE program — deepening partnerships with ETP Slovensko schools and giving the drama clubs time to breathe and grow.",
    },
    {
      amount: 20000,
      title: "Return Artist Fellowship",
      description:
        "Sponsor an alumni artist — someone who worked with DAT in Slovakia before — to return as a lead teaching artist and mentor for the next generation of PASSAGE participants.",
    },
  ],

  // ── Testimonials ──────────────────────────────────────────────────
  testimonials: [
    {
      id: "t-passage-1",
      quote:
        "Working with DAT in Slovakia changed how I understand what theatre can do. I didn't just make a show — I made a community. And that community is still there, still making work, years later.",
      name: "DAT Artist",
      role: "PASSAGE Program Participant",
    },
    {
      id: "t-passage-2",
      quote:
        "ETP Slovensko has been our partner for years. The PASSAGE program is the most transformative collaboration we've had — for our students, for our community, and for the artists who arrive.",
      name: "ETP Slovensko",
      role: "Slovakia Partner Organization",
    },
  ],

  // ── Alumni ────────────────────────────────────────────────────────
  // Real DAT alumni slugs — linked to live profiles on this site.
  alumni: [
    {
      slug: "jesse-baxter",
      name: "Jesse Baxter",
      role: "Artistic Director",
      imageUrl: "/api/img?fileId=13HsY_wCfqqtlePCBex3PdbSLR1bFofL5&v=2026-02-01T00%3A17%3A56.157Z",
    },
    {
      slug: "barbara-herucova",
      name: "Barbara Herucová",
      role: "Community Partnerships, Czechia & Slovakia",
      imageUrl:
        "https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1616725992694-TNS2JIIE17GYNSMTZJYV/64537018_10157465992125439_6983616771756392448_o.jpg",
    },
    {
      slug: "peter-petkovsek",
      name: "Peter Petkovšek",
      role: "Director",
      imageUrl:
        "https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1613936866403-QO2DX0RHGL3HYGI200RB/peter1.jpg",
    },
    {
      slug: "mathilde-prosen-oldani",
      name: "Mathilde Prosen-Oldani",
      role: "Theatremaker",
      imageUrl:
        "https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1688753036942-IFAX0D3LJFO4U8B9YLH1/Tilda6804BW+%282%29+%281%29.jpg",
    },
  ],

  // ── Drama clubs / partner communities ────────────────────────────
  // These render as the primary conversion moment ("who you're supporting").
  dramaClubs: [
    {
      slug: "etp-slovensko",
      name: "ETP Slovensko Drama Program",
      country: "Slovakia",
      city: "Nitra",
      imageUrl: "/images/rehearsing-nitra.jpg",
    },
  ],

  // ── Events ────────────────────────────────────────────────────────
  events: [
    {
      id: "passage-farewell-brooklyn-2026",
      title: "PASSAGE Farewell Gathering",
      date: "2026-07-15",
      venue: "DAT Studio",
      city: "Brooklyn",
      country: "USA",
      ticketUrl: "https://dramaticadventure.com/passage/slovakia",
      imageUrl: "/images/rehearsing-nitra.jpg",
    },
  ],

  // ── Stories ───────────────────────────────────────────────────────
  // Real story slugs — directly connected to Slovakia and Eastern Europe.
  stories: [
    {
      slug: "drama-works",
      title: "Drama Works",
      teaser:
        "Long-term drama workshops with Roma youth in Eastern Slovakia — how a partnership with ETP Slovensko became one of DAT's most enduring collaborations.",
      imageUrl: "/images/rehearsing-nitra.jpg",
    },
    {
      slug: "night-at-the-roma-museum",
      title: "Night at the Roma Museum",
      teaser:
        "A cross-cultural production in Brno, Czechia — made with a community, not just for one.",
      imageUrl: "/images/performing-zanzibar.jpg",
    },
  ],

  // ── Gallery ───────────────────────────────────────────────────────
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
      caption: "What artists bring back changes how they teach everywhere else",
    },
  ],

  // ── Campaign updates ──────────────────────────────────────────────
  updates: [
    {
      id: "u-passage-3",
      date: "2026-04-13",
      title: "36% Funded in the First Two Weeks",
      body: "We've crossed $4,300 raised — and with the matching gift still active through May 31, every dollar still counts twice. Thank you to every donor who has given so far. We're naming the artists in the next update.",
      authorName: "Jesse Baxter",
      authorRole: "Artistic Director",
    },
    {
      id: "u-passage-2",
      date: "2026-04-07",
      title: "First Artist Confirmed for Slovakia",
      body: "We're excited to share that our first artist has been confirmed for the PASSAGE: Slovakia program. More names to follow as the roster builds out. If you've been considering a gift, now is a good moment — we're still in the matched window.",
      authorName: "DAT Team",
    },
    {
      id: "u-passage-1",
      date: "2026-04-01",
      title: "Campaign Launched",
      body: "We're officially raising funds for PASSAGE: Slovakia 2026. Our team travels in late summer — and we need your help to make sure every artist who wants to go can afford to be there. Share this page with someone who believes in the work.",
      authorName: "DAT Team",
    },
  ],

  // ── Links ─────────────────────────────────────────────────────────
  learnMoreUrl: "https://dramaticadventure.com/passage/slovakia",
  secondaryUrl: "https://dramaticadventure.com/passage",
  ambassadorUrl: "https://dramaticadventure.com/passage/slovakia",

  // ── Archive state ─────────────────────────────────────────────────
  archiveHeadline: "PASSAGE: Slovakia 2026 is complete.",
  archiveSummary:
    "Thank you to every donor who made this possible. Artists traveled to Slovakia, made theatre with the community, and brought something lasting home. The work continues.",

  // ── Demo totals ───────────────────────────────────────────────────
  // Active while no real donations exist. Remove or zero out after first
  // real donation lands to return to live-only display.
  demoTotals: {
    raisedMinor: 437500, // $4,375
    donorCount: 23,
    recentSupporters: [
      { name: "DAT Alumni Fund", amountMinor: 100000, currency: "usd", createdAt: new Date("2026-04-10") },
      { name: "The Martinez Family", amountMinor: 50000, currency: "usd", createdAt: new Date("2026-04-12") },
      { name: "Sarah K.", amountMinor: 25000, currency: "usd", createdAt: new Date("2026-04-13") },
      { name: "James & Lena", amountMinor: 15000, currency: "usd", createdAt: new Date("2026-04-11") },
      { name: "Rachel T.", amountMinor: 7500, currency: "usd", createdAt: new Date("2026-04-11") },
      { name: "Anonymous", amountMinor: 10000, currency: "usd", createdAt: new Date("2026-04-12") },
      { name: "Michael B.", amountMinor: 5000, currency: "usd", createdAt: new Date("2026-04-09") },
      { name: "Dr. A. Reyes", amountMinor: 25000, currency: "usd", createdAt: new Date("2026-04-08") },
    ],
  },

  // ── Analytics ─────────────────────────────────────────────────────
  utmCampaign: "passage-slovakia-2026",
};
