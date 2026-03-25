// lib/flags.ts
// Shared constants + utilities for role/status flags (server & client safe)

export type FlagLabel =
  | "Founding Member"
  | "Staff"
  | "Board Member"
  | "Artist-in-Residence"
  | "Fellow"
  | "Intern"
  | "Volunteer";

/** 🎨 Colors per status (source of truth for role chips/buttons) */
export const flagStyles: Record<FlagLabel, string> = {
  "Founding Member": "#E6B24A",
  Staff: "#3E3A36",
  "Board Member": "#A15C40",
  "Artist-in-Residence": "#4C8C86",
  Fellow: "#F25C4D",
  Intern: "#924E75",
  Volunteer: "#659157",
};

/** 🖼️ Icons per status (source of truth for role chips/buttons) */
export const iconMap: Record<FlagLabel, string> = {
  Staff: "⭐️",
  "Founding Member": "🛠️",
  "Board Member": "🧭",
  "Artist-in-Residence": "🛖",
  Fellow: "✨",
  Intern: "🌱",
  Volunteer: "🫶",
};

/** ✅ Normalize any label to its canonical form */
export function getCanonicalFlag(label: string): FlagLabel | null {
  if (!label) return null;
  const raw = label.trim();
  const lower = raw.toLowerCase();
  const dehyphen = lower.replace(/-/g, " ").replace(/\s+/g, " ").trim();
  const candidates = Object.keys(flagStyles) as FlagLabel[];
  return (
    candidates.find((k) => k.toLowerCase() === lower) ??
    candidates.find((k) => k.toLowerCase() === dehyphen) ??
    null
  );
}

/** 🔗 Slugify for URLs */
export function slugifyFlag(flag: FlagLabel): string {
  return flag.toLowerCase().replace(/\s+/g, "-");
}
