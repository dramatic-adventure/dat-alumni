/**
 * deriveProfileState — one pure, memoizable selector over the Profile Studio's
 * live form state. It powers the "Your public profile" preview card:
 *   - `preview`      → the at-a-glance card (name / title / location / headshot / headline)
 *   - `completeness` → the dynamic progress bar (filled / total essentials)
 *   - `featureFlags` → the "Take it further" tiles (done vs. show-the-ad)
 *
 * No data fetching, no React — callers pass a flat snapshot of form state and
 * memoize the result. See PublicProfilePreview.tsx for the consumer.
 */

export type DeriveProfileInput = {
  // ── preview ──────────────────────────────────────────────
  name: string;
  currentTitle: string;
  /** Comma-separated DAT roles (e.g. "Actor, Director") — used as the title fallback. */
  roles: string;
  location: string;
  secondLocation: string;
  isBiCoastal: boolean;
  /** currentHeadshotUrl — drives the card image (placeholder when empty). */
  headshotUrl: string;
  /** url OR uploaded id present — drives the completeness "headshot" essential. */
  hasHeadshot: boolean;
  /** = currentUpdateText (the headline line). */
  headline: string;
  slug: string;

  // ── completeness essentials (raw, "filled" = non-empty) ──
  bioLong: string;
  identityTags: string;
  practiceTags: string;
  exploreCareTags: string;
  languages: string;
  /** website || publicEmail || any social handle. */
  hasConnect: boolean;

  // ── feature-flag presence ────────────────────────────────
  hasMedia: boolean;
  hasStoryMapStory: boolean;
  hasJourneyCard: boolean;
  hasHighlight: boolean;
  hasUpcomingEvent: boolean;
};

export type DerivedProfileState = {
  preview: {
    name: string;
    title: string;
    location: string;
    headshotUrl: string;
    headline: string;
    slug: string;
  };
  completeness: {
    filled: number;
    total: number;
    /** 0–100, rounded. */
    pct: number;
    missing: string[];
  };
  featureFlags: {
    hasMedia: boolean;
    hasStoryMapStory: boolean;
    hasJourneyCard: boolean;
    hasHighlight: boolean;
    hasUpcomingEvent: boolean;
  };
};

const nonEmpty = (v: string | null | undefined) => String(v ?? "").trim().length > 0;

function combineLocation(loc: string, second: string, biCoastal: boolean): string {
  const a = String(loc ?? "").trim();
  const b = String(second ?? "").trim();
  if (biCoastal && a && b) return `${a} · ${b}`;
  if (biCoastal && !a && b) return b;
  return a;
}

export function deriveProfileState(form: DeriveProfileInput): DerivedProfileState {
  // The 8 essentials that help a visitor recognize and follow the alum.
  const essentials: Array<{ key: string; filled: boolean }> = [
    { key: "headshot", filled: form.hasHeadshot },
    { key: "location", filled: nonEmpty(form.location) },
    { key: "bio", filled: nonEmpty(form.bioLong) },
    { key: "identityTags", filled: nonEmpty(form.identityTags) },
    { key: "practiceTags", filled: nonEmpty(form.practiceTags) },
    { key: "exploreCareTags", filled: nonEmpty(form.exploreCareTags) },
    { key: "languages", filled: nonEmpty(form.languages) },
    { key: "connect", filled: form.hasConnect },
  ];

  // Title shows the alum's current title if set, otherwise their first DAT role.
  const firstRole =
    String(form.roles ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)[0] ?? "";
  const titleResolved = nonEmpty(form.currentTitle)
    ? String(form.currentTitle).trim()
    : firstRole;

  const total = essentials.length;
  const filled = essentials.filter((e) => e.filled).length;
  const missing = essentials.filter((e) => !e.filled).map((e) => e.key);
  const pct = total > 0 ? Math.round((filled / total) * 100) : 0;

  return {
    preview: {
      name: String(form.name ?? "").trim(),
      title: titleResolved,
      location: combineLocation(form.location, form.secondLocation, form.isBiCoastal),
      headshotUrl: String(form.headshotUrl ?? "").trim(),
      headline: String(form.headline ?? "").trim(),
      slug: String(form.slug ?? "").trim(),
    },
    completeness: { filled, total, pct, missing },
    featureFlags: {
      hasMedia: form.hasMedia,
      hasStoryMapStory: form.hasStoryMapStory,
      hasJourneyCard: form.hasJourneyCard,
      hasHighlight: form.hasHighlight,
      hasUpcomingEvent: form.hasUpcomingEvent,
    },
  };
}
