import { slugify } from "@/lib/slugify";

export interface ParsedLanguage {
  name: string;
  level?: string;
  slug: string;
}

export function parseLanguageEntry(entry: string): ParsedLanguage {
  const trimmed = entry.trim();
  // Match "Language Name (Level)" e.g. "Spanish (Advanced)"
  const match = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    const name = match[1].trim();
    const level = match[2].trim();
    return { name, level, slug: slugify(name) };
  }
  return { name: trimmed, slug: slugify(trimmed) };
}

export function parseLanguages(raw: string | undefined | null): ParsedLanguage[] {
  if (!raw) return [];
  return String(raw)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(parseLanguageEntry);
}

export interface LanguageSummary {
  slug: string;
  name: string;
  count: number;
}

export function buildLanguageSummaries(
  alumniLanguages: (string | undefined | null)[]
): LanguageSummary[] {
  const countBySlug = new Map<string, { name: string; count: number }>();

  for (const raw of alumniLanguages) {
    for (const lang of parseLanguages(raw)) {
      const existing = countBySlug.get(lang.slug);
      if (existing) {
        existing.count += 1;
      } else {
        countBySlug.set(lang.slug, { name: lang.name, count: 1 });
      }
    }
  }

  return Array.from(countBySlug.entries())
    .map(([slug, { name, count }]) => ({ slug, name, count }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
