// lib/donate/leftColumnContent.ts

export type SponsorModeId =
  | "drama_club"
  | "artist"
  | "new_work"
  | "special_project"
  | "cause"
  | "story";

export type LeftColumnContent = {
  title: string;
  description: string;

  section1Title: string;
  section1Body: string;

  section2Title: string;
  section2Bullets: string[];

  section3Title: string;
  section3Bullets: string[];
  section3Note?: string;

  section4Title: string;
  section4Body?: string;
  modeLinks: Array<{ id: SponsorModeId; label: string }>;

  imageSrc: string;
  imageAlt: string;
};

const ALL_MODE_LINKS: Array<{ id: SponsorModeId; label: string }> = [
  { id: "drama_club", label: "Sponsor a Drama Club" },
  { id: "artist", label: "Sponsor an Artist" },
  { id: "new_work", label: "Sponsor a New Work" },
  { id: "special_project", label: "Sponsor a Special Project" },
  { id: "cause", label: "Sponsor the Cause" },
  { id: "story", label: "Sponsor the Story" },
];

// Helper: keep mode links consistent, but omit the current mode
function linksExcept(current: SponsorModeId) {
  return ALL_MODE_LINKS.filter((l) => l.id !== current);
}

export const LEFT_COLUMN_BY_MODE: Record<SponsorModeId, LeftColumnContent> = {
  story: {
    title: "Sponsor the Story",
    description:
      "Your gift gives DAT flexible fuel—directed where it’s needed most to keep stories moving and communities supported.",

    section1Title: "What it means to sponsor the story",
    section1Body:
      "Sponsoring the story supports the full Dramatic Adventure Theatre ecosystem — artists, youth programs, new work, and community partnerships — with the flexibility to respond where support is needed most.\n\nThis is how the work stays alive between projects, across countries, and over time.",

    section2Title: "Your support helps sustain",
    section2Bullets: [
      "Ongoing youth drama clubs and teaching residencies",
      "Artists developing new work with time, care, and accountability",
      "Community partnerships that extend beyond a single visit or performance",
    ],

    section3Title: "How flexible support is used",
    section3Bullets: [
      "Artist stipends, honoraria, and mentorship",
      "Rehearsal space, materials, documentation, and logistics",
      "Translation, coordination, and local transportation",
      "Continuity across ACTion, RAW, CASTAWAY, and drama clubs",
    ],
    section3Note:
      "Flexible funding allows DAT to plan responsibly, respond quickly, and avoid short-term decision making.",

    section4Title: "Looking for something more specific?",
    section4Body:
      "You can direct your support toward a particular focus — switch anytime and the page updates instantly.",
    modeLinks: linksExcept("story"),

    imageSrc: "/images/donate/body-general.jpg",
    imageAlt: "Artists and community collaborators in a shared creative moment",
  },

  drama_club: {
    title: "Sponsor a Drama Club",
    description:
      "Support consistent, youth-centered theatre in one community — sustained over time, not just for a moment.",

    section1Title: "What you’re supporting",
    section1Body:
      "A drama club is a steady creative room: weekly practice, local mentorship, and a place where young people build confidence through story.",

    section2Title: "Your support helps sustain",
    section2Bullets: [
      "Weekly sessions for young people",
      "Long-term relationships with local teaching artists",
      "A safe, creative space for expression and growth",
    ],

    section3Title: "How your gift is used",
    section3Bullets: [
      "Teaching artist stipends",
      "Weekly sessions and rehearsal materials",
      "Community performances and gatherings",
      "Year-round continuity for the club",
    ],
    section3Note: "This support keeps the club consistent and locally led.",

    section4Title: "Prefer a different focus?",
    section4Body:
      "Switch modes anytime — the story and tiers update to match your intent.",
    modeLinks: linksExcept("drama_club"),

    imageSrc: "/images/donate/body-drama-club.jpg",
    imageAlt: "Young people in a drama club session",
  },

  artist: {
    title: "Sponsor an Artist",
    description:
      "Back an individual artist’s process — time, mentorship, and the support it takes to make work that matters.",

    section1Title: "What you’re supporting",
    section1Body:
      "This mode supports the artist’s full arc of creation — research, rehearsal, revision, and ethical collaboration — not just the final product.",

    section2Title: "Your support helps sustain",
    section2Bullets: [
      "Dedicated time for research, rehearsal, and creation",
      "Opportunities for reflection, feedback, and revision",
      "Accountable collaboration with communities connected to the work",
    ],

    section3Title: "How your gift is used",
    section3Bullets: [
      "Artist stipends",
      "Development time and space",
      "Community engagement sessions",
      "Documentation of the creative process",
    ],
    section3Note: "Support the process so the outcome can be honest.",

    section4Title: "Prefer a different focus?",
    section4Body:
      "Switch modes anytime — the story and tiers update to match your intent.",
    modeLinks: linksExcept("artist"),

    imageSrc: "/images/donate/body-artist.jpg",
    imageAlt: "An artist in rehearsal and development",
  },

  new_work: {
    title: "Sponsor a New Work",
    description:
      "Help bring a new piece into the world — from development to performance, rooted in place and collaboration.",

    section1Title: "What you’re supporting",
    section1Body:
      "New work takes time: research, rehearsal, refinement, and the resources to share it back with the community that shaped it.",

    section2Title: "Your support helps sustain",
    section2Bullets: [
      "Creation of new stories grounded in lived experience",
      "Collaborative development with local partners",
      "Public sharing through performance or presentation",
    ],

    section3Title: "How your gift is used",
    section3Bullets: [
      "Research and rehearsal time",
      "Artist and collaborator stipends",
      "Production essentials",
      "Community performances and documentation",
    ],
    section3Note:
      "This support keeps creation responsible, collaborative, and complete.",

    section4Title: "Prefer a different focus?",
    section4Body:
      "Switch modes anytime — the story and tiers update to match your intent.",
    modeLinks: linksExcept("new_work"),

    imageSrc: "/images/donate/body-new-work.jpg",
    imageAlt: "Artists developing a new work in process",
  },

  special_project: {
    title: "Sponsor a Special Project",
    description:
      "Support a time-bound initiative — a specific project with a clear purpose, arc, and outcome.",

    section1Title: "What you’re supporting",
    section1Body:
      "Special projects are focused and catalytic: an intensive collaboration responding to a particular place, moment, or opportunity.",

    section2Title: "Your support helps sustain",
    section2Bullets: [
      "Focused collaboration between artists and community partners",
      "Intensive creation over a defined period",
      "A clear outcome with lasting local value",
    ],

    section3Title: "How your gift is used",
    section3Bullets: [
      "Project-specific artist support",
      "Local partnerships and logistics",
      "Materials, space, and documentation",
      "A defined beginning and completion",
    ],
    section3Note: "Clear scope. Real work. A finished arc.",

    section4Title: "Prefer a different focus?",
    section4Body:
      "Switch modes anytime — the story and tiers update to match your intent.",
    modeLinks: linksExcept("special_project"),

    imageSrc: "/images/donate/body-special.jpg",
    imageAlt: "A special project in action with artists and community",
  },

  cause: {
    title: "Sponsor the Cause",
    description:
      "Align your gift with a specific cause — supporting storytelling that deepens understanding through lived experience.",

    section1Title: "What you’re supporting",
    section1Body:
      "This mode supports storytelling shaped by the people closest to the issue — cultural work that prioritizes dignity, truth, and collaboration over messaging.",

    section2Title: "Your support helps sustain",
    section2Bullets: [
      "Story development guided by those most connected to the issue",
      "Art that deepens understanding (not slogans)",
      "Community-centered sharing through performance and gathering",
    ],

    section3Title: "How your gift is used",
    section3Bullets: [
      "Artist facilitation and collaboration",
      "Community-led story development",
      "Ethical documentation and sharing",
      "Public performances and conversations",
    ],
    section3Note: "Values-aligned work, built with care.",

    section4Title: "Prefer a different focus?",
    section4Body:
      "Switch modes anytime — the story and tiers update to match your intent.",
    modeLinks: linksExcept("cause"),

    imageSrc: "/images/donate/body-cause.jpg",
    imageAlt: "Community-centered storytelling aligned with a cause",
  },
};
