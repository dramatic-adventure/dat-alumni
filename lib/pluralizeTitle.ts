// lib/pluralizeTitle.ts
const IRREGULAR_PLURALS: Record<string, string> = {
  Fellow: "Fellows",
  Alumni: "Alumni", // already plural
  Artist: "Artists",
  Partner: "Partners",
  Staff: "Staff", // same singular/plural
};

export function pluralizeTitle(title: string): string {
  const trimmed = title.trim();
  if (IRREGULAR_PLURALS[trimmed]) return IRREGULAR_PLURALS[trimmed];
  if (trimmed.endsWith("s")) return trimmed;
  return `${trimmed}s`;
}
