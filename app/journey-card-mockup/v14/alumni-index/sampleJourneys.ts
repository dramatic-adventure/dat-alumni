// app/journey-card-mockup/v14/alumni-index/sampleJourneys.ts
// ⚠️  MOCKUP ONLY — fixture data for the alumni-index review mockups.
//
// Pretend this is Isabel Martínez's actual record: multiple DAT journeys
// across the years. In production these come from the alumni profile loader
// + the journey-card store; for the mockup we hand-shape the payload so all
// three review pages share the same data.

export type SampleJourney = {
  slug:        string;
  program:     string;   // "PASSAGE"
  country:     string;   // "SLOVAKIA"
  year:        number;
  dates:       string;
  primaryRole: string;
  heroSrc:     string;
  accent:      "pink" | "teal" | "yellow" | "grape";
  pullQuote:   string;
  chapters:    number;
  href:        string;   // where the full journey card lives (mock route)
};

export const SAMPLE_ALUM = {
  name:    "Isabel Martínez",
  slug:    "isa-martinez",
  headshot:
    "https://images.squarespace-cdn.com/content/v1/6022114419b886404b1030fa/1688754593745-N9E8YZU0VE49QMQIOG4J/Marisa+Puller+007.jpg?format=1500w",
  bylineRoles: ["Actor", "Teaching Artist"],
};

export const SAMPLE_JOURNEYS: SampleJourney[] = [
  {
    slug:        "passage-slovakia-2026",
    program:     "PASSAGE",
    country:     "SLOVAKIA",
    year:        2026,
    dates:       "July 12 – August 2, 2026",
    primaryRole: "Teaching Artist · Cohort Lead",
    heroSrc:     "/images/projects/archive/teaching-artist-residency-slovakia-camp.webp",
    accent:      "teal",
    pullQuote:
      "I arrived thinking I was here to teach. I left knowing how much I had been taught.",
    chapters:    7,
    href:        "/journey-card-mockup/v14",
  },
  {
    slug:        "action-andes-2024",
    program:     "ACTion",
    country:     "ANDES",
    year:        2024,
    dates:       "June 4 – June 28, 2024",
    primaryRole: "Devising Artist",
    heroSrc:     "/images/teaching-andes.jpg",
    accent:      "grape",
    pullQuote:
      "We made the play in the language of the room — Quechua, Spanish, breath.",
    chapters:    5,
    href:        "/journey-card-mockup/v14",
  },
  {
    slug:        "action-tanzania-2022",
    program:     "ACTion",
    country:     "TANZANIA",
    year:        2022,
    dates:       "January 14 – February 7, 2022",
    primaryRole: "Ensemble · Workshop Co-Lead",
    heroSrc:     "/images/projects/archive/ACTion-Tanzania-3-hike.webp",
    accent:      "yellow",
    pullQuote:
      "The long walk to the village is part of the play. Nothing began at the rehearsal mat.",
    chapters:    6,
    href:        "/journey-card-mockup/v14",
  },
  {
    slug:        "passage-zanzibar-2019",
    program:     "PASSAGE",
    country:     "ZANZIBAR",
    year:        2019,
    dates:       "August 9 – September 1, 2019",
    primaryRole: "Performer",
    heroSrc:     "/images/performing-zanzibar.jpg",
    accent:      "pink",
    pullQuote:
      "First DAT season. The salt in the air taught me the difference between stage and shore.",
    chapters:    4,
    href:        "/journey-card-mockup/v14",
  },
];

// Shared design tokens for the alumni-index mockups. Mirrors C in JourneyCardV14
// so the mockups feel native to the V14 world.
export const A = {
  bg:     "#f2f2f2",
  paper:  "#efe9df", // page paper / mosaic backdrop
  ink:    "#241123",
  yellow: "#f5c842",
  teal:   "#2493A9",
  pink:   "#F23359",
  grape:  "#7b4fa6",
  muted:  "rgba(36,17,35,0.45)",
  dim:    "rgba(36,17,35,0.20)",
  sep:    "rgba(36,17,35,0.10)",
  border: "rgba(36,17,35,0.13)",
} as const;

export function accentColor(a: SampleJourney["accent"]): string {
  switch (a) {
    case "pink":   return A.pink;
    case "teal":   return A.teal;
    case "yellow": return A.yellow;
    case "grape":  return A.grape;
  }
}
