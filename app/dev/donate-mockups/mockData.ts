// ============================================================
// MOCK DATA — design exploration only (/dev/donate-mockups)
// Not imported by production code. Safe to delete with the route.
// Names/figures are placeholders loosely based on real DAT content.
// ============================================================

export type MockDesignation = {
  id: string;
  label: string;
  sub?: string;
  /** short code used in the gift-ticket reference */
  ref: string;
};

export const GREATEST_NEED: MockDesignation = {
  id: "greatest-need",
  label: "Greatest Need",
  sub: "Used where it matters most right now",
  ref: "GN",
};

export type MockImpactArea = MockDesignation & {
  blurb: string;
  /** designation shown if the donor stops at this level */
  desigLabel?: string;
  desigSub?: string;
};

/** Path A — the sponsor modes from the production /donate dashboard */
export const IMPACT_AREAS: MockImpactArea[] = [
  {
    id: "drama-club",
    label: "Sponsor a Drama Club",
    blurb: "Youth ensembles writing the plays their towns need to hear",
    ref: "DC",
    desigLabel: "All Drama Clubs",
    desigSub: "Youth ensembles worldwide",
  },
  {
    id: "artist",
    label: "Sponsor an Artist",
    blurb: "Teaching artists working where the stories live",
    ref: "AR",
    desigLabel: "Artist Support",
    desigSub: "Across all artist programs",
  },
  {
    id: "new-work",
    label: "Back a New Work",
    blurb: "Original productions born from fieldwork",
    ref: "NW",
    desigLabel: "New Work",
    desigSub: "All productions in development",
  },
  {
    id: "special-project",
    label: "Fund a Special Project",
    blurb: "Field kits, residencies, and local builds",
    ref: "SP",
    desigLabel: "Special Projects",
    desigSub: "The whole project portfolio",
  },
];

/** Path B — Support a cause */
export const CAUSES: MockImpactArea[] = [
  { id: "youth-creativity", label: "Youth Creativity", blurb: "Young people claiming their voices", ref: "YC" },
  { id: "arts-education", label: "Arts Education", blurb: "Learning through making theatre", ref: "AE" },
  { id: "community-belonging", label: "Community Belonging", blurb: "Spaces where everyone has a part", ref: "CB" },
  { id: "cross-cultural", label: "Cross-Cultural Collaboration", blurb: "Stories that cross borders", ref: "CC" },
  { id: "artist-mobility", label: "Artist Mobility", blurb: "Getting artists where they're needed", ref: "AM" },
  { id: "new-work", label: "New Work", blurb: "Original plays born from fieldwork", ref: "NW" },
  { id: "local-partners", label: "Local Partner Impact", blurb: "Backing the people on the ground", ref: "LP" },
];

export type MockClub = MockDesignation & { featured?: boolean };

export type MockCountry = {
  id: string;
  name: string;
  clubs: MockClub[];
};

/** Geography → ensembles (mock subset) */
export const COUNTRIES: MockCountry[] = [
  {
    id: "ecuador",
    name: "Ecuador",
    clubs: [
      { id: "quito-youth", label: "Quito Youth Ensemble", sub: "Drama Club · Ecuador", ref: "DC-EC", featured: true },
      { id: "guayaquil-dc", label: "Guayaquil Drama Club", sub: "Drama Club · Ecuador", ref: "DC-EC" },
    ],
  },
  {
    id: "slovakia",
    name: "Slovakia",
    clubs: [
      { id: "zemplinska", label: "Zemplínska Teplica Youth Ensemble", sub: "Drama Club · Slovakia", ref: "DC-SK", featured: true },
    ],
  },
  { id: "tanzania", name: "Tanzania", clubs: [{ id: "arusha-dc", label: "Arusha Youth Drama Club", sub: "Drama Club · Tanzania", ref: "DC-TZ" }] },
  { id: "zimbabwe", name: "Zimbabwe", clubs: [{ id: "harare-dc", label: "Harare Youth Ensemble", sub: "Drama Club · Zimbabwe", ref: "DC-ZW" }] },
  { id: "peru", name: "Peru", clubs: [{ id: "lima-dc", label: "Lima Drama Collective", sub: "Drama Club · Peru", ref: "DC-PE" }] },
  { id: "south-africa", name: "South Africa", clubs: [{ id: "kayamandi-dc", label: "Kayamandi Youth Theatre", sub: "Drama Club · South Africa", ref: "DC-ZA" }] },
];

