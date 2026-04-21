// lib/normalizeAlumniRow.ts
import type { AlumniRow } from "./types";
import { filterToCanonicalLabels, enforceLimit } from "./alumniTaxonomy";

const PLATFORM_LABELS: Record<string, string> = {
  instagram: "Instagram", x: "X", tiktok: "TikTok", threads: "Threads",
  bluesky: "Bluesky", linkedin: "LinkedIn", youtube: "YouTube", vimeo: "Vimeo",
  imdb: "IMDb", facebook: "Facebook", linktree: "Linktree", newsletter: "Newsletter",
};

function buildPlatformUrl(platform: string, raw: string): string {
  const s = raw.trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  const handle = s.replace(/^@/, "");
  switch (platform) {
    case "instagram": return `https://instagram.com/${handle}`;
    case "x": return `https://x.com/${handle}`;
    case "tiktok": return `https://tiktok.com/@${handle}`;
    case "threads": return `https://threads.net/@${handle}`;
    case "bluesky": return `https://bsky.app/profile/${handle}`;
    case "linkedin": return `https://linkedin.com/in/${handle}`;
    case "youtube": return `https://youtube.com/@${handle}`;
    case "vimeo": return `https://vimeo.com/${handle}`;
    case "imdb": return `https://www.imdb.com/name/${handle}`;
    case "facebook": return `https://facebook.com/${handle}`;
    case "linktree": return `https://linktr.ee/${handle}`;
    case "newsletter": return /^https?:\/\//i.test(s) ? s : `https://${s}`;
    default: return s;
  }
}

function buildFeaturedLink(
  platform: string,
  values: Record<string, string>
): { url: string; label: string } | null {
  if (!platform) return null;
  const raw = values[platform] || "";
  const url = buildPlatformUrl(platform, raw);
  if (!url) return null;
  return { url, label: PLATFORM_LABELS[platform] || platform };
}

/** Build a case-insensitive view of the row */
function lowerKeyed(row: Record<string, any>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row || {})) {
    const key = String(k || "").trim().toLowerCase();
    const val = v == null ? "" : String(v);
    out[key] = val;
  }
  return out;
}

