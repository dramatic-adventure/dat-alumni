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
  | "TechSupport";

// NOTE: include both storyTimeStamp + storyTimeStamp if your codebase has both.
// If you only want one, keep the canonical one and update the other call sites later.
export const LIVE_KEYS = new Set<string>(
  Object.freeze([
    "name",
    "slug",
    "location",
    "isBiCoastal",
    "secondLocation",
    "backgroundStyle",
    "bioShort",
    "bioLong",
    "pronouns",
    "roles",
    "identityTags",
    "languages",
    "currentWork",
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
    "spotlight",
    "programs",
    "tags",
    "statusFlags",
    "currentHeadshotUrl",
    "currentUpdateText",
    "currentUpdateLink",
    "currentUpdateExpiresAt",
    "upcomingEventTitle",
    "upcomingEventLink",
    "upcomingEventDate",
    "upcomingEventExpiresAt",
    "upcomingEventDescription",
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
    "storyKey",
    "storyTimeStamp", // ✅ keep this if used anywhere
    "storyTimeStamp", // ✅ keep this too if you have mixed casing/spelling elsewhere
    "supportBug",
    "supportFeature",
    "supportAssistance",
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
      "currentHeadshotUrl",
      "bioLong",
      "currentWork",
      "upcomingEventTitle",
      "upcomingEventLink",
      "upcomingEventDate",
      "upcomingEventExpiresAt",
      "upcomingEventDescription",
    ]),
    uploadKinds: [],
  },

  Identity: {
    fieldKeys: keysForSaving(["pronouns", "identityTags", "languages"]),
    uploadKinds: [],
  },

  Roles: {
    fieldKeys: keysForSaving(["roles"]),
    uploadKinds: [],
  },

  Contact: {
    fieldKeys: keysForSaving([
      "website",
      "instagram",
      "x",
      "tiktok",
      "threads",
      "bluesky",
      "linkedin",
      "youtube",
      "vimeo",
      "facebook",
      "linktree",
      "publicEmail",
      "imdb",
      // primarySocial handled by Contact save logic
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
      "storyKey",
      "storyTimeStamp", // ✅ keep consistent with LIVE_KEYS above
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
    ]),
    uploadKinds: [],
  },

  TechSupport: {
    fieldKeys: keysForSaving(["supportBug", "supportFeature", "supportAssistance"]),
    uploadKinds: [],
  },
} satisfies Record<ModuleKey, { fieldKeys: string[]; uploadKinds: UploadKind[] }>;
