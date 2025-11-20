// lib/stories.ts

export type Story = {
  id: string;
  slug: string;
  title: string;
  locationLabel?: string;
  programLabel?: string;
  teaser?: string;
  heroImage?: string;
  thumbnail?: string;
  causeTags?: string[];
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
    causeTags: ["Indigenous Rights"],
  },
];