/** Pull first non-empty value by trying multiple keys (case-insensitive) */
function getFirstCI(row: Record<string, any>, keys: string[]): string {
  const lk = lowerKeyed(row);
  for (const k of keys) {
    const v = lk[String(k).trim().toLowerCase()];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function splitCsvish(raw: string): string[] {
  return (raw || "")
    .split(/[,;\n|]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function truthy(raw: string): boolean {
  const v = (raw || "").trim().toLowerCase();
  return v === "true" || v === "yes" || v === "y" || v === "1" || v === "✓" || v === "checked";
}

function normalizeSingleUpdate(row: Record<string, any>) {
  const lk = lowerKeyed(row);
  const hasMeaningfulData =
    lk["update headline"] || lk["update body"] || lk["update media url"] || lk["update media url(s)"];

  if (!hasMeaningfulData) return null;

  const desc = (lk["update location"] || "").trim();
  const title = (lk["update date"] || "").trim();
  const subheadline = [desc, title].filter(Boolean).join("   |   ");

  return {
    tag: (lk["update tag"] || "DAT Spotlight").trim(),
    headline:
      (lk["update headline"] || "").trim() ||
      (lk["update body"] || "").slice(0, 60) ||
      "Spotlight Update",
    subheadline,
    subheadlineTitle: title,
    subheadlineDescription: desc,
    body: (lk["update body"] || "").trim(),
    mediaUrl: (lk["update media url"] || lk["update media url(s)"] || "").trim(),
    ctaLink: (lk["update cta link"] || "").trim(),
    evergreen: (lk["update evergreen"] || "").toLowerCase().startsWith("y"),
  };
}

/**
 * Supports BOTH:
 * - legacy Profile-Data CSV headers (lowercased by loadAlumni.ts)
 * - new Profile-Live snapshot headers (varied casing/spacing)
 */
export function normalizeAlumniRow(row: Record<string, any>): AlumniRow | null {
  const name = getFirstCI(row, ["name"]);
  const slugRaw = getFirstCI(row, [
    "slug",
    "canonicalslug",
    "canonical slug",
    "profile slug",
    "profile-slug",
    "profileslug",
  ]);
  const slug = slugRaw.trim().toLowerCase();
  if (!name || !slug) return null;

  // Roles: accept legacy "role" or new "roles"
  const rolesRaw = getFirstCI(row, ["roles", "role"]);
  const roles = rolesRaw ? splitCsvish(rolesRaw) : [];
  const role = roles[0] || "";

  // Location + headshot
  const location = getFirstCI(row, ["location"]);
  const headshotUrl = getFirstCI(row, [
    "currentheadshoturl",
    "current headshot url",
    "headshot url",
    "headshoturl",
  ]);

  // ✅ Bio/Artist Statement: support Live + legacy
  const bioLong = getFirstCI(row, [
    "biolong",
    "bio long",
    "bioLong",
    "bio_long",
    "artist statement",
    "artiststatement",
  ]);
  const bioShort = getFirstCI(row, ["bioshort", "bio short", "bioShort", "bio_short"]);

  // Current Work
  const currentWork = getFirstCI(row, ["currentwork", "current work", "currentWork", "current_work"]);

  // Dual title: present-day professional title (outside DAT)
  const currentTitle = getFirstCI(row, ["current title", "currenttitle", "currentTitle", "current_title"]);

  // Multi-city location
  const secondLocation = getFirstCI(row, ["second location", "secondlocation", "secondLocation", "second_location"]);
  const isBiCoastalRaw = getFirstCI(row, ["isbicoastal", "is bi-coastal", "bicoastal", "isBiCoastal", "is bicoastal"]);
  const isBiCoastal = truthy(isBiCoastalRaw);

  // Website
  const website = getFirstCI(row, ["website", "artist url", "profile url", "url"]);

  // ✅ Status flags: accept ALL common variants
  const flagsRaw = getFirstCI(row, [
    "statusflags",
    "status flags",
    "statusFlags",
    "flags",
    "status signifier",
    "statussignifier",
  ]);
  const statusFlags = flagsRaw ? splitCsvish(flagsRaw) : [];

  // Identity tags — V1 canonical only. Legacy/unknown labels are dropped.
  const identityTagsRaw = getFirstCI(row, ["identity tags", "identitytags", "identityTags"]);
  const identityTags = enforceLimit(
    filterToCanonicalLabels(identityTagsRaw ? splitCsvish(identityTagsRaw) : [], "identity"),
    "identity"
  );

  // Practice tags — new layer; column may not exist yet (handled gracefully).
  const practiceTagsRaw = getFirstCI(row, ["practice tags", "practicetags", "practiceTags"]);
  const practiceTags = enforceLimit(
    filterToCanonicalLabels(practiceTagsRaw ? splitCsvish(practiceTagsRaw) : [], "practice"),
    "practice"
  );

  // Explore & care tags — new layer; column may not exist yet.
  const exploreCareTagsRaw = getFirstCI(row, [
    "explore care tags",
    "explorecaretags",
    "exploreCareTags",
    "explore_care_tags",
  ]);
  const exploreCareTags = enforceLimit(
    filterToCanonicalLabels(exploreCareTagsRaw ? splitCsvish(exploreCareTagsRaw) : [], "exploreCare"),
    "exploreCare"
  );

  // Program badges (optional)
  const programBadgesRaw = getFirstCI(row, [
    "project badges",
    "program badges",
    "programbadges",
    "programBadges",
  ]);
  const programBadges = programBadgesRaw ? splitCsvish(programBadgesRaw) : [];

  // Socials
  const socialsRaw = getFirstCI(row, ["artist social links", "social links", "socials"]);
  const socials = socialsRaw ? splitCsvish(socialsRaw) : [];

  // Seasons
  const programSeasons: number[] = [];
  const seasonRaw = getFirstCI(row, ["season", "seasons"]);
  if (seasonRaw) {
    const seasonNums = seasonRaw
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    programSeasons.push(...seasonNums);
  }

  // Visibility
  const showOnProfileRaw = getFirstCI(row, ["show on profile?", "ispublic", "is public", "isPublic"]);
  const showOnProfile = showOnProfileRaw
    ? truthy(showOnProfileRaw)
      ? "Yes"
      : "No"
    : "";

  // Public email ONLY (Option A). Never extract private/admin email into public runtime objects.
  const publicEmail = getFirstCI(row, ["publicEmail", "public email", "public_email"]).trim();

  // Visibility flags: blank/true = show; "false" = hide (default shown for backward compat)
  const showWebsite = getFirstCI(row, ["showWebsite", "show website", "showwebsite"]).trim();
  const showPublicEmail = getFirstCI(row, ["showPublicEmail", "show public email", "showpublicemail"]).trim();

  // Featured link: primarySocial key → resolve URL from individual platform column
  const primarySocial = getFirstCI(row, ["primarySocial", "primary social", "primarysocial"]).trim().toLowerCase();
  const platformValues: Record<string, string> = {
    instagram: getFirstCI(row, ["instagram"]).trim(),
    x: getFirstCI(row, ["x"]).trim(),
    tiktok: getFirstCI(row, ["tiktok"]).trim(),
    threads: getFirstCI(row, ["threads"]).trim(),
    bluesky: getFirstCI(row, ["bluesky"]).trim(),
    linkedin: getFirstCI(row, ["linkedin"]).trim(),
    youtube: getFirstCI(row, ["youtube"]).trim(),
    vimeo: getFirstCI(row, ["vimeo"]).trim(),
    imdb: getFirstCI(row, ["imdb"]).trim(),
    facebook: getFirstCI(row, ["facebook"]).trim(),
    linktree: getFirstCI(row, ["linktree"]).trim(),
    newsletter: getFirstCI(row, ["newsletter"]).trim(),
  };
  const featuredLink = buildFeaturedLink(primarySocial, platformValues);

  // lastModified
  const lastModifiedRaw = getFirstCI(row, ["lastmodified", "updatedat", "updated at", "updatedAt"]);
  const lastModified = lastModifiedRaw ? new Date(lastModifiedRaw) : null;

  // Productions (legacy)
  const productionsRaw = getFirstCI(row, ["productions"]);
  const productions = productionsRaw ? splitCsvish(productionsRaw) : [];

  const festival = getFirstCI(row, ["festival"]);

  // Background texture
  const backgroundChoice = getFirstCI(row, [
    "backgroundstyle",
    "background style",
    "background choice",
    "backgroundchoice",
    "backgroundkey",
    "background key",
  ]);

  // Updates
  const update = normalizeSingleUpdate(row);

  return {
    slug,
    name,
    role,
    roles,

    location,
    headshotUrl,

    // keep legacy field name in type, but fill from bioLong
    artistStatement: bioLong || "",

    programBadges,
    productions,
    festival,

    identityTags,
    practiceTags,
    exploreCareTags,
    statusFlags,
    programSeasons,

    currentWork: currentWork || "",
    currentTitle: currentTitle || undefined,
    secondLocation: secondLocation || undefined,
    isBiCoastal,
    backgroundChoice: backgroundChoice || undefined,

    lastModifiedRaw: lastModifiedRaw || "",
    lastModified,

    // NOTE: private email is intentionally never populated in the public build.
    email: "",
    publicEmail: publicEmail || "",
    website: website || "",
    socials,
    showWebsite,
    showPublicEmail,
    featuredLink: featuredLink || undefined,

    showOnProfile,

    fieldNotes: [],
    imageUrls: [],
    posterUrls: [],

    updates: update ? [update] : [],
  };
}
