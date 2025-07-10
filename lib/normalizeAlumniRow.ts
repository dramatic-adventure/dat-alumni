import { AlumniRow } from "./types";

export function normalizeAlumniRow(data: Record<string, string>): AlumniRow | null {
  const name = data["name"]?.trim();
  const slug = data["slug"]?.trim()?.toLowerCase();

  if (!name || !slug) return null;

  return {
    slug,
    name,
    role: data["role"]?.trim() || "",
    headshotUrl: data["headshot url"] || "",
    location: data["location"] || "",
    identityTags: (data["identity tags"] || "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    statusFlags: (data["status signifier"] || "")
      .split(",")
      .map((flag) => flag.trim())
      .filter(Boolean),
    programBadges: (data["project badges"] || "")
      .split(",")
      .map((badge) => badge.trim())
      .filter(Boolean),
    artistStatement: data["artist statement"] || "",
    fieldNotes: [], // Add logic if needed
    imageUrls: [], // Add logic if needed
    posterUrls: [], // Add logic if needed
    email: data["artist email"]?.trim() || "",
    website: data["artist url"]?.trim() || "",
    socials: (data["artist social links"] || "")
      .split(",")
      .map((link) => link.trim())
      .filter(Boolean),
    showOnProfile: data["show on profile?"] || "",
  };
}
