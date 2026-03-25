import { PROFILE_GROUPS } from "@/components/alumni/fields";

// ------------------------------------------------------------
// ✅ DROPDOWN SECTIONS: ALWAYS RENDER
// ------------------------------------------------------------

// Prefer groups if present, otherwise fallback keys.

export const UpcomingEventEditKeys =
  PROFILE_GROUPS["Upcoming Event"] ??
  PROFILE_GROUPS["Events"] ??
  [
    "upcomingEventTitle",
    "upcomingEventLink",
    "upcomingEventDate",
    "upcomingEventExpiresAt",
    "upcomingEventDescription",
  ];

export const ContactEditKeys = [
  "website",
  "instagram",
  "x",
  "tiktok",
  "threads",
  "bluesky",
  "linkedin",
  "primarySocial",
  "youtube",
  "vimeo",
  "imdb",
  "facebook",
  "linktree",
  "publicEmail",
];

// ✅ Story Map section keys (match Profile-Live headers)
export const StoryMapEditKeys =
  PROFILE_GROUPS["Story Map Contribution"] ?? [
    "storyTitle",
    "storyProgram",
    "storyLocationName",
    "storyYears",
    "storyPartners",
    "storyShortStory",
    "storyQuote",
    "storyQuoteAttribution",
    "storyMediaUrl",
    "storyMoreInfoUrl",
    "storyCountry",
    "storyShowOnMap",
  ];
