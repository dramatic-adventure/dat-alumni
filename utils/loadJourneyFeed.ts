// utils/loadJourneyFeed.ts
import { loadJourneyUpdates } from '../lib/loadJourneyUpdates';
import type { Update, SpotlightUpdate, HighlightCategory } from '../lib/types';

// Minimal mapper: Update -> SpotlightUpdate
function toSpotlight(u: Update): SpotlightUpdate {
  // Some CSVs store multiple URLs in a comma/pipe list; grab the first
  const firstMedia =
    (u.mediaUrls || '')
      .split(/[,\|]/)
      .map(s => s.trim())
      .filter(Boolean)[0] || undefined;

  return {
    // ids / keys
    id: u.updateId,
    slug: u.profileSlug,
    artistId: u.profileSlug, // fallback; replace if you have a separate artistId

    // content
    headline: u.title,
    subheadlineTitle: u.subtitle || undefined,
    body: u.body ?? u.bodyNote ?? '',

    // media / cta
    mediaUrl: firstMedia,
    ctaText: u.ctaText || undefined,
    ctaLink: u.ctaUrl ?? u.ctaLink ?? undefined,

    // meta
    tag: u.tag || undefined,
    evergreen: u.evergreen ?? false,
    eventDate: u.eventDate || undefined,
    sortDate: u.sortDate || undefined,
    location: u.location || undefined,

    // category — narrow to your union if possible
    category: (u.category as HighlightCategory) || undefined,
  };
}

export async function loadJourneyFeed(): Promise<SpotlightUpdate[]> {
  // 1) Load raw Update[]
  const all = await loadJourneyUpdates();

  // 2) Map to SpotlightUpdate[]
  const spotlight = (all as Update[]).map(toSpotlight);

  // 3) Sort by sortDate (desc), skip items without sortDate
  const sorted = spotlight
    .filter(u => !!u.sortDate)
    .sort(
      (a, b) =>
        new Date(b.sortDate as string).getTime() -
        new Date(a.sortDate as string).getTime()
    );

  // 4) Deduplicate by slug (artist/profile)
  const seen = new Set<string>();
  const deduped: SpotlightUpdate[] = [];
  for (const upd of sorted) {
    const key = upd.slug ?? '';
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(upd);
  }

  return deduped;
}
