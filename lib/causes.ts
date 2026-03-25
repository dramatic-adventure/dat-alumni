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
    },
    {
      id: "indigenous-water-rights",
      label: "Indigenous Water Rights",
      shortLabel: "Water rights & protection",
    },
    {
      id: "tribal-community-sovereignty",
      label: "Tribal & Community Sovereignty",
      shortLabel: "Tribal sovereignty",
    },
    {
      id: "ancestral-territory-protection",
      label: "Ancestral Territory Protection",
      shortLabel: "Ancestral territory protection",
    },
    {
      id: "indigenous-cultural-preservation-traditional-knowledge",
      label: "Cultural Preservation & Traditional Knowledge",
      shortLabel: "Indigenous cultural preservation",
    },
    {
      id: "language-revitalization",
      label: "Language Revitalization",
      shortLabel: "Language revitalization",
    },
    {
      id: "indigenous-ecological-knowledge",
      label: "Indigenous Ecological Knowledge",
      shortLabel: "Indigenous ecological knowledge",
    },
    {
      id: "anti-extractive-justice",
      label:
        "Anti-Extractive Justice (anti-mining, anti-oil, anti-deforestation)",
      shortLabel: "Harmful mining & extraction",
    },
  ],

  /* 2. Climate Justice, Biodiversity & Environmental Protection */
  "climate-justice-biodiversity-environmental-protection": [
    {
      id: "climate-justice",
      label: "Climate Justice",
      shortLabel: "Climate justice",
    },
    {
      id: "rainforest-protection",
      label: "Rainforest Protection",
      shortLabel: "Rainforest protection",
    },
    {
      id: "coastal-ocean-conservation",
      label: "Coastal & Ocean Conservation",
      shortLabel: "Coastal & ocean protection",
    },
    {
      id: "island-ecosystem-protection",
      label: "Island Ecosystem Protection",
      shortLabel: "Island ecosystem protection",
    },
    {
      id: "biodiversity-wildlife-protection",
      label: "Biodiversity & Wildlife Protection",
      shortLabel: "Wildlife & biodiversity protection",
    },
    {
      id: "environmental-education",
      label: "Environmental Education",
      shortLabel: "Environmental education",
    },
    {
      id: "community-led-conservation",
      label: "Community-Led Conservation",
      shortLabel: "Community-led conservation",
    },
  ],

  /* 3. Youth Empowerment, Mental Health & Wellbeing */
  "youth-empowerment-mental-health-wellbeing": [
    {
      id: "youth-leadership",
      label: "Youth Leadership",
      shortLabel: "Youth leadership",
    },
    {
      id: "youth-mental-health-emotional-wellbeing",
      label: "Mental Health & Emotional Wellbeing",
      shortLabel: "Youth mental health & wellbeing",
    },
    {
      id: "arts-access-for-youth",
      label: "Arts Access for Youth",
      shortLabel: "Arts access for youth",
    },
    {
      id: "social-emotional-learning",
      label: "Social-Emotional Learning",
      shortLabel: "Social-emotional learning",
    },
    {
      id: "youth-in-care-displacement-support",
      label: "Support for Youth in Care / Displacement",
      shortLabel: "Youth in care & displacement",
    },
    {
      id: "bullying-prevention",
      label: "Bullying Prevention",
      shortLabel: "Bullying prevention",
    },
    {
      id: "youth-safety-resilience",
      label: "Youth Safety & Resilience",
      shortLabel: "Youth safety & resilience",
    },
    {
      id: "girls-empowerment-agency",
      label: "Girls’ Empowerment & Agency",
      shortLabel: "Girls’ empowerment & agency",
    },
  ],

  /* 4. Education Access, Equity & Opportunity */
  "education-access-equity-opportunity": [
    {
      id: "education-equity",
      label: "Education Equity",
      shortLabel: "Education equity",
    },
    {
      id: "literacy-learning-access",
      label: "Literacy & Learning Access",
      shortLabel: "Literacy & learning access",
    },
    {
      id: "inclusive-education-disabled-youth",
      label: "Inclusive Education for Disabled Youth",
      shortLabel: "Inclusive education (disabled youth)",
    },
    {
      id: "arts-education-access",
      label: "Arts Education Access",
      shortLabel: "Arts education access",
    },
    {
      id: "global-learning-cultural-literacy",
      label: "Global Learning & Cultural Literacy",
      shortLabel: "Global learning & cultural literacy",
    },
    {
      id: "reducing-barriers-to-education",
      label:
        "Reducing Barriers to Education (rural, minority, Roma, etc.)",
      shortLabel: "Removing barriers to education",
    },
  ],

  /* 5. Social Justice, Human Rights & Equity */
  "social-justice-human-rights-equity": [
    {
      id: "anti-racism",
      label: "Anti-Racism",
      shortLabel: "Anti-racism",
    },
    {
      id: "gender-equality-womens-rights",
      label: "Gender Equality & Women’s Rights",
      shortLabel: "Gender equality & women’s rights",
    },
    {
      id: "lgbtq-inclusion",
      label: "LGBTQ+ Inclusion",
      shortLabel: "LGBTQ+ inclusion",
    },
    {
      id: "disability-rights",
      label: "Disability Rights",
      shortLabel: "Disability rights",
    },
    {
      id: "migration-refugee-rights",
      label: "Migration & Refugee Rights",
      shortLabel: "Migrant & refugee rights",
    },
    {
      id: "poverty-reduction-social-inclusion",
      label: "Poverty Reduction & Social Inclusion",
      shortLabel: "Poverty reduction & social inclusion",
    },
    {
      id: "access-to-justice",
      label: "Access to Justice",
      shortLabel: "Access to justice",
    },
    {
      id: "peacebuilding-anti-violence",
      label: "Peacebuilding & Anti-Violence",
      shortLabel: "Peacebuilding & anti-violence",
    },
    {
      id: "democracy-civic-voice",
      label: "Democracy, Civic Voice & Anti-Authoritarianism",
      shortLabel: "Democracy & civic voice",
    },
  ],

  /* 6. Community Wellbeing, Safety & Resilience */
  "community-wellbeing-safety-resilience": [
    {
      id: "food-security",
      label: "Food Security",
      shortLabel: "Food security",
    },
    {
      id: "clean-water-access",
      label: "Clean Water Access",
      shortLabel: "Access to clean water",
    },
    {
      id: "housing-urban-renewal",
      label: "Housing & Urban Renewal",
      shortLabel: "Housing & urban renewal",
    },
    {
      id: "community-safety",
      label: "Community Safety",
      shortLabel: "Community safety",
    },
    {
      id: "violence-prevention",
      label: "Violence Prevention",
      shortLabel: "Violence prevention",
    },
    {
      id: "local-leadership-capacity-building",
      label: "Local Leadership & Capacity Building",
      shortLabel: "Local leadership & capacity building",
    },
    {
      id: "health-access-rural-indigenous",
      label: "Health Access (especially rural & Indigenous)",
      shortLabel: "Health access (rural & Indigenous)",
    },
    {
      id: "post-conflict-post-trauma-community-healing",
      label: "Post-Conflict / Post-Trauma Community Healing",
      shortLabel: "Post-conflict community healing",
    },
    {
      id: "ethical-regenerative-travel",
      label: "Ethical Travel & Regenerative Tourism",
      shortLabel: "Ethical & regenerative travel",
    },
  ],

  /* 7. Arts, Culture, Storytelling & Representation */
  "arts-culture-storytelling-representation": [
    {
      id: "freedom-of-expression",
      label: "Freedom of Expression",
      shortLabel: "Freedom of expression",
    },
    {
      id: "arts-cultural-preservation",
      label: "Cultural Preservation",
      shortLabel: "Cultural preservation",
    },
    {
      id: "arts-heritage-traditional-knowledge",
      label: "Heritage & Traditional Knowledge",
      shortLabel: "Heritage & traditional knowledge",
    },
    {
      id: "representation-in-the-arts",
      label: "Representation in the Arts",
      shortLabel: "Representation in the arts",
    },
    {
      id: "equity-in-storytelling",
      label: "Equity in Storytelling",
      shortLabel: "Equity in storytelling",
    },
    {
      id: "narrative-justice",
      label: "Narrative Justice",
      shortLabel: "Narrative justice",
    },
    {
      id: "intergenerational-storytelling",
      label: "Intergenerational Storytelling",
      shortLabel: "Intergenerational storytelling",
    },
    {
      id: "community-creative-expression",
      label: "Community Creative Expression",
      shortLabel: "Community creative expression",
    },
    {
      id: "artistic-rights-access",
      label: "Artistic Rights & Access",
      shortLabel: "Artistic rights & access",
    },
    {
      id: "cross-cultural-exchange-solidarity",
      label: "Cross-Cultural Exchange & Solidarity",
      shortLabel: "Cross-cultural solidarity",
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