// /components/alumni/formLogic.ts
import type { AlumniProfile } from "@/schemas";
import { PROFILE_FIELDS } from "@/components/alumni/fields";

/** ---------- helpers ---------- */

function safeTrim(v: unknown) {
  return String(v ?? "").trim();
}

const urlish = /^https?:\/\//i;

/** normalize any url-ish thing to https://... or empty string */
function normalizeUrl(s?: string) {
  const t = safeTrim(s);
  if (!t) return "";
  return urlish.test(t) ? t : `https://${t}`;
}

/** Normalize a value into a canonical profile URL (platform base + handle) */
function handleToUrl(opts: {
  input: unknown;
  baseUrl: string; // e.g. https://www.instagram.com/
  // Extract handle from full URLs (optional)
  urlPatterns?: RegExp[];
  // Handles may start with @
  stripAt?: boolean;
  // If input is just a username, optionally prefix (e.g. YouTube @handle)
  prefixHandle?: string; // e.g. "@"
}) {
  const {
    input,
    baseUrl,
    urlPatterns = [],
    stripAt = true,
    prefixHandle = "",
  } = opts;

  const raw = safeTrim(input);
  if (!raw) return "";

  // Already a URL
  if (urlish.test(raw)) {
    for (const re of urlPatterns) {
      const m = raw.match(re);
      if (m?.[1]) {
        const h = m[1].replace(/^@+/, "");
        return `${baseUrl}${prefixHandle}${h}`;
      }
    }
    // unknown URL format; keep it (but normalize scheme)
    return normalizeUrl(raw);
  }

  // Handle or username
  const h = (stripAt ? raw.replace(/^@+/, "") : raw).trim();
  if (!h) return "";

  // If they pasted something like instagram.com/foo without scheme, treat as URL-ish.
  if (raw.includes(".") && raw.includes("/")) {
    const maybeUrl = normalizeUrl(raw);
    for (const re of urlPatterns) {
      const m = maybeUrl.match(re);
      if (m?.[1]) {
        const hh = m[1].replace(/^@+/, "");
        return `${baseUrl}${prefixHandle}${hh}`;
      }
    }
    return maybeUrl;
  }

  // Plain username
  return `${baseUrl}${prefixHandle}${h}`;
}

/** slugify helper (unchanged) */
function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * ✅ Keys we persist to Profile-Live (flat)
 * Must match sheet headers for fields you want to save.
 */
export const LIVE_KEYS: Array<keyof AlumniProfile | string> = [
  "name",
  "slug",
  "pronouns",
  "roles",
  "location",
  "secondLocation",
  "isBiCoastal",
  "currentWork",

  "bioShort",
  "bioLong",

  "website",
  "instagram",
  "youtube",
  "vimeo",
  "linkedin",
  "facebook",
  "x",
  "tiktok",
  "threads",
  "bluesky",
  "linktree",
  "publicEmail",
  "imdb",

  "spotlight",
  "programs",
  "tags",
  "statusFlags",
  "backgroundStyle",

  "currentHeadshotUrl",
];

