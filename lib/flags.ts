// lib/flags.ts
// Shared constants + utilities for role/status flags (server & client safe)

export type FlagLabel =
  | "Board Member"
  | "Intern"
  | "Volunteer"
  | "Artist-in-Residence" 
  | "Fellow"
  | "Associate Artist"
  | "Resident Artist"
  | "Staff"
  | "Founding Member";

/** 🎨 Colors per status (source of truth for role chips/buttons) */
export const flagStyles: Record<FlagLabel, string> = {
  "Founding Member": "#E6B24A",
  Staff: "#3E3A36",
  "Board Member": "#A15C40",
  "Artist-in-Residence": "#4C8C86",
  Fellow: "#0066CC",
  Intern: "#924E75",
  Volunteer: "#659157",
  "Associate Artist": "#6C00AF",
  "Resident Artist": "#F25C4D",
};

/** 🖼️ Icons per status (source of truth for role chips/buttons) */
export const iconMap: Record<FlagLabel, string> = {
  Intern: "🌱",
  Volunteer: "🫶",
  "Artist-in-Residence": "🪐",
  Fellow: "💫",
  "Associate Artist": "✨",
  "Resident Artist": "🌟",
  Staff: "⭐️",
  "Board Member": "🧭",
  "Founding Member": "🛠️",
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
