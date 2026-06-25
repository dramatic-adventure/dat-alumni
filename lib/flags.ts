// lib/flags.ts
// Shared constants + utilities for role/status flags (server & client safe)

export type FlagLabel =
  | "Board Member"
  | "Intern"
  | "Apprentice"
  | "Volunteer"
  | "Artist-in-Residence"
  | "Collective Artist"
  | "Fellow"
  | "Associate Artist"
  | "Resident Artist"
  | "Staff"
  | "Founding Member";

/**
 * 📐 Canonical display order for role listings (RolesGrid, etc.).
 * Founding Members → Board → Staff → Resident → Associate → Artists-in-Residence
 * → Collective Artists → Fellows → Apprentices → Interns → Volunteers.
 */
export const ROLE_DISPLAY_ORDER: FlagLabel[] = [
  "Founding Member",
  "Board Member",
  "Staff",
  "Resident Artist",
  "Associate Artist",
  "Artist-in-Residence",
  "Collective Artist",
  "Fellow",
  "Apprentice",
  "Intern",
  "Volunteer",
];

/** 🎨 Colors per status (source of truth for role chips/buttons) */
export const flagStyles: Record<FlagLabel, string> = {
  "Founding Member": "#E6B24A",
  "Board Member": "#A15C40",
  Staff: "#3E3A36",
  "Resident Artist": "#F25C4D",
  "Associate Artist": "#6C00AF",
  "Artist-in-Residence": "#4C8C86",
  "Collective Artist": "#C13584",
  Fellow: "#0066CC",
  Apprentice: "#E2711D",
  Intern: "#924E75",
  Volunteer: "#659157",
};

/** 🖼️ Icons per status (source of truth for role chips/buttons) */
export const iconMap: Record<FlagLabel, string> = {
  "Founding Member": "🛠️",
  "Board Member": "🧭",
  Staff: "⭐️",
  "Resident Artist": "🌟",
  "Associate Artist": "✨",
  "Artist-in-Residence": "🪐",
  "Collective Artist": "🌀",
  Fellow: "💫",
  Apprentice: "🔨",
  Intern: "🌱",
  Volunteer: "🫶",
};

/**
 * 📝 Optional one-line descriptions per role (shown as a paragraph below the
 * heading on /role/[slug] when present). Left empty intentionally: the Collective
 * Artist blurb now lives in the hero subtitle (see flagHeroSubtitles). Add an
 * entry here to surface a body paragraph for a role.
 */
export const flagDescriptions: Partial<Record<FlagLabel, string>> = {};

/** 🏷️ Optional collective group name per role (e.g. "the DAT Collective"). */
export const flagGroupNames: Partial<Record<FlagLabel, string>> = {
  "Collective Artist": "the DAT Collective",
};

/**
 * 🎯 Optional hero subtitle per role (shown under the headline on /role/[slug]).
 * Overrides the default "Recognizing …" line when present. Keep it concise — the
 * full blurb still renders as the paragraph below the heading.
 */
export const flagHeroSubtitles: Partial<Record<FlagLabel, string>> = {
  "Collective Artist":
    "Recognizing DAT’s recurring artists and creative collaborators.",
};

/** ✅ Normalize any label to its canonical form */
export function getCanonicalFlag(label: string): FlagLabel | null {
  if (!label) return null;

  const raw = label.trim();
  const lower = raw.toLowerCase();
  const dehyphen = lower.replace(/-/g, " ").replace(/\s+/g, " ").trim();

  if (dehyphen === "board of directors") return "Board Member";
  if (dehyphen === "board member") return "Board Member";
  if (dehyphen === "associate artist" || dehyphen === "associate artists") return "Associate Artist";
  if (dehyphen === "resident artist" || dehyphen === "resident artists") return "Resident Artist";
  if (dehyphen === "collective artist" || dehyphen === "collective artists") return "Collective Artist";
  if (dehyphen === "apprentice" || dehyphen === "apprentices") return "Apprentice";

  const candidates = Object.keys(flagStyles) as FlagLabel[];
  return (
    candidates.find((k) => k.toLowerCase() === lower) ??
    candidates.find((k) => k.toLowerCase() === dehyphen) ??
    null
  );
}

/** 🔗 Slugify for URLs */
export function slugifyFlag(flag: FlagLabel): string {
  if (flag === "Board Member") return "board-of-directors";
  return flag.toLowerCase().replace(/\s+/g, "-");
}

export function displayFlagLabel(flag: FlagLabel): string {
  if (flag === "Board Member") return "Board of Directors";
  return flag;
}
