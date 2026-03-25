// lib/dramaClubs.ts

export type DramaClub = {
  slug: string;
  name: string;
  location?: string;
  blurb?: string;
  logoSrc?: string;
  logoAlt?: string;
  causeTags?: string[];
};

export const dramaClubs: DramaClub[] = [
  // TEMP SEED DATA — replace / extend with real clubs as needed
  {
    slug: "example-club",
    name: "Example Drama Club",
    location: "Example City, Example Country",
    blurb: "A youth drama club exploring story, voice, and community.",
    logoSrc: "/images/drama-clubs/example-logo.png",
    logoAlt: "Example Drama Club Logo",
    causeTags: ["Indigenous Rights"],
  },
];
