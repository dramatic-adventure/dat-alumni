// /components/alumni/fields.ts
import type { AlumniProfile, RoleAtDAT, IdentityTag } from "@/schemas";

/** What kinds of UI controls we’ll render later */
export type FieldKind =
  | "text"
  | "textarea"
  | "url"
  | "email"
  | "select"
  | "multiselect"
  | "toggle"
  | "chips"
  | "date";

/** Field definition used by our generic renderer */
export type FieldDef = {
  /** Top-level key OR a nested path like "storyTitle" */
  key: keyof AlumniProfile | string;
  path?: string; // keep for compatibility; we won’t use nested story.* anymore
  label: string;
  kind: FieldKind;
  required?: boolean;
  placeholder?: string;
  help?: string;
  maxLen?: number;
  /** For selects/multiselects */
  options?: { value: string; label: string }[];
};

/** Options — roles & identity (can be loaded from Sheets later) */
export const ROLE_OPTIONS: { value: RoleAtDAT; label: string }[] = [
  "Actor",
  "Director",
  "Designer",
  "Dramaturg",
  "Playwright",
  "Writer",
  "Teaching Artist / Workshop Leader",
  "Mentor",
  "Filmmaker",
  "Project Photographer / Videographer",
  "Production Stage Manager",
  "Assistant Stage Manager / Crew",
  "Event Host / Emcee / Moderator / Speaker",
  "Road Manager",
  "Staff / Administrator",
  "Other",
].map((v) => ({ value: v as RoleAtDAT, label: v }));

export const IDENTITY_OPTIONS: { value: IdentityTag; label: string }[] = [
  "Global Majority",
  "LGBTQIA+",
  "Disabled",
  "Immigrant/First-Gen",
  "Parent/Caregiver",
  "Veteran",
  "Rural",
  "Indigenous",
  "Other",
].map((v) => ({ value: v as IdentityTag, label: v }));

/**
 * NOTE:
 * We are switching Story Map fields from nested `story.*` to flat keys
 * that can live in Profile-Live cleanly, then sync into Map Data.
 *
 * Profile-Live headers you shared (story-related):
 * storyTitle, storyProgram, storyLocationName, storyYears, storyPartners,
 * storyShortStory, storyQuote, storyQuoteAttribution, storyMediaUrl,
 * storyMoreInfoUrl, storyCountry, showOnMap
 *
 * (We are NOT inventing extra story columns in Profile-Live here.)
 */

