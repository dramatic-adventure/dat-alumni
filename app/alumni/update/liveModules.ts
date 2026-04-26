import type { UploadKind } from "@/lib/uploader";

// ------------------------------------------------------------
// Module definitions + Live-key filtering (single source of truth)
// ------------------------------------------------------------
export type ModuleKey =
  | "Basics"
  | "Identity"
  | "Roles"
  | "Contact"
  | "CurrentUpdate"
  | "StoryMap"
  | "UpcomingEvent"
  | "Media";

/**
 * LIVE_KEYS — the set of keys the alumni-save flow is allowed to consider.
 *
 * Ownership note:
 *  - Alumni-editable fields: exposed through some module in MODULES below.
 *  - Admin-only fields (bioShort, spotlight, programs, tags, statusFlags):
 *      kept in LIVE_KEYS so admin tools that save them still work, but they
 *      are NOT listed in any module. The /api/alumni/save route ALSO gates
 *      these keys so only admins can persist them.
 *  - System fields (storyKey, storyTimeStamp): listed for read-through;
 *      never written by alumni flows.
 */
export const LIVE_KEYS = new Set<string>(
  Object.freeze([
    // Basics / Identity
    "name",
    "slug",
    "location",
    "isBiCoastal",
    "secondLocation",
    "backgroundStyle",
    "bioLong",
    "pronouns",
    "roles",
    "identityTags",
    "practiceTags",
    "exploreCareTags",
    "languages",
    "currentTitle",
    "currentWork",
    "currentHeadshotId",
    "currentHeadshotUrl",
    "featuredAlbumId",
    "featuredReelId",
    "featuredEventId",

    // Admin-only curation (gated in save route)
    "bioShort",
    "spotlight",
    "programs",
    "tags",
    "statusFlags",

    // Contact
    "website",
    "showWebsite",
    "showPublicEmail",
    "primarySocial",
    "instagram",
    "linkedin",
    "vimeo",
    "youtube",
    "imdb",
    "facebook",
    "tiktok",
    "threads",
    "bluesky",
    "x",
    "linktree",
    "newsletter",
    "publicEmail",

    // Current Update
    "currentUpdateText",
    "currentUpdateLink",
    "currentUpdateExpiresAt",

    // Upcoming Event
    "upcomingEventTitle",
    "upcomingEventLink",
    "upcomingEventDate",
    "upcomingEventExpiresAt",
    "upcomingEventDescription",
    "upcomingEventCity",
    "upcomingEventStateCountry",
    "upcomingEventMediaType",
    "upcomingEventMediaUrl",
    "upcomingEventMediaAlt",
    "upcomingEventVideoAutoplay",

    // Story Map
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

    // System (read-only — `storyKey` is the code-side name; sheet header is
    // `activeStoryKey`. The save route aliases both to the same canonical key.)
    "storyKey",
    "activeStoryKey",
    "storyTimeStamp",
  ])
);

export function keysForSaving(keys: string[]) {
  // Identity-free: only filters keys against LIVE_KEYS.
  // Never consult viewer/target identity here.
  return (keys || []).map(String).filter((k) => LIVE_KEYS.has(k));
}

export const MODULES = {
  Basics: {
    fieldKeys: keysForSaving([
      "slug",
      "name",
      "location",
      "isBiCoastal",
      "secondLocation",
      "backgroundStyle",
      "currentHeadshotId",
      "currentHeadshotUrl",
      "bioLong",
      "currentTitle",
      "currentWork",
    ]),
    uploadKinds: [],
  },

  Identity: {
    fieldKeys: keysForSaving([
      "pronouns",
      "identityTags",
      "practiceTags",
      "exploreCareTags",
      "languages",
      "currentTitle",
    ]),
    uploadKinds: [],
  },

  Roles: {
    fieldKeys: keysForSaving(["roles"]),
    uploadKinds: [],
  },

  Contact: {
    fieldKeys: keysForSaving([
      "website",
      "showWebsite",
      "showPublicEmail",
      "primarySocial",
      "instagram",
      "linkedin",
      "vimeo",
      "youtube",
      "imdb",
      "facebook",
      "tiktok",
      "threads",
      "bluesky",
      "x",
      "linktree",
      "newsletter",
      "publicEmail",
    ]),
    uploadKinds: [],
  },

  CurrentUpdate: {
    fieldKeys: keysForSaving([
      "currentUpdateText",
      "currentUpdateLink",
      "currentUpdateExpiresAt",
    ]),
    uploadKinds: [],
  },

  StoryMap: {
    fieldKeys: keysForSaving([
      "storyTitle",
      "storyProgram",
      "storyCountry",
      "storyYears",
      "storyLocationName",
      "storyPartners",
      "storyShortStory",
      "storyQuote",
      "storyQuoteAttribution",
      "storyMediaUrl",
      "storyMoreInfoUrl",
      "storyShowOnMap",
    ]),
    uploadKinds: [],
  },

  UpcomingEvent: {
    fieldKeys: keysForSaving([
      "upcomingEventTitle",
      "upcomingEventLink",
      "upcomingEventDate",
      "upcomingEventExpiresAt",
      "upcomingEventDescription",
      "upcomingEventCity",
      "upcomingEventStateCountry",
      "featuredEventId",
      "upcomingEventMediaType",
      "upcomingEventMediaUrl",
      "upcomingEventMediaAlt",
      "upcomingEventVideoAutoplay",
    ]),
    uploadKinds: ["event"],
  },

  // Media IDs are typically set by the upload pipeline, not typed by the user.
  // Listing them here exposes them to the save whitelist so upload handlers
  // can persist the chosen headshot / featured collection IDs.
  Media: {
    fieldKeys: keysForSaving([
      "currentHeadshotId",
      "currentHeadshotUrl",
      "featuredAlbumId",
      "featuredReelId",
      "featuredEventId",
    ]),
    uploadKinds: [],
  },
} satisfies Record<ModuleKey, { fieldKeys: string[]; uploadKinds: UploadKind[] }>;
