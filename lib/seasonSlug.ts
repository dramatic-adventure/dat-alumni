export function getSeasonNumberFromSlug(slug: string): number | null {
  const m = (slug ?? "").toLowerCase().trim().match(/season-(\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}
