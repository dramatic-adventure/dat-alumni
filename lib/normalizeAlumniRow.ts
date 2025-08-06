// normalizeAlumniRow.ts
import { Space } from "lucide-react";
import { AlumniRow } from "./types";

function normalizeSingleUpdate(row: Record<string, string>) {
  const hasMeaningfulData =
    row["update headline"] || row["update body"] || row["update media url"];

  if (!hasMeaningfulData) return null;

  const desc = row["update location"]?.trim() || "";
  const title = row["update date"]?.trim() || "";

  const subheadline = [desc, title].filter(Boolean).join("   |   "); // only add separator if both exist



  return {
    tag: row["update tag"]?.trim() || "DAT Spotlight",
    headline: row["update headline"]?.trim() || row["update body"]?.slice(0, 60) || "Spotlight Update",
    subheadline,
    subheadlineTitle: title,
    subheadlineDescription: desc,
    body: row["update body"]?.trim() || "",
    mediaUrl: row["update media url"]?.trim() || "",
    ctaLink: row["update cta link"]?.trim() || "",
    evergreen: (row["update evergreen"] || "").toLowerCase().startsWith("y"),
  };
}


export function normalizeAlumniRow(row: Record<string, string>): AlumniRow | null {
  const name = row["name"]?.trim();
  const slug = row["slug"]?.trim()?.toLowerCase();
  if (!name || !slug) return null;

  const roles = row["role"]
    ? row["role"].split(",").map(r => r.trim()).filter(Boolean)
    : [];
  const role = roles.join(", "); // Legacy support

  const identityTags = (row["identity tags"] || "").split(",").map(t => t.trim()).filter(Boolean);
  const statusFlags = (row["status signifier"] || "").split(",").map(s => s.trim()).filter(Boolean);
  const programBadges = (row["project badges"] || "").split(",").map(p => p.trim()).filter(Boolean);
  const socials = (row["artist social links"] || "").split(",").map(s => s.trim()).filter(Boolean);

  const programSeasons: number[] = [];
  if (row["season"]) {
    const seasonNums = row["season"]
      .split(",")
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n));
    programSeasons.push(...seasonNums);
  }

  const update = normalizeSingleUpdate(row); // ✅ Ensure not null in array

  return {
    slug,
    name,
    role,
    roles,
    location: row["location"] || "",
    headshotUrl: row["headshot url"] || "",
    artistStatement: row["artist statement"] || "",
    programBadges,
    productions: row["productions"]?.split(",").map(p => p.trim()) || [],
    festival: row["festival"] || "",
    identityTags,
    statusFlags,
    programSeasons,

    // ✅ New fields
    lastModifiedRaw: row["lastmodified"] || "",
    lastModified: row["lastmodified"] ? new Date(row["lastmodified"]) : null,

    email: row["artist email"]?.trim() || "",
    website: row["artist url"]?.trim() || "",
    socials,
    showOnProfile: row["show on profile?"] || "",
    fieldNotes: [],
    imageUrls: [],
    posterUrls: [],
    updates: update ? [update] : [],
  };
}
