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
  /** Top-level key OR a nested path like "story.title" */
  key: keyof AlumniProfile | string;
  path?: string; // explicit dot path if needed (e.g., "story.title")
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
  "Actor","Director","Designer","Dramaturg","Playwright","Writer",
  "Teaching Artist / Workshop Leader","Mentor","Filmmaker",
  "Project Photographer / Videographer","Production Stage Manager",
  "Assistant Stage Manager / Crew","Event Host / Emcee / Moderator / Speaker",
  "Road Manager","Staff / Administrator","Other",
].map(v => ({ value: v as RoleAtDAT, label: v }));

export const IDENTITY_OPTIONS: { value: IdentityTag; label: string }[] = [
  "Global Majority","LGBTQIA+","Disabled","Immigrant/First-Gen",
  "Parent/Caregiver","Veteran","Rural","Indigenous","Other",
].map(v => ({ value: v as IdentityTag, label: v }));

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
  {
    key: "artistStatement",
    label: "Artist Statement / Short Bio",
    kind: "textarea",
    maxLen: 1500,
    help:
      "A few lines about your creative journey, what you make (or made), or where the adventure took you. This appears at the top of your profile.",
    placeholder:
      "Share what drives your work, what you’re exploring, or where your path has led.",
  },

  // Visuals placed in Profile Basics per your request
  {
    key: "headshotUrl",
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
      { value: "kraft",  label: "Kraft Paper (default)" },
      { value: "ink",    label: "Plum Ink" },
      { value: "teal",   label: "Teal" },
      { value: "gold",   label: "Gold" },
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
    help:
      "Link to your site, portfolio, or résumé for deeper context.",
  },
  {
    key: "instagram",
    label: "Instagram",
    kind: "text",
    placeholder: "@handle or profile URL",
    help:
      "Paste your @handle or a profile URL — we’ll store the canonical handle and render a clean link.",
  },
  { key: "x",        label: "X (Twitter)", kind: "text",  placeholder: "@handle or profile URL" },
  { key: "tiktok",   label: "TikTok",      kind: "text",  placeholder: "@handle or profile URL" },
  { key: "threads",  label: "Threads",     kind: "text",  placeholder: "@handle or profile URL" },
  {
    key: "bluesky",
    label: "Bluesky",
    kind: "text",
    placeholder: "@handle or profile URL (e.g., name.bsky.social)",
  },
  { key: "linkedin", label: "LinkedIn",    kind: "url",   placeholder: "https://linkedin.com/in/…" },
  { key: "youtube",  label: "YouTube",     kind: "url",   placeholder: "https://youtube.com/…" },
  { key: "vimeo",    label: "Vimeo",       kind: "url",   placeholder: "https://vimeo.com/…" },
  { key: "facebook", label: "Facebook",    kind: "url",   placeholder: "https://facebook.com/…" },
  { key: "linktree", label: "Linktree",    kind: "url",   placeholder: "https://linktr.ee/…" },
  {
    key: "publicEmail",
    label: "Public Email",
    kind: "email",
    help:
      "Only include a public or professional email you’re comfortable displaying. You can remove it anytime.",
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
    help:
      "Optional link to tickets, press, project page, or a relevant post.",
  },
  {
    key: "currentUpdateExpiresAt",
    label: "Update Expires",
    kind: "date",
    help:
      "Your update will auto-archive after this date so your profile stays fresh. (Default is ~90 days if you leave this blank.)",
  },

  // ───────────────────────────────────────────────── Story Map (nested story.*)
  {
    key: "story.title",
    path: "story.title",
    label: "Story Title",
    kind: "text",
    help:
      "A short title or headline that captures the heart of your story, project, or experience.",
  },
  {
    key: "story.program",
    path: "story.program",
    label: "Associated Program",
    kind: "select",
    options: ["ACTion","Creative Trek","Teaching Artist Residency","RAW: Galápagos","Other"]
      .map(v => ({ value: v, label: v })),
    help:
      "Choose the one DAT program this particular story is about.",
  },
  {
    key: "story.programCountry",
    path: "story.programCountry",
    label: "Program Country",
    kind: "select",
    options: ["Ecuador","Slovakia","Tanzania","USA","Other"].map(v => ({ value: v, label: v })),
    help:
      "Country associated with that program instance (if applicable).",
  },
  {
    key: "story.years",
    path: "story.years",
    label: "Year(s)",
    kind: "text",
    placeholder: "2016 or 2015–2016",
    help:
      "The year this story took place. If it spanned time, add a simple range (e.g., 2015–2016).",
  },
  {
    key: "story.location",
    path: "story.location",
    label: "Story Location (map pin)",
    kind: "text",
    placeholder: "City/Region or Landmark",
    help:
      "City, region, or landmark where this story unfolded. We’ll use this text on the map pin.",
  },
  {
    key: "story.partners",
    path: "story.partners",
    label: "Partners",
    kind: "text",
    help:
      "Individuals, organizations, or communities who were part of the story.",
  },
  {
    key: "story.mediaUrl",
    path: "story.mediaUrl",
    label: "Story Media URL",
    kind: "url",
    help:
      "Link to a meaningful image, video, or document. We can download and archive it to preserve your story.",
  },
  {
    key: "story.shortStory",
    path: "story.shortStory",
    label: "Short Story",
    kind: "textarea",
    maxLen: 1200,
    help:
      "Tell us what happened — in a paragraph or two. What was the experience, the impact, and what made it meaningful?",
  },
  {
    key: "story.url",
    path: "story.url",
    label: "External Link",
    kind: "url",
    help:
      "Optional context or further reading (blog post, article, full project page).",
  },
  {
    key: "story.quote",
    path: "story.quote",
    label: "Quote (no quotation marks)",
    kind: "textarea",
    maxLen: 300,
    help:
      "A short line that stayed with you — from you or someone else. Please don’t add quotation marks; we’ll format them for you.",
  },
  {
    key: "story.quoteAuthor",
    path: "story.quoteAuthor",
    label: "Quote Author",
    kind: "text",
    help:
      "Who said the quote? If it’s you, include your name as you’d like it to appear.",
  },

  // ───────────────────────────────────────────────── Tech Support
  {
    key: "support.bug",
    path: "support.bug",
    label: "Report a Bug",
    kind: "textarea",
    maxLen: 1000,
    help:
      "What broke, where did it happen, and what did you expect to see? Include steps to reproduce if you can.",
  },
  {
    key: "support.feature",
    path: "support.feature",
    label: "Request a Feature",
    kind: "textarea",
    maxLen: 1000,
    help:
      "What would make this better for you or the community? Share the goal, not just the button.",
  },
  {
    key: "support.assistance",
    path: "support.assistance",
    label: "Request Technical Assistance",
    kind: "textarea",
    maxLen: 1000,
    help:
      "Tell us what you’re trying to do and where you’re getting stuck. We’ll follow up to help.",
  },
];

/** Section groupings used by the renderer */
export const PROFILE_GROUPS: Record<string, string[]> = {
  // Make sure “Profile Basics” renders first and can be default-open in the UI.
  "Profile Basics": [
    "name","slug","currentRole",
    "location","isBiCoastal","secondLocation",
    "identityTags","artistStatement",
    "headshotUrl","backgroundStyle",
  ],

  "Roles (DAT & Current)": [
    "datRoles",
  ],

  "Contact": [
    "website","instagram","x","tiktok","threads","bluesky",
    "linkedin","youtube","vimeo","facebook","linktree",
    "publicEmail",
  ],

  "Current Update": [
    "currentUpdateText","currentUpdateLink","currentUpdateExpiresAt",
  ],

  "Story Map Contribution": [
    "story.title","story.program","story.programCountry","story.years","story.location",
    "story.partners","story.mediaUrl","story.shortStory","story.url","story.quote","story.quoteAuthor",
  ],

  "Tech Support": [
    "support.bug","support.feature","support.assistance",
  ],
};
