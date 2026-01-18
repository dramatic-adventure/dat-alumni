// lib/normalizeAlumniRow.ts
import type { AlumniRow } from "./types";

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
  const role = roles.join(", ");

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

  // Identity tags
  const identityTagsRaw = getFirstCI(row, ["identity tags", "identitytags", "identityTags"]);
  const identityTags = identityTagsRaw ? splitCsvish(identityTagsRaw) : [];

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

  // Email
  const email = getFirstCI(row, ["email", "artist email"]).trim();

  // lastModified
  const lastModifiedRaw = getFirstCI(row, ["lastmodified", "updatedat", "updated at", "updatedAt"]);
  const lastModified = lastModifiedRaw ? new Date(lastModifiedRaw) : null;

  // Productions (legacy)
  const productionsRaw = getFirstCI(row, ["productions"]);
  const productions = productionsRaw ? splitCsvish(productionsRaw) : [];

  const festival = getFirstCI(row, ["festival"]);

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
    statusFlags,
    programSeasons,

    currentWork: currentWork || "",

    lastModifiedRaw: lastModifiedRaw || "",
    lastModified,

    email: email || "",
    website: website || "",
    socials,

    showOnProfile,

    fieldNotes: [],
    imageUrls: [],
    posterUrls: [],

    updates: update ? [update] : [],
  };
}