/** ---------- normalize ---------- */
export function normalizeProfile(p: AlumniProfile): AlumniProfile {
  const out: AlumniProfile = structuredClone(p);

  // base trims
  out.name = safeTrim(out.name);
  out.slug = slugify(safeTrim(out.slug) || out.name || "");

  (out as any).pronouns = safeTrim((out as any).pronouns);
  (out as any).roles = safeTrim((out as any).roles);

  out.location = safeTrim(out.location);
  out.secondLocation = safeTrim((out as any).secondLocation);
  (out as any).isBiCoastal = !!(out as any).isBiCoastal;

  (out as any).currentWork = safeTrim((out as any).currentWork);

  // bios
  (out as any).bioShort = safeTrim((out as any).bioShort);
  (out as any).bioLong = safeTrim((out as any).bioLong);

  // site url
  (out as any).website = normalizeUrl((out as any).website);

  // ✅ socials → canonical URLs (accept @handle, handle, or url)

  // Instagram
  (out as any).instagram = handleToUrl({
    input: (out as any).instagram,
    baseUrl: "https://www.instagram.com/",
    urlPatterns: [
      /https?:\/\/(?:www\.)?instagram\.com\/@?([A-Za-z0-9._]+)/i,
    ],
  });

  // LinkedIn: handle (after /in/) or url
(out as any).linkedin = handleToUrl({
  input: (out as any).linkedin,
  baseUrl: "https://www.linkedin.com/in/",
  urlPatterns: [
    /https?:\/\/(?:www\.)?linkedin\.com\/in\/([^/?#]+)/i,
  ],
});

// Facebook: username or url
(out as any).facebook = handleToUrl({
  input: (out as any).facebook,
  baseUrl: "https://www.facebook.com/",
  urlPatterns: [
    /https?:\/\/(?:www\.)?facebook\.com\/([^/?#]+)/i,
  ],
});

// X / Twitter
(out as any).x = handleToUrl({
  input: (out as any).x,
  baseUrl: "https://x.com/",
  urlPatterns: [
    /https?:\/\/(?:www\.)?(?:x\.com|twitter\.com)\/@?([^/?#]+)/i,
  ],
});

// TikTok
(out as any).tiktok = handleToUrl({
  input: (out as any).tiktok,
  baseUrl: "https://www.tiktok.com/@",
  urlPatterns: [
    /https?:\/\/(?:www\.)?tiktok\.com\/@([^/?#]+)/i,
  ],
});

// Threads
(out as any).threads = handleToUrl({
  input: (out as any).threads,
  baseUrl: "https://www.threads.net/@",
  urlPatterns: [
    /https?:\/\/(?:www\.)?threads\.net\/@([^/?#]+)/i,
  ],
});

// Bluesky
// Accept:
// - name.bsky.social / @name.bsky.social / custom.domain
// - https://bsky.app/profile/<handle>
// - any full URL (kept as-is, normalized)
{
  const raw0 = safeTrim((out as any).bluesky);
  const raw = raw0.replace(/^@+/, "");

  if (!raw) {
    (out as any).bluesky = "";
  } else if (urlish.test(raw)) {
    // Full URL — if it's bsky profile, canonicalize; otherwise keep normalized
    const m = raw.match(/https?:\/\/(?:www\.)?bsky\.app\/profile\/([^/?#]+)/i);
    (out as any).bluesky = m?.[1]
      ? `https://bsky.app/profile/${m[1]}`
      : normalizeUrl(raw);
  } else {
    // Handle / domain → canonical profile URL
    (out as any).bluesky = `https://bsky.app/profile/${raw}`;
  }
}



// Linktree
(out as any).linktree = handleToUrl({
  input: (out as any).linktree,
  baseUrl: "https://linktr.ee/",
  urlPatterns: [
    /https?:\/\/(?:www\.)?linktr\.ee\/([^/?#]+)/i,
  ],
});


  // YouTube: accept channel/user/@handle links or raw URL;
  // if they paste just a handle, store https://www.youtube.com/@handle
  const ytRaw = safeTrim((out as any).youtube);
  if (ytRaw) {
    if (
      urlish.test(ytRaw) ||
      ytRaw.includes("youtube.com") ||
      ytRaw.includes("youtu.be")
    ) {
      (out as any).youtube = normalizeUrl(ytRaw);
    } else {
      const h = ytRaw.replace(/^@+/, "");
      (out as any).youtube = `https://www.youtube.com/@${h}`;
    }
  } else {
    (out as any).youtube = "";
  }

  // Vimeo
  (out as any).vimeo = handleToUrl({
    input: (out as any).vimeo,
    baseUrl: "https://vimeo.com/",
    urlPatterns: [/https?:\/\/(?:www\.)?vimeo\.com\/([A-Za-z0-9._-]+)/i],
    stripAt: true,
  });

  // Public email (display email)
  (out as any).publicEmail = safeTrim((out as any).publicEmail);

  // IMDb: prefer storing a URL; if they paste an ID like nm123, convert
  const imdbRaw = safeTrim((out as any).imdb);
  if (!imdbRaw) {
    (out as any).imdb = "";
  } else if (urlish.test(imdbRaw) || imdbRaw.includes("imdb.com")) {
    (out as any).imdb = normalizeUrl(imdbRaw);
  } else {
    const id = imdbRaw.trim();
    if (/^nm\d+$/i.test(id)) (out as any).imdb = `https://www.imdb.com/name/${id}`;
    else (out as any).imdb = normalizeUrl(id);
  }

  // tags/flags
  (out as any).spotlight = safeTrim((out as any).spotlight);
  (out as any).programs = safeTrim((out as any).programs);
  (out as any).tags = safeTrim((out as any).tags);
  (out as any).statusFlags = safeTrim((out as any).statusFlags);

  // background
  (out as any).backgroundStyle = safeTrim((out as any).backgroundStyle || "kraft");

  // media url
  (out as any).currentHeadshotUrl = normalizeUrl((out as any).currentHeadshotUrl);

  return out;
}

/** ---------- validate ---------- */
export type ValidationErrors = Record<string, string>;

export function validateProfile(p: AlumniProfile): ValidationErrors {
  const e: ValidationErrors = {};
  const n = normalizeProfile(p);

  if (!safeTrim((n as any).name)) e["name"] = "Please add your Public Name.";
  if (!safeTrim((n as any).slug))
    e["slug"] = "Your profile URL can’t be empty. We’ll suggest one from your name.";

  // lengths from PROFILE_FIELDS
  const maxByKey = new Map<string, number>();
  for (const f of PROFILE_FIELDS) {
    const k = (f.path || (f.key as string)) as string;
    if (typeof f.maxLen === "number") maxByKey.set(k, f.maxLen);
  }
  function enforceMax(k: string, val?: string) {
    const max = maxByKey.get(k);
    if (max && (val || "").length > max) e[k] = `Max length is ${max} characters.`;
  }

  enforceMax("bioLong", safeTrim((n as any).bioLong));
  enforceMax("bioShort", safeTrim((n as any).bioShort));

  // URL sanity: after normalization, non-empty must start with http(s)
  const urlFields = [
    "website",
    "instagram",
    "youtube",
    "vimeo",
    "linkedin",
    "facebook",
    "x",
    "tiktok",
    "threads",
    "bluesky",
    "linktree",
    "imdb",
    "currentHeadshotUrl",
  ] as const;

  for (const k of urlFields) {
    const v = safeTrim((n as any)[k]);
    if (v && !/^https?:\/\//i.test(v)) {
      e[k] = "Please enter a full URL (https://…).";
    }
  }

  if ((n as any).isBiCoastal && !safeTrim((n as any).secondLocation)) {
    e["secondLocation"] = "Add your second location or turn off the toggle.";
  }

  return e;
}


/** ---------- diff → changes (for /api/alumni/save) ---------- */
export function buildLiveChanges(
  prev: Partial<AlumniProfile> | undefined,
  next: AlumniProfile
): Record<string, string> {
  const changes: Record<string, string> = {};
  const before = prev || {};

  for (const key of LIVE_KEYS) {
    const prevVal = (before as any)[key as string];
    const nextVal = (next as any)[key as string];

    const prevStr = toCell(prevVal);
    const nextStr = toCell(nextVal);

    if (prevStr !== nextStr) {
      changes[key as string] = nextStr;
    }
  }

  return changes;

  function toCell(v: unknown): string {
    if (typeof v === "boolean") return v ? "TRUE" : "FALSE";
    if (Array.isArray(v)) return v.join(", ");
    return v == null ? "" : String(v);
  }
}
