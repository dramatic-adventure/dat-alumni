// lib/causes.ts

/**
 * Canonical cause taxonomy for Dramatic Adventure Theatre (DAT).
 *
 * This file is the single source of truth for:
 * - All high-level cause categories
 * - All subcause options
 * - Types used across drama clubs, productions, alumni, etc.
 */

/* ----------------------------------------
 * Core Types
 * ------------------------------------- */

/**
 * The seven high-level cause categories that DAT stands behind.
 *
 * IDs are slugified, human-readable, and stable for use in URLs, filters, etc.
 */
export type DramaClubCauseCategory =
  | "indigenous-sovereignty-rights"
  | "climate-justice-biodiversity-environmental-protection"
  | "youth-empowerment-mental-health-wellbeing"
  | "education-access-equity-opportunity"
  | "social-justice-human-rights-equity"
  | "community-wellbeing-safety-resilience"
  | "arts-culture-storytelling-representation";

/**
 * All subcause options across all categories.
 *
 * These are global IDs (unique across the entire system).
 * Labels live in CAUSE_SUBCATEGORIES_BY_CATEGORY.
 */
export type DramaClubCauseSubcategory =
  // 1. Indigenous Sovereignty & Rights
  | "indigenous-land-rights"
  | "indigenous-water-rights"
  | "tribal-community-sovereignty"
  | "ancestral-territory-protection"
  | "indigenous-cultural-preservation-traditional-knowledge"
  | "language-revitalization"
  | "indigenous-ecological-knowledge"
  | "anti-extractive-justice"
  // 2. Climate Justice, Biodiversity & Environmental Protection
  | "climate-justice"
  | "rainforest-protection"
  | "coastal-ocean-conservation"
  | "island-ecosystem-protection"
  | "biodiversity-wildlife-protection"
  | "environmental-education"
  | "community-led-conservation"
  // 3. Youth Empowerment, Mental Health & Wellbeing
  | "youth-leadership"
  | "youth-mental-health-emotional-wellbeing"
  | "arts-access-for-youth"
  | "social-emotional-learning"
  | "youth-in-care-displacement-support"
  | "bullying-prevention"
  | "youth-safety-resilience"
  | "girls-empowerment-agency"
  // 4. Education Access, Equity & Opportunity
  | "arts-education-access"
  | "education-equity"
  | "literacy-learning-access"
  | "inclusive-education-disabled-youth"
  | "global-learning-cultural-literacy"
  | "reducing-barriers-to-education"
  // 5. Social Justice, Human Rights & Equity
  | "anti-racism"
  | "gender-equality-womens-rights"
  | "lgbtq-inclusion"
  | "disability-rights"
  | "migration-refugee-rights"
  | "poverty-reduction-social-inclusion"
  | "access-to-justice"
  | "peacebuilding-anti-violence"
  | "democracy-civic-voice"
  // 6. Community Wellbeing, Safety & Resilience
  | "food-security"
  | "clean-water-access"
  | "housing-urban-renewal"
  | "community-safety"
  | "violence-prevention"
  | "local-leadership-capacity-building"
  | "health-access-rural-indigenous"
  | "post-conflict-post-trauma-community-healing"
  | "ethical-regenerative-travel"
  // 7. Arts, Culture, Storytelling & Representation
  | "freedom-of-expression"
  | "arts-cultural-preservation"
  | "arts-heritage-traditional-knowledge"
  | "representation-in-the-arts"
  | "equity-in-storytelling"
  | "narrative-justice"
  | "intergenerational-storytelling"
  | "community-creative-expression"
  | "artistic-rights-access"
  | "cross-cultural-exchange-solidarity";

/**
 * A single cause tag applied to a drama club, production, artist, etc.
 *
 * This is intentionally simple: pairing a category + subcategory ID.
 * UI layers can join this with CAUSE_CATEGORIES and
 * CAUSE_SUBCATEGORIES_BY_CATEGORY for labels and grouping.
 */
