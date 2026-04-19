import { PROFILE_GROUPS } from "@/components/alumni/fields";

// ------------------------------------------------------------
// Edit-key lists used by sheet-driven field rendering.
// These derive directly from PROFILE_GROUPS so the UI and the
// schema cannot drift out of sync.
// ------------------------------------------------------------

export const UpcomingEventEditKeys =
  PROFILE_GROUPS["Upcoming Event"] ?? [
    "upcomingEventTitle",
    "upcomingEventLink",
    "upcomingEventDate",
    "upcomingEventExpiresAt",
    "upcomingEventDescription",
  ];

export const ContactEditKeys =
  PROFILE_GROUPS["Contact"] ?? [
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
