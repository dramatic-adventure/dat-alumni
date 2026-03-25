// lib/stories.ts

import type { DramaClubCause } from "@/lib/causes";

export type Story = {
  id: string;
  slug: string;
  title: string;
  locationLabel?: string;
  programLabel?: string;
  teaser?: string;
  heroImage?: string;
  thumbnail?: string;

  /**
   * Legacy / freeform labels (still respected by /cause/[slug])
   * e.g. ["Indigenous Rights", "Environmental Conservation"]
   */
  causeTags?: string[];

  /**
   * Canonical cause taxonomy hooks (preferred going forward).
   * These plug directly into DramaClubCauseCategory + DramaClubCauseSubcategory.
   */
  causes?: DramaClubCause[];
};

export const stories: Story[] = [
  // TODO: replace with real data
  {
    id: "example-1",
    slug: "example-story",
    title: "Example Story Title",
    locationLabel: "Somewhere, Earth",
    programLabel: "ACTion / RAW",
    teaser: "Short teaser text for this example story.",
    heroImage: "/images/stories/example-hero.jpg",

    // Legacy label (still used by /cause/[slug] matcher)
    causeTags: ["Indigenous Rights"],

    // Canonical taxonomy — this is what the cause page & filters
    // should lean on over time.
    causes: [
      {
        category: "indigenous-sovereignty-rights",
        subcategory: "indigenous-land-rights",
      },
    ],
  },
];