export type DramaClubCause = {
  category: DramaClubCauseCategory;
  subcategory: DramaClubCauseSubcategory;
};

/**
 * Metadata for a top-level cause category.
 */
export type DramaClubCauseCategoryMeta = {
  id: DramaClubCauseCategory;
  label: string;
  /** Optional shorter label for chips, buttons, and compact UI. */
  shortLabel?: string;
  /** Optional description for funder-facing copy or UI hints. */
  description?: string;
};

/**
 * Metadata for a subcategory option.
 */
export type DramaClubCauseSubcategoryMeta = {
  id: DramaClubCauseSubcategory;
  label: string;
  /** Optional shorter label for chips/pills; falls back to label if omitted. */
  shortLabel?: string;
  /** One-sentence DAT-centric explanation shown on alumni profile spotlight cards. */
  description?: string;
};

/* ----------------------------------------
 * Canonical Category List (7)
 * ------------------------------------- */

export const CAUSE_CATEGORIES: DramaClubCauseCategoryMeta[] = [
  {
    id: "indigenous-sovereignty-rights",
    label: "Indigenous Sovereignty & Rights",
    shortLabel: "Indigenous Rights",
  },
  {
    id: "climate-justice-biodiversity-environmental-protection",
    label: "Climate Justice, Biodiversity & Environmental Protection",
    shortLabel: "Climate & Biodiversity",
  },
  {
    id: "youth-empowerment-mental-health-wellbeing",
    label: "Youth Empowerment, Mental Health & Wellbeing",
    shortLabel: "Youth & Wellbeing",
  },
  {
    id: "education-access-equity-opportunity",
    label: "Education Access, Equity & Opportunity",
    shortLabel: "Education & Opportunity",
  },
  {
    id: "social-justice-human-rights-equity",
    label: "Social Justice, Human Rights & Equity",
    shortLabel: "Justice & Human Rights",
  },
  {
    id: "community-wellbeing-safety-resilience",
    label: "Community Wellbeing, Safety & Resilience",
    shortLabel: "Community & Resilience",
  },
  {
    id: "arts-culture-storytelling-representation",
    label: "Arts, Culture, Storytelling & Representation",
    shortLabel: "Arts & Storytelling",
  },
];

/**
 * Convenience lookup: category id → meta.
 * This keeps CAUSE_CATEGORIES as a nice ordered array for UI,
 * but also gives you O(1) lookup for filters/dashboards.
 */
export const CAUSE_CATEGORIES_BY_ID: Record<
  DramaClubCauseCategory,
  DramaClubCauseCategoryMeta
> = CAUSE_CATEGORIES.reduce(
  (acc, cat) => {
    acc[cat.id] = cat;
    return acc;
  },
  {} as Record<DramaClubCauseCategory, DramaClubCauseCategoryMeta>
);

/* ----------------------------------------
 * Canonical Subcategory Mapping
 * ------------------------------------- */

/**
 * Canonical mapping from each category to its allowed subcategories.
 *
 * Use this for:
 * - Form options (selects, chips, checkboxes)
 * - Grouped filters
 * - Funder-facing dashboards and summaries
 *
 * NOTE:
 * - Labels are exactly the advocacy-ready phrases from the 2025 master list.
 * - IDs are stable, URL-safe handles for code & data.
 */
export const CAUSE_SUBCATEGORIES_BY_CATEGORY: Record<
  DramaClubCauseCategory,
  DramaClubCauseSubcategoryMeta[]
