// /components/alumni/formLogic.ts
import type { AlumniProfile } from "@/schemas";
import { PROFILE_FIELDS } from "@/components/alumni/fields";

/** ---------- helpers ---------- */

const urlish = /^https?:\/\//i;
function normalizeUrl(s?: string) {
  if (!s) return s;
  const t = s.trim();
  if (!t) return "";
  return urlish.test(t) ? t : `https://${t}`;
}

function slugify(s: string) {
  return (s || "")
    .toLowerCase()
    .trim()
    // fold to ASCII-ish; keep words, space, dash, underscore
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function joinList(v: unknown): string {
  if (Array.isArray(v)) return v.join(", ");
  return v == null ? "" : String(v);
}

/** handle normalizers (accept @handle or URL → store @handle) */
function normalizeHandleGeneric(s?: string) {
  const t = (s || "").trim();
  if (!t) return "";
  if (t.startsWith("@")) return t.replace(/^@+/, "@");
  if (/^https?:\/\//i.test(t)) {
    const user = t.replace(/^https?:\/\/[^/]+\/+/i, "").replace(/^@+/, "");
    return user ? `@${user}` : "";
  }
  return `@${t.replace(/^@+/, "")}`;
}

function normalizeFromUrl(re: RegExp, s?: string) {
  const t = (s || "").trim();
  if (!t) return "";
  const m = t.match(re);
  const h = m ? m[1] : t.replace(/^@+/, "");
  return h ? `@${h}` : "";
}

function normalizeInstagram(s?: string) {
  return normalizeFromUrl(/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([A-Za-z0-9._]+)/i, s);
}
function normalizeX(s?: string) {
  return normalizeFromUrl(/(?:https?:\/\/)?(?:www\.)?(?:x\.com|twitter\.com)\/([A-Za-z0-9_\.]+)/i, s);
}
function normalizeTikTok(s?: string) {
  // tiktok.com/@handle OR raw
  const t = (s || "").trim();
  if (!t) return "";
  const m = t.match(/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([A-Za-z0-9._]+)/i);
  if (m) return `@${m[1]}`;
  return normalizeHandleGeneric(t);
}
function normalizeThreads(s?: string) {
  return normalizeFromUrl(/(?:https?:\/\/)?(?:www\.)?threads\.net\/@?([A-Za-z0-9._]+)/i, s);
}
function normalizeBluesky(s?: string) {
  // bsky.app/profile/<handle> OR name.bsky.social OR @name.bsky.social
  const t = (s || "").trim();
  if (!t) return "";
  const m = t.match(/(?:https?:\/\/)?(?:www\.)?bsky\.app\/profile\/([^/]+)/i);
  const h = m ? m[1] : t.replace(/^@+/, "");
  return h ? `@${h}` : "";
}

/** Keys we persist to Profile-Live (flat) */
export const LIVE_KEYS: Array<keyof AlumniProfile | string> = [
  "name",
  "slug",
  "datRoles",
  "currentRole",
  "location",
  "isBiCoastal",
  "secondLocation",
  "identityTags",
  "artistStatement",
  // visuals & theming
  "headshotUrl",
  "backgroundStyle",
  // links & contact
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
  // current update
  "currentUpdateText",
  "currentUpdateLink",
  "currentUpdateExpiresAt",
  // NOTE: story.* is handled by a different sheet/handler; we still normalize below.
];

/** ---------- normalize ---------- */
export function normalizeProfile(p: AlumniProfile): AlumniProfile {
  const out: AlumniProfile = structuredClone(p);

  // base trims
  out.name = (out.name || "").trim();
  out.slug = slugify(out.slug || out.name || "");

  out.location = (out.location || "").trim();
  out.secondLocation = (out.secondLocation || "").trim();

  out.currentRole = (out.currentRole || "").trim();
  out.artistStatement = (out.artistStatement || "").trim();

  // links & contact
  out.website = normalizeUrl(out.website);
  out.publicEmail = (out.publicEmail || "").trim();

  out.instagram = normalizeInstagram(out.instagram);
  out.x = normalizeX(out.x);
  out.tiktok = normalizeTikTok(out.tiktok);
  out.threads = normalizeThreads(out.threads);
  out.bluesky = normalizeBluesky(out.bluesky);

  out.linkedin = normalizeUrl(out.linkedin);
  out.youtube = normalizeUrl(out.youtube);
  out.vimeo = normalizeUrl(out.vimeo);
  out.facebook = normalizeUrl(out.facebook);
  out.linktree = normalizeUrl(out.linktree);

  // media urls we might ingest
  out.headshotUrl = normalizeUrl(out.headshotUrl);

  // Current update (+ default expire if text exists but no date)
  out.currentUpdateText = (out.currentUpdateText || "").trim();
  out.currentUpdateLink = normalizeUrl(out.currentUpdateLink);
  out.currentUpdateExpiresAt = (out.currentUpdateExpiresAt || "").trim();

  if (out.currentUpdateText && !out.currentUpdateExpiresAt) {
    const d = new Date();
    d.setDate(d.getDate() + 90);
    out.currentUpdateExpiresAt = d.toISOString().slice(0, 10); // ISO date (YYYY-MM-DD)
  }

  // Story (not saved to Profile-Live here, but normalize now for later steps)
  if (out.story) {
    out.story = {
      ...out.story,
      title: (out.story.title || "").trim(),
      program: (out.story.program || "").trim(),
      programCountry: (out.story.programCountry || "").trim(),
      years: (out.story.years || "").trim(),
      location: (out.story.location || "").trim(),
      partners: (out.story.partners || "").trim(),
      mediaUrl: normalizeUrl(out.story.mediaUrl),
      shortStory: (out.story.shortStory || "").trim(),
      url: normalizeUrl(out.story.url),
      quote: (out.story.quote || "").trim(),
      quoteAuthor: (out.story.quoteAuthor || "").trim(),
    };
  }

  return out;
}

/** ---------- validate ---------- */

export type ValidationErrors = Record<string, string>; // key/path -> message

export function validateProfile(p: AlumniProfile): ValidationErrors {
  const e: ValidationErrors = {};

  // required
  if (!p.name) e["name"] = "Please add your Public Name.";
  if (!p.slug) e["slug"] = "Your profile URL can’t be empty. We’ll suggest one from your name.";

  // lengths (from PROFILE_FIELDS where provided)
  const maxByKey = new Map<string, number>();
  for (const f of PROFILE_FIELDS) {
    const k = (f.path || (f.key as string)) as string;
    if (typeof f.maxLen === "number") maxByKey.set(k, f.maxLen);
  }
  function enforceMax(k: string, val?: string) {
    const max = maxByKey.get(k);
    if (max && (val || "").length > max) e[k] = `Max length is ${max} characters.`;
  }

  enforceMax("artistStatement", p.artistStatement);
  enforceMax("currentUpdateText", p.currentUpdateText);
  enforceMax("story.shortStory", p.story?.shortStory);
  enforceMax("story.quote", p.story?.quote);

  // URL format (very light)
  function badUrl(u?: string) {
    return u && u.trim() && !/^https?:\/\//i.test(u.trim());
  }
  if (badUrl(p.website)) e["website"] = "Please enter a full URL (https://…).";
  if (badUrl(p.headshotUrl)) e["headshotUrl"] = "Please enter a full URL (https://…).";
  if (badUrl(p.currentUpdateLink)) e["currentUpdateLink"] = "Please enter a full URL (https://…).";
  if (badUrl(p.linkedin)) e["linkedin"] = "Enter a full URL (https://…).";
  if (badUrl(p.youtube)) e["youtube"] = "Enter a full URL (https://…).";
  if (badUrl(p.vimeo)) e["vimeo"] = "Enter a full URL (https://…).";
  if (badUrl(p.facebook)) e["facebook"] = "Enter a full URL (https://…).";
  if (badUrl(p.linktree)) e["linktree"] = "Enter a full URL (https://…).";
  if (badUrl(p.story?.mediaUrl)) e["story.mediaUrl"] = "Please enter a full URL (https://…).";
  if (badUrl(p.story?.url)) e["story.url"] = "Please enter a full URL (https://…).";

  // handle-based socials: must be @something (letters, numbers, underscore, dot)
  const isHandle = (h?: string) => !h || /^@[\w.]+$/.test(h);
  if (!isHandle(p.instagram)) e["instagram"] = "Use @handle or a profile URL.";
  if (!isHandle(p.x)) e["x"] = "Use @handle or a profile URL.";
  if (!isHandle(p.tiktok)) e["tiktok"] = "Use @handle or a profile URL.";
  if (!isHandle(p.threads)) e["threads"] = "Use @handle or a profile URL.";
  if (!isHandle(p.bluesky)) e["bluesky"] = "Use @handle or a profile URL.";

  // email (very light)
  if (p.publicEmail && !/^\S+@\S+\.\S+$/.test(p.publicEmail)) {
    e["publicEmail"] = "Please enter a valid email.";
  }

  // bi-coastal dependency
  if (p.isBiCoastal && !p.secondLocation) {
    e["secondLocation"] = "Add your second location or turn off the toggle.";
  }

  return e;
}

/** ---------- diff → changes (for /api/alumni/save) ---------- */

/**
 * Build a flat `changes` object for fields we store on Profile-Live.
 * Arrays are joined as comma+space to match your sheet convention.
 * Booleans become "TRUE"/"FALSE".
 */
export function buildLiveChanges(
  prev: Partial<AlumniProfile> | undefined,
  next: AlumniProfile
): Record<string, string> {
  const changes: Record<string, string> = {};
  const before = prev || {};

  for (const key of LIVE_KEYS) {
    const prevVal = pathGet(before, key as string);
    const nextVal = pathGet(next, key as string);

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

  function pathGet(obj: any, path: string) {
    if (!path.includes(".")) return obj[path as keyof AlumniProfile];
    return path.split(".").reduce<any>((acc, k) => (acc ? acc[k] : undefined), obj);
  }
}
