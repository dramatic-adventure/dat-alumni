// campaigns/passage-slovakia-2026.ts
/**
 * PASSAGE: Slovakia 2026 — first instance of the DAT fundraising campaign engine.
 *
 * Goal: $12,000 minimum to subsidize artists participating in the Slovakia PASSAGE program.
 * Primary link: https://dramaticadventure.com/passage/slovakia
 * Contextual link: https://dramaticadventure.com/passage
 *
 * To swap in real content later:
 *   - Replace heroImage with a high-quality campaign photo
 *   - Update testimonials with actual artist quotes
 *   - Add real alumni slugs with name + imageUrl
 *   - Add events as they are confirmed
 *   - Mark matchActive: true when a match is in place (update matchDescription)
 *   - Add updates[] as the campaign progresses
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

  // ── Goal ──────────────────────────────────────────────────────────
  goalAmount: 12000,
  currency: "usd",

  // ── Deadline ──────────────────────────────────────────────────────
  deadline: "2026-08-01",

  // ── Match ─────────────────────────────────────────────────────────
  matchActive: false,
  // matchDescription: "All gifts matched 1:1 through [DATE] — double your impact.",
  // matchCap: 5000,

  // ── Giving ────────────────────────────────────────────────────────
  giveAmounts: [50, 100, 250, 500, 1000],
  defaultAmount: 100,
  allowMonthly: false,

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
  // Add real drama club slugs here once available:
  // dramaClubs: [
  //   { slug: "nitra-youth-ensemble", name: "Nitra Youth Ensemble", country: "Slovakia", city: "Nitra" },
  // ],

  // ── Alumni ────────────────────────────────────────────────────────
  // Add real alumni participating in PASSAGE Slovakia here:
  // alumni: [
  //   { slug: "artist-slug", name: "Artist Name", role: "Teaching Artist", imageUrl: "/images/..." },
  // ],

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
      id: "u-passage-launch",
      date: "2026-04-13",
      title: "Campaign Launched",
      body: "We're officially raising funds for PASSAGE: Slovakia 2026. Our team travels in late summer — and we need your help to make sure every artist who wants to go can afford to be there. Share this page with someone who believes in the work.",
      authorName: "DAT Team",
    },
  ],

  // ── Links ─────────────────────────────────────────────────────────
  learnMoreUrl: "https://dramaticadventure.com/passage/slovakia",
  secondaryUrl: "https://dramaticadventure.com/passage",

  // ── Analytics ─────────────────────────────────────────────────────
  utmCampaign: "passage-slovakia-2026",
};