> = {
  /* 1. Indigenous Sovereignty & Rights */
  "indigenous-sovereignty-rights": [
    {
      id: "indigenous-land-rights",
      label: "Indigenous Land Rights",
      shortLabel: "Indigenous land rights",
      description: "Young artists rooted in Indigenous homelands learn that their stories, their land, and their rights are inseparable.",
    },
    {
      id: "indigenous-water-rights",
      label: "Indigenous Water Rights",
      shortLabel: "Water rights & protection",
      description: "From rivers to rainforests, DAT stories center the communities whose survival depends on clean, protected water.",
    },
    {
      id: "tribal-community-sovereignty",
      label: "Tribal & Community Sovereignty",
      shortLabel: "Tribal sovereignty",
      description: "We believe tribal and Indigenous communities have the right to govern their futures on their own terms.",
    },
    {
      id: "ancestral-territory-protection",
      label: "Ancestral Territory Protection",
      shortLabel: "Ancestral territory protection",
      description: "DAT drama clubs on ancestral lands hold space for stories that carry the memory and the mandate to protect them.",
    },
    {
      id: "indigenous-cultural-preservation-traditional-knowledge",
      label: "Cultural Preservation & Traditional Knowledge",
      shortLabel: "Indigenous cultural preservation",
      description: "Through performance, young people pass forward the cultural knowledge their elders hold and the world needs.",
    },
    {
      id: "language-revitalization",
      label: "Language Revitalization",
      shortLabel: "Language revitalization",
      description: "When young artists perform in their Indigenous language, they reclaim a living inheritance that belongs to them.",
    },
    {
      id: "indigenous-ecological-knowledge",
      label: "Indigenous Ecological Knowledge",
      shortLabel: "Indigenous ecological knowledge",
      description: "The land has teachers — DAT amplifies the Indigenous knowledge systems that have sustained ecosystems for generations.",
    },
    {
      id: "anti-extractive-justice",
      label:
        "Anti-Extractive Justice (anti-mining, anti-oil, anti-deforestation)",
      shortLabel: "Harmful mining & extraction",
      description: "Stories told by communities standing against mining, oil, and deforestation remind the world whose future is at stake.",
    },
  ],

  /* 2. Climate Justice, Biodiversity & Environmental Protection */
  "climate-justice-biodiversity-environmental-protection": [
    {
      id: "climate-justice",
      label: "Climate Justice",
      shortLabel: "Climate justice",
      description: "DAT artists from frontline communities bring the urgency of the climate crisis to life through story and embodied testimony.",
    },
    {
      id: "rainforest-protection",
      label: "Rainforest Protection",
      shortLabel: "Rainforest protection",
      description: "The rainforest is both setting and character in the stories our Amazonian drama clubs tell — and worth every act of defense.",
    },
    {
      id: "coastal-ocean-conservation",
      label: "Coastal & Ocean Conservation",
      shortLabel: "Coastal & ocean protection",
      description: "Coastal young artists speak for the fish, the tides, and the communities whose livelihoods depend on healthy waters.",
    },
    {
      id: "island-ecosystem-protection",
      label: "Island Ecosystem Protection",
      shortLabel: "Island ecosystem protection",
      description: "Island drama clubs tell stories of fragile beauty worth protecting — because they live inside it.",
    },
    {
      id: "biodiversity-wildlife-protection",
      label: "Biodiversity & Wildlife Protection",
      shortLabel: "Wildlife & biodiversity protection",
      description: "Young storytellers who share their world with jaguars, macaws, and river dolphins are some of its most passionate advocates.",
    },
    {
      id: "environmental-education",
      label: "Environmental Education",
      shortLabel: "Environmental education",
      description: "Every DAT rehearsal in a natural setting is also a lesson in the living world we're all responsible for.",
    },
    {
      id: "community-led-conservation",
      label: "Community-Led Conservation",
      shortLabel: "Community-led conservation",
      description: "Conservation that starts with the community — not the corporation — is the kind DAT drama clubs champion.",
    },
  ],

  /* 3. Youth Empowerment, Mental Health & Wellbeing */
  "youth-empowerment-mental-health-wellbeing": [
    {
      id: "youth-leadership",
      label: "Youth Leadership",
      shortLabel: "Youth leadership",
      description: "DAT puts young people on stage as the protagonists of their communities, not just the audience.",
    },
    {
      id: "youth-mental-health-emotional-wellbeing",
      label: "Mental Health & Emotional Wellbeing",
      shortLabel: "Youth mental health & wellbeing",
      description: "Theatre is how DAT young artists process grief, build resilience, and discover they are not alone.",
    },
    {
      id: "arts-access-for-youth",
      label: "Arts Access for Youth",
      shortLabel: "Arts access for youth",
      description: "Removing financial and geographic barriers so every young person can experience the transformative power of live theatre.",
    },
    {
      id: "social-emotional-learning",
      label: "Social-Emotional Learning",
      shortLabel: "Social-emotional learning",
      description: "In the rehearsal room, young people practice empathy, conflict, courage, and connection — skills that carry far beyond the stage.",
    },
    {
      id: "youth-in-care-displacement-support",
      label: "Support for Youth in Care / Displacement",
      shortLabel: "Youth in care & displacement",
      description: "Young people navigating foster care, migration, or displacement find in DAT a stage that says: your story matters.",
    },
    {
      id: "bullying-prevention",
      label: "Bullying Prevention",
      shortLabel: "Bullying prevention",
      description: "DAT drama creates cultures of belonging where young people learn to stand for one another.",
    },
    {
      id: "youth-safety-resilience",
      label: "Youth Safety & Resilience",
      shortLabel: "Youth safety & resilience",
      description: "Theatre builds the inner tools — confidence, voice, adaptability — that help young people navigate a complex world.",
    },
    {
      id: "girls-empowerment-agency",
      label: "Girls’ Empowerment & Agency",
      shortLabel: "Girls’ empowerment & agency",
      description: "For girls who have been told to shrink, the DAT stage is the place they learn to take up room.",
    },
  ],

  /* 4. Education Access, Equity & Opportunity */
  "education-access-equity-opportunity": [
    {
      id: "education-equity",
      label: "Education Equity",
      shortLabel: "Education equity",
      description: "Every child deserves an education as rich in story and imagination as it is in fact — DAT fights for that future.",
    },
    {
      id: "literacy-learning-access",
      label: "Literacy & Learning Access",
      shortLabel: "Literacy & learning access",
      description: "Performance and storytelling are pathways into language, literacy, and learning for young people who need more than a textbook.",
    },
    {
      id: "inclusive-education-disabled-youth",
      label: "Inclusive Education for Disabled Youth",
      shortLabel: "Inclusive education (disabled youth)",
      description: "DAT stages belong to every young artist — including those whose access to education has never been guaranteed.",
    },
    {
      id: "arts-education-access",
      label: "Arts Education Access",
      shortLabel: "Arts education access",
      description: "Removing financial and geographic barriers so every young person can experience the transformative power of live theatre.",
    },
    {
      id: "global-learning-cultural-literacy",
      label: "Global Learning & Cultural Literacy",
      shortLabel: "Global learning & cultural literacy",
      description: "A DAT drama club is a classroom without walls, where young people learn by encountering the full breadth of the human story.",
    },
    {
      id: "reducing-barriers-to-education",
      label:
        "Reducing Barriers to Education (rural, minority, Roma, etc.)",
      shortLabel: "Removing barriers to education",
      description: "Geography, poverty, language, and identity shouldn't determine who gets a real education — DAT works to change that.",
    },
  ],

  /* 5. Social Justice, Human Rights & Equity */
  "social-justice-human-rights-equity": [
    {
      id: "anti-racism",
      label: "Anti-Racism",
      shortLabel: "Anti-racism",
      description: "DAT stages lift up the voices of young people of color who know firsthand what it means to be seen — and unseen.",
    },
    {
      id: "gender-equality-womens-rights",
      label: "Gender Equality & Women’s Rights",
      shortLabel: "Gender equality & women’s rights",
      description: "From the Amazon to East Africa, young women in DAT claim the stage as an act of equal standing.",
    },
    {
      id: "lgbtq-inclusion",
      label: "LGBTQ+ Inclusion",
      shortLabel: "LGBTQ+ inclusion",
      description: "Every young artist deserves to see themselves in the story and know they belong in the room.",
    },
    {
      id: "disability-rights",
      label: "Disability Rights",
      shortLabel: "Disability rights",
      description: "DAT builds stages where disabled young artists are authors of their own stories, not recipients of someone else’s.",
    },
    {
      id: "migration-refugee-rights",
      label: "Migration & Refugee Rights",
      shortLabel: "Migrant & refugee rights",
      description: "Young people who have crossed borders bring the most essential stories — DAT is honored to give them a stage.",
    },
    {
      id: "poverty-reduction-social-inclusion",
      label: "Poverty Reduction & Social Inclusion",
      shortLabel: "Poverty reduction & social inclusion",
      description: "Theatre cracks open possibility for young people whom systems of poverty would keep silent and invisible.",
    },
    {
      id: "access-to-justice",
      label: "Access to Justice",
      shortLabel: "Access to justice",
      description: "Storytelling is a form of testimony — DAT artists practice speaking truth to power from a very young age.",
    },
    {
      id: "peacebuilding-anti-violence",
      label: "Peacebuilding & Anti-Violence",
      shortLabel: "Peacebuilding & anti-violence",
      description: "In communities marked by conflict, a drama club becomes a place where young people practice peace.",
    },
    {
      id: "democracy-civic-voice",
      label: "Democracy, Civic Voice & Anti-Authoritarianism",
      shortLabel: "Democracy & civic voice",
      description: "Young people who perform their community’s story understand, in their bones, that their voice counts.",
    },
  ],

  /* 6. Community Wellbeing, Safety & Resilience */
  "community-wellbeing-safety-resilience": [
    {
      id: "food-security",
      label: "Food Security",
      shortLabel: "Food security",
      description: "The young farmers, foragers, and fisherfolk in DAT drama clubs tell the stories of food sovereignty their communities live every day.",
    },
    {
      id: "clean-water-access",
      label: "Clean Water Access",
      shortLabel: "Access to clean water",
      description: "Clean water is the opening line of every community's story — DAT stands with those fighting to protect it.",
    },
    {
      id: "housing-urban-renewal",
      label: "Housing & Urban Renewal",
      shortLabel: "Housing & urban renewal",
      description: "DAT drama clubs in urban and rural settings tell stories of home, displacement, and the right to belong somewhere.",
    },
    {
      id: "community-safety",
      label: "Community Safety",
      shortLabel: "Community safety",
      description: "When young people feel seen and valued, communities grow safer — theatre is part of that transformation.",
    },
    {
      id: "violence-prevention",
      label: "Violence Prevention",
      shortLabel: "Violence prevention",
      description: "DAT artists from high-risk communities channel urgency into story, creating alternatives to silence and escalation.",
    },
    {
      id: "local-leadership-capacity-building",
      label: "Local Leadership & Capacity Building",
      shortLabel: "Local leadership & capacity building",
      description: "Drama club alumni carry the confidence, communication skills, and community vision that local leadership demands.",
    },
    {
      id: "health-access-rural-indigenous",
      label: "Health Access (especially rural & Indigenous)",
      shortLabel: "Health access (rural & Indigenous)",
      description: "Young people in remote communities deserve healthcare — and deserve the stories that make their health struggles visible.",
    },
    {
      id: "post-conflict-post-trauma-community-healing",
      label: "Post-Conflict / Post-Trauma Community Healing",
      shortLabel: "Post-conflict community healing",
      description: "For communities marked by war, trauma, or loss, collaborative storytelling is one of the most profound tools for healing.",
    },
    {
      id: "ethical-regenerative-travel",
      label: "Ethical Travel & Regenerative Tourism",
      shortLabel: "Ethical & regenerative travel",
      description: "DAT travels as a guest, not a tourist — prioritizing local leadership, cultural respect, and lasting positive impact.",
    },
  ],

  /* 7. Arts, Culture, Storytelling & Representation */
  "arts-culture-storytelling-representation": [
    {
      id: "freedom-of-expression",
      label: "Freedom of Expression",
      shortLabel: "Freedom of expression",
      description: "The right to perform your truth without censorship is one DAT defends on every stage, in every country.",
    },
    {
      id: "arts-cultural-preservation",
      label: "Cultural Preservation",
      shortLabel: "Cultural preservation",
      description: "When grandparents pass down their stories through their grandchildren's performances, culture doesn't die — it transforms.",
    },
    {
      id: "arts-heritage-traditional-knowledge",
      label: "Heritage & Traditional Knowledge",
      shortLabel: "Heritage & traditional knowledge",
      description: "Heritage lives in performance — DAT drama clubs are keepers of the stories that should never be lost.",
    },
    {
      id: "representation-in-the-arts",
      label: "Representation in the Arts",
      shortLabel: "Representation in the arts",
      description: "Young people need to see themselves in the stories being told — DAT makes sure they're not just in the audience.",
    },
    {
      id: "equity-in-storytelling",
      label: "Equity in Storytelling",
      shortLabel: "Equity in storytelling",
      description: "Equity in storytelling means the communities most shaped by history get to be the ones who tell it.",
    },
    {
      id: "narrative-justice",
      label: "Narrative Justice",
      shortLabel: "Narrative justice",
      description: "The communities whose stories have been distorted or erased deserve to reclaim them — DAT stands for that right.",
    },
    {
      id: "intergenerational-storytelling",
      label: "Intergenerational Storytelling",
      shortLabel: "Intergenerational storytelling",
      description: "When elders and youth create together, stories carry both the weight of history and the hope of the future.",
    },
    {
      id: "community-creative-expression",
      label: "Community Creative Expression",
      shortLabel: "Community creative expression",
      description: "Collective creation is one of the most powerful forces in community life — DAT builds the spaces where it happens.",
    },
    {
      id: "artistic-rights-access",
      label: "Artistic Rights & Access",
      shortLabel: "Artistic rights & access",
      description: "Every young artist has the right to develop their craft, tell their story, and be valued for their creative labor.",
    },
    {
      id: "cross-cultural-exchange-solidarity",
      label: "Cross-Cultural Exchange & Solidarity",
      shortLabel: "Cross-cultural solidarity",
      description: "When young artists from different cultures build a story together, they discover how much they share and how much they can learn.",
    },
  ],
};
export const FEATURED_CAUSE_SUBCATEGORIES_BY_CATEGORY: Record<
  DramaClubCauseCategory,
  DramaClubCauseSubcategory[]