/** All form fields, config-driven */
export const PROFILE_FIELDS: FieldDef[] = [
  // ───────────────────────────────────────────────── Profile Basics
  {
    key: "name",
    label: "Public Name",
    kind: "text",
    required: true,
    maxLen: 120,
    help:
      "The name that appears on your profile and Story Map. If you change this, we’ll suggest a new profile URL (slug) so your link matches your name.",
    placeholder: "e.g., Isabel Martínez",
  },
  {
    key: "slug",
    label: "Profile URL (slug)",
    kind: "text",
    required: true,
    help:
      "Lowercase with dashes only. If your slug changes later, old links will automatically redirect to the new one so nothing breaks.",
    placeholder: "isabel-martinez",
  },
  {
    key: "currentRole",
    label: "Current Role / Title",
    kind: "text",
    placeholder: "Actor, Theatremaker, Psychologist, Arts Educator…",
    help:
      "Who you are today — even if your journey has shifted beyond the arts. This appears prominently near your name.",
  },
  {
    key: "location",
    label: "Primary Location",
    kind: "text",
    placeholder: "City, Country",
    help:
      "Where you’re based most of the time. Including city + country helps connect you with alumni and opportunities nearby.",
  },
  {
    key: "isBiCoastal",
    label: "Bi-coastal / Multi-base",
    kind: "toggle",
    help:
      "Toggle this on if you split time between places. We’ll display locations like “NYC ⇄ LA.”",
  },
  {
    key: "secondLocation",
    label: "Second Base",
    kind: "text",
    placeholder: "City, Country",
    help:
      "If you’re bi-coastal or multi-base, add your additional location here.",
  },
  {
    key: "identityTags",
    label: "Identity Tags",
    kind: "multiselect",
    options: IDENTITY_OPTIONS,
    help:
      "Optional discovery tags. Choose any that feel true to you. These help alumni find collaborators and shared communities.",
  },

  // ✅ bioLong
  {
    key: "bioLong",
    label: "Artist Statement / Short Bio",
    kind: "textarea",
    maxLen: 1500,
    help:
      "A few lines about your creative journey, what you make (or made), or where the adventure took you. This appears at the top of your profile.",
    placeholder:
      "Share what drives your work, what you’re exploring, or where your path has led.",
  },

  // Visuals placed in Profile Basics
  {
    key: "currentHeadshotUrl",
    label: "Headshot (URL or upload via the uploader above)",
    kind: "url",
    help:
      "Paste a direct image link if you prefer. We’ll download and archive a copy so it remains preserved. (Alt text and credit can be added in the media section.)",
    placeholder: "https://example.com/your-headshot.jpg",
  },

  {
    key: "backgroundStyle",
    label: "Background Theme",
    kind: "select",
    options: [
      { value: "kraft", label: "Kraft Paper (default)" },
      { value: "ink", label: "Plum Ink" },
      { value: "teal", label: "Teal" },
      { value: "gold", label: "Gold" },
      { value: "purple", label: "Purple" },
    ],
    help:
      "Choose a subtle background to match your vibe. You can change this anytime; “Kraft” is the default.",
  },

  // ───────────────────────────────────────────────── Roles (DAT & Current)
  {
    key: "datRoles",
    label: "Roles with DAT",
    kind: "multiselect",
    options: ROLE_OPTIONS,
    help:
      "Select every hat you’ve worn with DAT — onstage, backstage, or in leadership. We’ll surface these as badges on your profile.",
  },

  // ───────────────────────────────────────────────── Links & Contact
  {
    key: "website",
    label: "Website / Portfolio",
    kind: "url",
    placeholder: "https://…",
    help: "Link to your site, portfolio, or résumé for deeper context.",
  },
  {
    key: "instagram",
    label: "Instagram",
    kind: "text",
    placeholder: "@handle, handle, or profile URL",
    help:
      "Paste @handle, just the handle, or a full URL. We’ll save a clean link like https://www.instagram.com/yourhandle.",
  },
  {
    key: "x",
    label: "X (Twitter)",
    kind: "text",
    placeholder: "@handle, handle, or profile URL",
    help: "Paste @handle, handle, or a full URL. We’ll save a clean profile link.",
  },
  {
    key: "tiktok",
    label: "TikTok",
    kind: "text",
    placeholder: "@handle, handle, or profile URL",
    help: "Paste @handle, handle, or a full URL. We’ll save a clean profile link.",
  },
  {
    key: "threads",
    label: "Threads",
    kind: "text",
    placeholder: "@handle, handle, or profile URL",
    help: "Paste @handle, handle, or a full URL. We’ll save a clean profile link.",
  },
  {
    key: "bluesky",
    label: "Bluesky",
    kind: "text",
    placeholder: "handle (e.g., name.bsky.social) or profile URL",
    help:
      "Paste @handle, handle (including custom domains), or a full URL. We’ll save a clean profile link.",
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    kind: "text",
    placeholder: "handle (after /in/) or profile URL",
    help:
      "Paste your handle (the part after /in/) or a full profile URL. We’ll save https://www.linkedin.com/in/yourhandle.",
  },
  {
    key: "youtube",
    label: "YouTube",
    kind: "text",
    placeholder: "@handle, channel URL, or video URL",
    help:
      "Paste @handle, a channel URL, or any YouTube URL. If you paste just a handle, we’ll save https://www.youtube.com/@yourhandle.",
  },
  {
    key: "vimeo",
    label: "Vimeo",
    kind: "text",
    placeholder: "handle or profile URL",
    help: "Paste your handle or a full URL. We’ll save https://vimeo.com/yourhandle.",
  },
  {
    key: "facebook",
    label: "Facebook",
    kind: "text",
    placeholder: "username or profile URL",
    help:
      "Paste your username or a full URL. We’ll save https://www.facebook.com/yourname.",
  },
  {
    key: "linktree",
    label: "Linktree",
    kind: "text",
    placeholder: "handle (e.g., yourname) or linktr.ee URL",
    help:
      "Paste your handle or a full Linktree URL. We’ll save a clean link like https://linktr.ee/yourname.",
  },
  {
    key: "publicEmail",
    label: "Public / Professional Email (optional)",
    kind: "email",
    placeholder: "name@yourdomain.com",
    help:
      "This email is shown publicly on your profile (Contact tab). It can be different from the email you use to log in. Leave blank if you don’t want an email displayed.",
  },

  // ───────────────────────────────────────────────── Current Update (auto-archives)
  {
    key: "currentUpdateText",
    label: "Current Update",
    kind: "text",
    maxLen: 160,
    help:
      "One line about what you’re up to — touring, an award, a new residency, a creative pause, or anything meaningful right now.",
    placeholder: "Honored to win X award… / On tour with Mamma Mia…",
  },
  {
    key: "currentUpdateLink",
    label: "Update Link",
    kind: "url",
    placeholder: "https://…",
    help: "Optional link to tickets, press, project page, or a relevant post.",
  },
  {
    key: "currentUpdateExpiresAt",
    label: "Update Expires",
    kind: "date",
    help:
      "Your update will auto-archive after this date so your profile stays fresh. (Default is ~90 days if you leave this blank.)",
  },

  // ───────────────────────────────────────────────── Story Map Contribution (FLAT KEYS that match Profile-Live)
  {
    key: "storyTitle",
    label: "Story Title",
    kind: "text",
    help:
      "A short title or headline that captures the heart of your story, project, or experience.",
  },
  {
    key: "storyProgram",
    label: "Associated Program",
    kind: "select",
    options: [
      "ACTion",
      "Creative Trek",
      "Teaching Artist Residency",
      "RAW: Galápagos",
      "CASTAWAY",
      "PASSAGE",
      "Other",
    ].map((v) => ({ value: v, label: v })),
    help: "Choose the one DAT program this particular story is about.",
  },
  {
    key: "storyCountry",
    label: "Country",
    kind: "select",
    options: ["Ecuador", "Slovakia", "Tanzania", "USA", "Other"].map((v) => ({
      value: v,
      label: v,
    })),
    help: "Country associated with that story/program instance (if applicable).",
  },
  {
    key: "storyYears",
    label: "Year(s)",
    kind: "text",
    placeholder: "2016 or 2015–2016",
    help:
      "The year this story took place. If it spanned time, add a simple range (e.g., 2015–2016).",
  },
  {
    key: "storyLocationName",
    label: "Location Name (map pin label)",
    kind: "text",
    placeholder: "City/Region or Landmark",
    help:
      "City, region, or landmark where this story unfolded. This becomes the map pin label.",
  },
  {
    key: "storyPartners",
    label: "Partners",
    kind: "text",
    help: "Individuals, organizations, or communities who were part of the story.",
  },

  // ✅ IMPORTANT: Profile-Live header is storyMediaUrl (NOT storyImageUrl)
  {
    key: "storyMediaUrl",
    label: "Story Media URL",
    kind: "url",
    help:
      "Link to a meaningful image, video, or document. We can archive it later to preserve your story.",
  },

  // ✅ IMPORTANT: Profile-Live header is storyMoreInfoUrl (NOT storyMoreInfoLink)
  {
    key: "storyMoreInfoUrl",
    label: "More Info Link",
    kind: "url",
    help: "Optional: article, blog post, press, or project page.",
  },

  {
    key: "storyShortStory",
    label: "Short Story",
    kind: "textarea",
    maxLen: 1200,
    help:
      "Tell us what happened — in a paragraph or two. What was the experience, the impact, and what made it meaningful?",
  },
  {
    key: "storyQuote",
    label: "Quote (no quotation marks)",
    kind: "textarea",
    maxLen: 300,
    help:
      "A short line that stayed with you — from you or someone else. Please don’t add quotation marks; we’ll format them for you.",
  },
  {
    key: "storyQuoteAttribution",
    label: "Quote Author",
    kind: "text",
    help: "Who said the quote? If it’s you, include your name as you’d like it to appear.",
  },

  // ✅ IMPORTANT: Profile-Live header is storystoryShowOnMap (NOT storyShowOnMap)
  {
    key: "storyShowOnMap",
    label: "Show on Map?",
    kind: "toggle",
    help:
      "Turn this on when you’re ready for this story to appear publicly on the map (admins can add lat/lng later).",
  },

  // ───────────────────────────────────────────────── Tech Support
  {
    key: "supportBug",
    label: "Report a Bug",
    kind: "textarea",
    maxLen: 1000,
    help:
      "What broke, where did it happen, and what did you expect to see? Include steps to reproduce if you can.",
  },
  {
    key: "supportFeature",
    label: "Request a Feature",
    kind: "textarea",
    maxLen: 1000,
    help:
      "What would make this better for you or the community? Share the goal, not just the button.",
  },
  {
    key: "supportAssistance",
    label: "Request Technical Assistance",
    kind: "textarea",
    maxLen: 1000,
    help:
      "Tell us what you’re trying to do and where you’re getting stuck. We’ll follow up to help.",
  },
];

/** Section groupings used by the renderer */
export const PROFILE_GROUPS: Record<string, string[]> = {
  "Profile Basics": [
    "name",
    "slug",
    "currentRole",
    "location",
    "isBiCoastal",
    "secondLocation",
    "identityTags",
    "bioLong",
    "currentHeadshotUrl",
    "backgroundStyle",
  ],

  "Roles (DAT & Current)": ["datRoles"],

  "Contact": [
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
  ],

  "Current Update": [
    "currentUpdateText",
    "currentUpdateLink",
    "currentUpdateExpiresAt",
  ],

  // ✅ Flat keys that match Profile-Live headers
  "Story Map Contribution": [
    "storyTitle",
    "storyProgram",
    "storyCountry",
    "storyYears",
    "storyLocationName",
    "storyPartners",
    "storyMediaUrl",
    "storyMoreInfoUrl",
    "storyShortStory",
    "storyQuote",
    "storyQuoteAttribution",
    "storyShowOnMap",
  ],

  "Tech Support": ["supportBug", "supportFeature", "supportAssistance"],
};
