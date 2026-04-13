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
    "PASSAGE is DAT's international residency model: artists from across the world arriving in a new community, making theatre together with the people who live there. In 2026, that work lands in Slovakia — at ETP Slovensko's schools and cultural centers in Nitra and beyond.\n\nWe're raising $12,000 to subsidize artist participation so that financial barriers never determine who gets to be in the room. This is how we keep the work honest. This is how we keep it open.\n\nYour gift sends an artist to Slovakia. And the theatre they make there will echo long after they leave.",
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

  // ── Giving ────────────────────────────────────────────────────────
  giveAmounts: [50, 100, 250, 500, 1000],
  defaultAmount: 100,
  allowMonthly: false,

  // ── Gift impact ────────────────────────────────────────────────────
  giftImpact: [
    { amount: 50, description: "Covers materials for one community workshop session", icon: "🎭" },
    { amount: 100, description: "Funds one full day of an artist's residency in Slovakia", icon: "☀️" },
    { amount: 250, description: "Subsidizes one leg of an artist's international travel", icon: "✈️" },
    { amount: 500, description: "Covers visa, travel, and prep costs for one artist", icon: "📋" },
    { amount: 1000, description: "Fully funds one artist's PASSAGE residency, start to finish", icon: "⭐" },
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

  // ── Drama clubs ───────────────────────────────────────────────────
  // Replace with real slugs as they become available in the data system.
  dramaClubs: [
    { slug: "nitra-youth-ensemble", name: "Nitra Youth Ensemble", country: "Slovakia", city: "Nitra" },
    { slug: "bratislava-drama-studio", name: "Bratislava Drama Studio", country: "Slovakia", city: "Bratislava" },
  ],

  // ── Alumni ────────────────────────────────────────────────────────
  // Replace slugs with real artists when confirmed for Slovakia 2026.
  alumni: [
    { slug: "demo-artist-passage-1", name: "Maria Nguyen", role: "Teaching Artist" },
    { slug: "demo-artist-passage-2", name: "Kofi Mensah", role: "Ensemble Lead" },
    { slug: "demo-artist-passage-3", name: "Sofia Andersen", role: "Playwright" },
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
    },
  ],

  // ── Stories ───────────────────────────────────────────────────────
  stories: [
    {
      slug: "a-girl-without-wings",
      title: "A Girl Without Wings",
      teaser: "How a community story in Quito became a touring production that crossed three continents.",
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
