// lib/normalizeAlumniRow.ts
import type { AlumniRow } from "./types";

function getFirst(row: Record<string, string>, keys: string[]): string {
  for (const k of keys) {
    const v = row[k];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function getLower(row: Record<string, string>, keys: string[]): string {
  return getFirst(row, keys).toLowerCase();
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

function normalizeSingleUpdate(row: Record<string, string>) {
  const hasMeaningfulData =
    row["update headline"] || row["update body"] || row["update media url"];

  if (!hasMeaningfulData) return null;

  const desc = row["update location"]?.trim() || "";
  const title = row["update date"]?.trim() || "";
  const subheadline = [desc, title].filter(Boolean).join("   |   ");

  return {
    tag: row["update tag"]?.trim() || "DAT Spotlight",
    headline:
      row["update headline"]?.trim() ||
      row["update body"]?.slice(0, 60) ||
      "Spotlight Update",
    subheadline,
    subheadlineTitle: title,
    subheadlineDescription: desc,
    body: row["update body"]?.trim() || "",
    mediaUrl: row["update media url"]?.trim() || "",
    ctaLink: row["update cta link"]?.trim() || "",
    evergreen: (row["update evergreen"] || "").toLowerCase().startsWith("y"),
  };
}

/**
 * Supports BOTH:
 * - legacy Profile-Data CSV headers (lowercased by loadAlumni.ts)
 * - new Profile-Live snapshot headers (we can choose either style)
 */
export function normalizeAlumniRow(row: Record<string, string>): AlumniRow | null {
  const name = getFirst(row, ["name"]);
  const slugRaw = getFirst(row, ["slug", "canonicalslug", "profile slug", "profile-slug"]);
  const slug = slugRaw.trim().toLowerCase();

  if (!name || !slug) return null;

  // Roles: accept legacy "role" or new "roles"
  const rolesRaw = getFirst(row, ["roles", "role"]);
  const roles = rolesRaw ? splitCsvish(rolesRaw) : [];
  const role = roles.join(", "); // legacy support

  // Location + headshot: accept either world
  const location = getFirst(row, ["location"]);
  const headshotUrl = getFirst(row, [
    "currentheadshoturl",
    "current headshot url",
    "headshot url",
    "headshoturl",
  ]);

  // Bios: legacy "artist statement" maps to bioLong in Live world
  const bioLong = getFirst(row, ["biolong", "bio long", "artist statement"]);
  // bioShort is evergreen-ish summary; DO NOT map Current Work into this
  const bioShort = getFirst(row, ["bioshort", "bio short"]);

  // Current Work: tweet-like update field
  const currentWork = getFirst(row, ["currentwork", "current work"]);

  // Website: keep canonical field as website, but accept legacy "artist url"
  const website = getFirst(row, ["website", "artist url", "profile url"]);

  // Flags: DAT involvement chips (Founding Member, Staff, etc.)
  // Accept either legacy "status signifier" or new "flags"
  const flagsRaw = getFirst(row, ["flags", "status signifier", "status flags"]);
  const statusFlags = flagsRaw ? splitCsvish(flagsRaw) : [];

  // Legacy filter/tag fields (still supported if present)
  const identityTagsRaw = getFirst(row, ["identity tags"]);
  const identityTags = identityTagsRaw ? splitCsvish(identityTagsRaw) : [];

  const programBadgesRaw = getFirst(row, ["project badges"]);
  const programBadges = programBadgesRaw ? splitCsvish(programBadgesRaw) : [];

  const socialsRaw = getFirst(row, ["artist social links", "social links", "socials"]);
  const socials = socialsRaw ? splitCsvish(socialsRaw) : [];

  // Seasons
  const programSeasons: number[] = [];
  const seasonRaw = getFirst(row, ["season"]);
  if (seasonRaw) {
    const seasonNums = seasonRaw
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n));
    programSeasons.push(...seasonNums);
  }

  // Visibility: accept legacy "show on profile?" OR live "isPublic"
  const showOnProfileRaw = getFirst(row, ["show on profile?", "ispublic", "is public"]);
  // Keep the original string if it's legacy; but normalize if we’re in live-world
  const showOnProfile = showOnProfileRaw
    ? truthy(showOnProfileRaw)
      ? "Yes"
      : "No"
    : "";

  // Email: accept legacy OR live (note: public snapshot should omit, but normalize supports it)
  const email = getFirst(row, ["email", "artist email"]).trim();

  // lastModified: accept legacy lastmodified OR live updatedAt
  const lastModifiedRaw = getFirst(row, ["lastmodified", "updatedat", "updated at"]);
  const lastModified = lastModifiedRaw ? new Date(lastModifiedRaw) : null;

  // Productions: legacy
  const productionsRaw = getFirst(row, ["productions"]);
  const productions = productionsRaw ? splitCsvish(productionsRaw) : [];

  const festival = getFirst(row, ["festival"]);

  // Updates feature (unchanged)
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

    // ✅ New fields
    currentWork: currentWork || "",

    // ✅ timestamps
    lastModifiedRaw: lastModifiedRaw || "",
    lastModified,

    // contact-ish
    email: email || "",
    website: website || "",
    socials,

    // visibility
    showOnProfile,

    fieldNotes: [],
    imageUrls: [],
    posterUrls: [],

    updates: update ? [update] : [],
  };
}
