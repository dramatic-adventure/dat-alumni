// /components/alumni/fields.ts
import type {
  AlumniProfile,
  RoleAtDAT,
  IdentityTag,
  PracticeTag,
  ExploreCareTag,
} from "@/schemas";
import {
  IDENTITY_TAGS,
  PRACTICE_TAGS,
  EXPLORE_CARE_TAGS,
} from "@/lib/alumniTaxonomy";

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

/**
 * "How I Identify" — V1 canonical identity tags.
 * Source of truth: lib/alumniTaxonomy.ts IDENTITY_TAGS.
 * Self-selected only; never inferred; not popularity-sorted.
 */
export const IDENTITY_OPTIONS: { value: IdentityTag; label: string }[] =
  IDENTITY_TAGS.filter((t) => t.status === "active").map((t) => ({
    value: t.label as IdentityTag,
    label: t.label,
  }));

/** "My Artistic Practice" — V1 canonical practice tags. */
export const PRACTICE_OPTIONS: { value: PracticeTag; label: string }[] =
  PRACTICE_TAGS.filter((t) => t.status === "active").map((t) => ({
    value: t.label as PracticeTag,
    label: t.label,
  }));

/** "What I Explore & Care About in My Work" — V1 canonical themes. */
export const EXPLORE_CARE_OPTIONS: { value: ExploreCareTag; label: string }[] =
  EXPLORE_CARE_TAGS.filter((t) => t.status === "active").map((t) => ({
    value: t.label as ExploreCareTag,
    label: t.label,
  }));

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
    key: "currentTitle",
    label: "Current Title / Role",
    kind: "text",
    placeholder: "Actor, Theatremaker, Psychologist, Arts Educator…",
    help:
      "Who you are today — even if your journey has shifted beyond the arts. This appears prominently near your name.",
  },
  {
    key: "currentWork",
    label: "What You’re Working On",
    kind: "text",
    placeholder: "Developing a new play, on tour with X, on sabbatical…",
    help:
      "A short line about what’s active for you right now — a project, tour, role, or current chapter.",
  },
  {
    key: "pronouns",
    label: "Pronouns",
    kind: "text",
    placeholder: "she/her, they/them, he/him…",
    help: "Optional. How you'd like to be referred to on your profile.",
  },
  {
    key: "languages",
    label: "Languages",
    kind: "text",
    placeholder: "English, Spanish, Twi…",
    help: "Comma-separated list of languages you speak.",
  },
  {
    key: "roles",
    label: "Roles",
    kind: "text",
    help:
      "Comma-separated list of hats you wear — onstage, backstage, in leadership, or in your current life/work.",
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
    label: "How I Identify",
    kind: "multiselect",
    options: IDENTITY_OPTIONS,
    help:
      "Optional self-identified tags that may help others understand your perspective and lived context. Pick up to 3.",
  },
  {
    key: "practiceTags",
    label: "My Artistic Practice",
    kind: "multiselect",
    options: PRACTICE_OPTIONS,
    help:
      "Select the forms, methods, or modes of making that best reflect your work. Pick up to 3.",
  },
  {
    key: "exploreCareTags",
    label: "What I Explore & Care About in My Work",
    kind: "multiselect",
    options: EXPLORE_CARE_OPTIONS,
    help:
      "Select the themes, questions, and causes that most shape your work. Pick up to 4.",
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
    label: "Background Texture",
    kind: "select",
    options: [
      { value: "kraft", label: "Kraft Paper" },
      { value: "leather", label: "Leather" },
    ],
    help: "Choose a background texture for your profile. Kraft Paper is the default.",
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
    key: "primarySocial",
    label: "Primary Social (featured)",
    kind: "select",
    options: [
      { value: "", label: "(none)" },
      { value: "instagram", label: "Instagram" },
      { value: "x", label: "X (Twitter)" },
      { value: "tiktok", label: "TikTok" },
      { value: "threads", label: "Threads" },
      { value: "bluesky", label: "Bluesky" },
      { value: "linkedin", label: "LinkedIn" },
      { value: "youtube", label: "YouTube" },
      { value: "vimeo", label: "Vimeo" },
      { value: "imdb", label: "IMDb" },
      { value: "facebook", label: "Facebook" },
      { value: "linktree", label: "Linktree" },
      { value: "website", label: "Website" },
    ],
    help: "Which link should be featured most prominently on your profile.",
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
    key: "imdb",
    label: "IMDb",
    kind: "text",
    placeholder: "nm1234567 or full IMDb URL",
    help: "Paste your IMDb name ID (e.g., nm1234567) or a full IMDb URL.",
  },
  {
    key: "newsletter",
    label: "Newsletter",
    kind: "url",
    placeholder: "https://yourname.substack.com or similar",
    help: "Link to your newsletter subscription page (Substack, Beehiiv, Mailchimp, etc.).",
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

  // ───────────────────────────────────────────────── Upcoming Event
  {
    key: "upcomingEventTitle",
    label: "Event Title",
    kind: "text",
    help: "What's happening — the name of the performance, screening, workshop, or appearance.",
  },
  {
    key: "upcomingEventLink",
    label: "Tickets / Info Link",
    kind: "url",
    placeholder: "https://…",
    help: "Where people can get tickets, RSVP, watch, or learn more.",
  },
  {
    key: "upcomingEventDate",
    label: "Event Date",
    kind: "date",
    help: "When it happens.",
  },
  {
    key: "upcomingEventExpiresAt",
    label: "Stop Showing After",
    kind: "date",
    help:
      "When to remove this from your public profile. Defaults to the event date if left blank.",
  },
  {
    key: "upcomingEventDescription",
    label: "Short Description",
    kind: "textarea",
    maxLen: 600,
    help: "A short invitation — what will people experience? Keep it conversational, not a press release.",
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

  // Profile-Live header: storyShowOnMap (single prefix, confirmed against live sheet)
  {
    key: "storyShowOnMap",
    label: "Show on Map?",
    kind: "toggle",
    help:
      "Turn this on when you’re ready for this story to appear publicly on the map (admins can add lat/lng later).",
  },

  // NOTE: Tech Support inputs (bug report / feature request / assistance)
  // are NOT profile fields. They route through their own submission endpoint
  // and must not be part of PROFILE_FIELDS / PROFILE_GROUPS / LIVE_KEYS.
];

/**
 * Section groupings used by the renderer and by editKeys.ts.
 *
 * Canonical rule: every alumni-editable field must appear in exactly one group.
 * Admin-only and server-controlled fields must NOT appear here.
 */
export const PROFILE_GROUPS: Record<string, string[]> = {
  "Profile Basics": [
    "name",
    "slug",
    "currentTitle",
    "currentWork",
    "pronouns",
    "languages",
    "roles",
    "location",
    "isBiCoastal",
    "secondLocation",
    "identityTags",
    "practiceTags",
    "exploreCareTags",
    "bioLong",
    "currentHeadshotUrl",
    "backgroundStyle",
  ],

  "Contact": [
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
  ],

  "Current Update": [
    "currentUpdateText",
    "currentUpdateLink",
    "currentUpdateExpiresAt",
  ],

  "Upcoming Event": [
    "upcomingEventTitle",
    "upcomingEventLink",
    "upcomingEventDate",
    "upcomingEventExpiresAt",
    "upcomingEventDescription",
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
};
