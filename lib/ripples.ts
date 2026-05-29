// lib/ripples.ts
//
// Ripple data model + loader (SCAFFOLD).
//
// A "Ripple" is a win that kept going after a project ended — a club still
// meeting, an artist who returned as a leader, a piece that found a second
// life. Ripples feed three surfaces:
//   - project pages   (/projects/[slug])        — filtered by projectSlugs
//   - alumni profiles (/alumni/[slug])          — filtered by alumniSlugs
//   - the archive     (/ripple-effect)          — featured + filterable
//
// STATUS: scaffold only. `loadRipples()` returns [] today, so every "The
// Ripples" section hides gracefully. The intended source is the same
// Google Sheets → CSV → Netlify Blobs pipeline used for alumni/stories
// (see lib/loadCsv.ts, lib/csvUrls.ts), or a Neon table if a moderation UI
// is wanted. Wire that up to switch ripples on with no UI changes.

/** The six ripple types mirror the categories on /ripple-effect. */
export type RippleType =
  | "production"        // a production made / restaged
  | "leadership"        // an artist returned as a leader / teaching artist
  | "club"              // a drama club still active
  | "career"            // a career / opportunity that grew from the work
  | "community"         // lasting community impact
  | "relationship";     // an ongoing partnership / relationship

export type RippleStatus = "submitted" | "approved" | "featured";
export type RippleSource = "alum-submitted" | "staff";

export type Ripple = {
  id: string;
  headline: string;
  body: string;
  type: RippleType;
  /** Feeds project pages. */
  projectSlugs: string[];
  /** Feeds alumni profiles. */
  alumniSlugs: string[];
  /** Optional cause taxonomy hooks. */
  causeSlugs?: string[];
  /** External or internal link. */
  link?: string;
  imageUrl?: string;
  /** "YYYY-MM-DD" */
  date?: string;
  status: RippleStatus;
  source: RippleSource;
};

export type LoadRipplesOptions = {
  /** Only return ripples tagged to this project slug. */
  projectSlug?: string;
  /** Only return ripples tagged to this alumni slug. */
  alumniSlug?: string;
  /** Status filter — defaults to approved + featured (public-visible). */
  statuses?: RippleStatus[];
};

const PUBLIC_STATUSES: RippleStatus[] = ["approved", "featured"];

/**
 * Load ripples, optionally filtered by project/alumni and status.
 *
 * TODO: replace the empty source with the real Sheets→CSV→Blobs pipeline
 * (or a Neon query). Until then this returns [] and all ripple UI hides.
 */
export async function loadRipples(
  options: LoadRipplesOptions = {}
): Promise<Ripple[]> {
  // TODO: fetch + normalize real ripple records here.
  const all: Ripple[] = [];

  const statuses = options.statuses ?? PUBLIC_STATUSES;

  return all.filter((r) => {
    if (!statuses.includes(r.status)) return false;
    if (options.projectSlug && !r.projectSlugs.includes(options.projectSlug)) {
      return false;
    }
    if (options.alumniSlug && !r.alumniSlugs.includes(options.alumniSlug)) {
      return false;
    }
    return true;
  });
}