export type MockSpecific = MockDesignation & { kind: string };

/** Path C — Find something specific (search/browse) */
export const SPECIFICS: MockSpecific[] = [
  { id: "zemplinska", label: "Zemplínska Teplica Youth Ensemble", sub: "Drama Club · Slovakia", ref: "DC-SK", kind: "Drama Club" },
  { id: "ecuador-clubs", label: "Drama Clubs Across Ecuador", sub: "Country-wide drama club fund", ref: "DC-EC", kind: "Fund" },
  { id: "quito-youth", label: "Quito Youth Ensemble", sub: "Drama Club · Ecuador", ref: "DC-EC", kind: "Drama Club" },
  { id: "passage-slovakia", label: "PASSAGE: Slovakia 2026", sub: "Campaign", ref: "CA-SK", kind: "Campaign" },
  { id: "the-way-home", label: "The Way Home", sub: "New work in development", ref: "PR-NW", kind: "Production" },
  { id: "field-kits", label: "Field Kits for Teaching Artists", sub: "Special project", ref: "CP-FK", kind: "Project" },
  { id: "kayamandi-dc", label: "Kayamandi Youth Theatre", sub: "Drama Club · South Africa", ref: "DC-ZA", kind: "Drama Club" },
];

/** Drill-down rows shown inside each sponsor-mode view of the selector */
export const AREA_FEATURES: Record<string, MockSpecific[]> = {
  "new-work": [
    { id: "the-way-home", label: "The Way Home", sub: "New work in development · Slovakia fieldwork", ref: "NW-WH", kind: "Production" },
    { id: "river-crossing", label: "River Crossing", sub: "Devised piece · Ecuador ensemble collaboration", ref: "NW-RC", kind: "Production" },
  ],
  "special-project": [
    { id: "field-kits", label: "Field Kits for Teaching Artists", sub: "Tools and texts for artists in the field", ref: "SP-FK", kind: "Project" },
    { id: "residency-build", label: "Residency Build: Zemplínska Teplica", sub: "A working rehearsal room for the ensemble", ref: "SP-RB", kind: "Project" },
  ],
  "artist": [
    { id: "artist-mobility", label: "Travel & Mobility", sub: "Get artists to the communities that invited them", ref: "AR-TM", kind: "Focus" },
    { id: "artist-training", label: "Training & Employment", sub: "Pay artists fairly for field teaching", ref: "AR-TE", kind: "Focus" },
    { id: "artist-newwork", label: "New Work Development", sub: "Commission artists to write from the field", ref: "AR-NW", kind: "Focus" },
  ],
};

/** Deep-link presets for the ?support= demo (campaign card → donate) */
export const SUPPORT_PRESETS: Record<string, MockDesignation> = {
  "zemplinska": { id: "zemplinska", label: "Zemplínska Teplica Youth Ensemble", sub: "Drama Club · Slovakia", ref: "DC-SK" },
  "ecuador-clubs": { id: "ecuador-clubs", label: "Drama Clubs Across Ecuador", sub: "Country-wide drama club fund", ref: "DC-EC" },
  "youth-creativity": { id: "youth-creativity", label: "Youth Creativity", sub: "Cause", ref: "YC" },
};

export const AMOUNTS = [25, 50, 100, 250, 500, 1000];
export const FEATURED_AMOUNT = 50;

export function formatUsd(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function buildRefCode(d: MockDesignation, freq: "monthly" | "one_time", amount: number | null) {
  const f = freq === "monthly" ? "M" : "1X";
  const a = amount != null ? `-${Math.round(amount)}` : "";
  return `DAT-${d.ref}-${f}${a}`;
}