> = {
  "indigenous-sovereignty-rights": [
    "indigenous-land-rights",
    "indigenous-cultural-preservation-traditional-knowledge",
    "language-revitalization",
    "anti-extractive-justice",
  ],

  "climate-justice-biodiversity-environmental-protection": [
    "climate-justice",
    "rainforest-protection",
    "coastal-ocean-conservation",
    "biodiversity-wildlife-protection",
  ],

  "youth-empowerment-mental-health-wellbeing": [
    "youth-leadership",
    "youth-mental-health-emotional-wellbeing",
    "arts-access-for-youth",
    "youth-safety-resilience",
  ],

  "education-access-equity-opportunity": [
    "education-equity",
    "arts-education-access",
    "literacy-learning-access",
  ],

  "social-justice-human-rights-equity": [
    "anti-racism",
    "gender-equality-womens-rights",
    "lgbtq-inclusion",
    "democracy-civic-voice",
  ],

  "community-wellbeing-safety-resilience": [
    "food-security",
    "clean-water-access",
    "community-safety",
    "ethical-regenerative-travel",
  ],

  "arts-culture-storytelling-representation": [
    "representation-in-the-arts",
    "equity-in-storytelling",
    "narrative-justice",
    "cross-cultural-exchange-solidarity",
  ],
};